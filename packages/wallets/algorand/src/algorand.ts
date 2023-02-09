import { Address, ChainId, CHAINS, SendTransactionResult, Signature, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from 'algosdk';

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

export interface AlgorandWalletParams {
  node?: AlgorandNodeConfig;
  indexer?: AlgorandIndexerConfig;
  defaultAccount?: string;
}

export interface AlgorandWalletConfig {
  node: AlgorandNodeConfig;
  indexer: AlgorandIndexerConfig;
}

export interface AlgorandNetworkInfo {
  genesisID: string;
  genesisHash: string;
}

const DEFAULT_CONFIG: AlgorandWalletConfig = {
  node: { url: 'https://node.algoexplorerapi.io' },
  indexer: { url: 'https://indexer.algoexplorerapi.io' },
}

export type UnsignedTransaction = algosdk.Transaction | Uint8Array;
export type EncodedSignedTransaction = Uint8Array;

export abstract class AlgorandWallet extends Wallet<
  algosdk.Transaction,
  EncodedSignedTransaction,
  SubmittedTransactionMap,
  AlgorandNetworkInfo,
  AlgorandMessage,
  Signature
> {
  private readonly WAIT_ROUNDS = 5;
  protected config: AlgorandWalletConfig;
  protected accounts: Address[];
  protected account: Address | undefined;
  protected networkInfo?: AlgorandNetworkInfo;

  constructor({ defaultAccount, ...config }: AlgorandWalletParams = {}) {
    super();
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.accounts = defaultAccount ? [ defaultAccount ] : [];
    this.account = defaultAccount;
  }

  protected abstract innerConnect(): Promise<Address[]>;
  protected abstract innerDisconnect(): Promise<void>;

  async connect(): Promise<Address[]> {
    const accounts = await this.innerConnect();
    this.accounts = accounts;
    this.account = this.accounts[0];

    this.emit('connect');

    const { genesisHash, genesisID } = await this.buildClient().getTransactionParams().do();
    this.networkInfo = {
      genesisHash,
      genesisID
    }

    return this.accounts;
  }

  abstract signTransaction(tx: UnsignedTransaction): Promise<EncodedSignedTransaction>;
  abstract signTransaction(tx: UnsignedTransaction[]): Promise<EncodedSignedTransaction[]>;
  abstract signTransaction(tx: UnsignedTransaction | UnsignedTransaction[]): Promise<EncodedSignedTransaction | EncodedSignedTransaction[]>;

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    this.accounts = [];
    this.account = undefined;
    this.networkInfo = undefined;
    this.emit('disconnect');
  }

  isConnected(): boolean {
    return !!this.account;
  }

  getChainId(): ChainId {
    return CHAINS['algorand'];
  }

  getAddress(): string | undefined {
    return this.account;
  }

  getAddresses(): string[] {
    return this.accounts;
  }

  setMainAddress(account: Address): void {
    if (!this.accounts.includes(account)) {
      throw new Error('Unknown address')
    }
    this.account = account;
  }

  getNetworkInfo(): AlgorandNetworkInfo | undefined {
    return this.networkInfo;
  }

  async getBalance(): Promise<string> {
    if (this.accounts.length === 0) throw new Error('Not connected');

    const address = this.getAddress();
    const res = await fetch(`${this.config.indexer.url}/v2/accounts/${address}`);
    const json = await res.json();
    return json.account.amount.toString();
  }

  async sendTransaction(signedTx: EncodedSignedTransaction): Promise<SendTransactionResult<SubmittedTransactionMap>> {
    const algod = this.buildClient();
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    const info = await algosdk.waitForConfirmation(algod, txId, this.WAIT_ROUNDS);
    return {
      id: txId,
      data: info
    };
  }

  private buildClient(): algosdk.Algodv2 {
    return new algosdk.Algodv2(
      this.config.node.token || '',
      this.config.node.url,
      this.config.node.port || ''
    );
  }
}
