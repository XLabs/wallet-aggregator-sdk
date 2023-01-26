import MyAlgoConnect, { EncodedTransaction } from '@randlabs/myalgo-connect';
import algosdk from 'algosdk';
import { Address, ChainId, CHAINS, IconSource, SendTransactionResult, Signature, Wallet } from "@xlabs-libs/wallet-aggregator-core";

export type SubmittedTransactionMap = Record<string, string>
export type AlgorandMessage = Uint8Array

export interface AlgorandNodeConfig {
  url: string;
  token?: string;
  port?: string;
}

export interface AlgorandIndexerConfig {
  url: string;
}

export interface MyAlgoConnectConfig {
  bridgeUrl?: string;
  disableLedgerNano?: boolean;
}

export interface AlgorandWalletParams {
  node?: AlgorandNodeConfig;
  indexer?: AlgorandIndexerConfig;
  myAlgoConnect?: MyAlgoConnectConfig;
  defaultAccount?: string;
}

export interface AlgorandWalletConfig {
  node: AlgorandNodeConfig;
  indexer: AlgorandIndexerConfig;
  myAlgoConnect?: MyAlgoConnectConfig;
}

const DEFAULT_CONFIG: AlgorandWalletConfig = {
  node: { url: 'https://node.algoexplorerapi.io' },
  indexer: { url: 'https://indexer.algoexplorerapi.io' },
}

export type UnsignedTransaction = algosdk.Transaction | Uint8Array;
export type EncodedSignedTransaction = Uint8Array;

export class AlgorandWallet extends Wallet<
  algosdk.Transaction,
  EncodedSignedTransaction,
  SubmittedTransactionMap,
  AlgorandMessage,
  Signature
