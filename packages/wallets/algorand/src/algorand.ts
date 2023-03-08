import { Address, ChainId, CHAINS, SendTransactionResult, Signature, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from 'algosdk';

export type SubmittedTransactionMap = Record<string, string>
export type AlgorandMessage = Uint8Array

/** Algorand Node configuration */
export interface AlgorandNodeConfig {
  url: string;
  token?: string;
  port?: string;
}

/** Algorand Indexer configuration */
export interface AlgorandIndexerConfig {
  url: string;
}

/** Algorand Wallet constructor parameters */
export interface AlgorandWalletParams {
  /** Algorand Node configuration */
  node?: AlgorandNodeConfig;
  /** Algorand indexer configuration */
  indexer?: AlgorandIndexerConfig;
  /** Amount of rounds to wait for transaction confirmation. Defaults to 1000. */
  waitRounds?: number;
  /** Default account. The wallet assumes this account has already been connected to/enabled. */
  defaultAccount?: Address;
}

/** Algorand Wallet configuration */
export interface AlgorandWalletConfig {
  /** Algorand Node configuration */
  node: AlgorandNodeConfig;
  /** Algorand indexer configuration */
  indexer: AlgorandIndexerConfig;
  /** Amount of rounds to wait for transaction confirmation. Defaults to 1000. */
  waitRounds: number;
}

export interface AlgorandNetworkInfo {
  genesisID: string;
  genesisHash: string;
}

const DEFAULT_CONFIG: AlgorandWalletConfig = {
  node: { url: 'https://node.algoexplorerapi.io' },
  indexer: { url: 'https://indexer.algoexplorerapi.io' },
  waitRounds: 1000
}

interface AccountDataResponse {
  account: {
    amount: number;
  }
}

interface SendTransactionResponse {
  txId: string;
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
  protected config: AlgorandWalletConfig;
  protected accounts: Address[];
  protected account: Address | undefined;
  protected networkInfo?: AlgorandNetworkInfo;

  constructor({ defaultAccount, ...config}: AlgorandWalletParams = {}) {
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

  getNetworkInfo(): AlgorandNetworkInfo | undefined {
    return this.networkInfo;
  }

  async getBalance(): Promise<string> {
    if (!this.account) throw new Error('Not connected');

    const res = await fetch(`${this.config.indexer.url}/v2/accounts/${this.account}`);
    const json = await res.json() as AccountDataResponse;
    return json.account.amount.toString();
  }

  async sendTransaction(signedTx: EncodedSignedTransaction): Promise<SendTransactionResult<SubmittedTransactionMap>> {
    const algod = this.buildClient();
    const { txId } = await algod.sendRawTransaction(signedTx).do() as SendTransactionResponse;
    const info = await algosdk.waitForConfirmation(algod, txId, this.config.waitRounds);
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