> {
  private readonly WAIT_ROUNDS = 5;
  private readonly client: MyAlgoConnect;
  private accounts: Address[];
  private account: Address | undefined;
  private config: AlgorandWalletConfig;

  constructor({ defaultAccount, ...config }: AlgorandWalletParams = {}) {
    super();
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.client = new MyAlgoConnect({ ...this.config?.myAlgoConnect });
    this.accounts = defaultAccount ? [ defaultAccount ] : [];
    this.account = defaultAccount;
  }

  getName(): string {
    return 'My Algo Wallet';
  }

  getUrl(): string {
    return 'https://wallet.myalgo.com';
  }

  async connect(): Promise<Address[]> {
    const accounts = await this.client.connect();
    this.accounts = accounts.map(a => a.address);
    this.account = this.accounts[0]

    this.emit('connect');

    return this.accounts
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
    this.emit('disconnect');
  }

  getChainId(): ChainId {
    return CHAINS['algorand'];
  }

  async signTransaction(tx: UnsignedTransaction): Promise<EncodedSignedTransaction>;
  async signTransaction(tx: UnsignedTransaction[]): Promise<EncodedSignedTransaction[]>;
  async signTransaction(tx: UnsignedTransaction | UnsignedTransaction[]): Promise<EncodedSignedTransaction | EncodedSignedTransaction[]> {
    const toSend = Array.isArray(tx) ? tx : [ tx ]
    const result = await this.client.signTransaction(
      toSend.map(t => t instanceof Uint8Array ? t : t.toByte())
    );

    if (Array.isArray(tx)) {
      return result.map(res => res.blob)
    };

    return result[0].blob;
  }

  getAddress(): Address | undefined {
    return this.account;
  }

  getAddresses(): Address[] {
    return this.accounts;
  }

  setMainAddress(account: Address): void {
    if (!this.accounts.includes(account)) {
      throw new Error('Unknown address')
    }
    this.account = account;
  }

  async sendTransaction(signedTx: EncodedSignedTransaction): Promise<SendTransactionResult<SubmittedTransactionMap>> {
    const algod = new algosdk.Algodv2(
      this.config.node.token || '',
      this.config.node.url,
      this.config.node.port || ''
    );
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    const info = await algosdk.waitForConfirmation(algod, txId, this.WAIT_ROUNDS);
    return {
      id: txId,
      data: info
    };
  }

  async signMessage(msg: AlgorandMessage): Promise<Signature> {
    const pk = await this.getAddress();
    return this.client.signBytes(msg, pk!);
  }

  async tealSign(data: Uint8Array, contractAddress: Address, signer: Address) {
    return this.client.tealSign(data, contractAddress, signer)
  }

  async getBalance(): Promise<string> {
    if (this.accounts.length === 0) throw new Error('Not connected');

    const address = this.getAddress();
    const res = await fetch(`${this.config.indexer.url}/v2/accounts/${address}`);
    const json = await res.json();
    return json.account.amount.toString();
  }

  getIcon(): IconSource {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI5Ljk1NjIgNTkuOTk5OUMyNC4wMzE3IDYwLjAwMDQgMTguMjQwMiA1OC4yNDQgMTMuMzEzOSA1NC45NTI5QzguMzg3NzIgNTEuNjYxOCA0LjU0ODEgNDYuOTgzOCAyLjI4MDY0IDQxLjUxMDRDMC4wMTMxOTEgMzYuMDM3IC0wLjU4MDI0MSAzMC4wMTQyIDAuNTc1Mzk1IDI0LjIwMzVDMS43MzEwMyAxOC4zOTI5IDQuNTgzODMgMTMuMDU1NCA4Ljc3MzAxIDguODY2MTZDMTEuNTUgNi4wNjQ3MiAxNC44NTMgMy44MzkzNyAxOC40OTI0IDIuMzE3ODhDMjIuMTMxNyAwLjc5NjM4NiAyNi4wMzU4IDAuMDA4NzA5NTIgMjkuOTgwMyA3LjE4MjA2ZS0wNUMzMy45MjQ5IC0wLjAwODU2NTg4IDM3LjgzMjQgMC43NjIwMDUgNDEuNDc4NCAyLjI2NzU1QzQ1LjEyNDMgMy43NzMwOSA0OC40MzcxIDUuOTgzOTUgNTEuMjI2MyA4Ljc3MzJDNTQuMDE1NiAxMS41NjI0IDU2LjIyNjQgMTQuODc1MiA1Ny43MzIgMTguNTIxMUM1OS4yMzc1IDIyLjE2NzEgNjAuMDA4MSAyNi4wNzQ2IDU5Ljk5OTQgMzAuMDE5MkM1OS45OTA4IDMzLjk2MzcgNTkuMjAzMSAzNy44Njc4IDU3LjY4MTYgNDEuNTA3MUM1Ni4xNjAxIDQ1LjE0NjUgNTMuOTM0OCA0OC40NDk1IDUxLjEzMzMgNTEuMjI2NUM0OC4zNTg4IDU0LjAxNjQgNDUuMDU4NSA1Ni4yMjgzIDQxLjQyMzUgNTcuNzM0M0MzNy43ODg0IDU5LjI0MDIgMzMuODkwOCA2MC4wMTAzIDI5Ljk1NjIgNTkuOTk5OVpNMzcuOTIzOCAyMS4wNDUzTDM4LjE2NjQgMjEuOTc5OEw0My4wNzczIDM5Ljc4MTJINDcuMDczMUw0MC4zNjk1IDE2LjY5Nkw0MC4yMDYzIDE2LjA2ODVIMzYuNzIxMkwzNi42NDAzIDE2LjE5NDNMMzMuMzc5OSAyMS45ODQzTDMwLjAzNyAyNy45MjI2TDI5Ljk1NjIgMjguMDY0OUwyOS45MTg3IDI3LjkyMjZMMjkuNTA2OSAyNi4zOTY1TDI4LjM2NTYgMjEuOTg0M0wyOC4yNDI4IDIxLjU0NTVMMjYuOTc4OCAxNi42OTQ1TDI2LjgxNTUgMTYuMDY3SDIzLjMzNjRMMjMuMjU1NiAxNi4xOTI4TDE5Ljk5NjYgMjEuOTg0M0wxNi42NTM4IDI3LjkyMjZMMTMuMzMxOSAzMy44Mzk5TDkuOTg5MTIgMzkuNzgxMkgxMy45ODE5TDE3LjMyNDggMzMuODQyOUwyMC42Njc2IDI3LjkyNzFMMjMuOTg5NCAyMS45ODg4TDI0LjUzOTEgMjEuMDQ4M0wyNC43ODMyIDIxLjk4ODhMMjUuODAxNiAyNS44OTkzTDI3LjA2NzEgMzAuNzY5N0wyNy41MDc1IDMyLjQzMDZMMjYuNzEzNyAzMy44NDI5TDIzLjM2NjQgMzkuNzgxMkgyNy4zNTkyTDI4Ljc3IDM3LjI3NTZMMzEuMjIxNyAzMi45MjQ5TDM0LjA0NDggMjcuOTI3MUwzNy4zNjY3IDIxLjk4ODhMMzcuOTE0OCAyMS4wNTI4TDM3LjkyMzggMjEuMDQ1M1oiIGZpbGw9IiMyNDVFQzYiLz4KPC9zdmc+Cg=='
  }
}
