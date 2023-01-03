import MyAlgoConnect from '@randlabs/myalgo-connect';
import algosdk from 'algosdk';
import { ChainId, CHAINS, Wallet } from "wallet-aggregator-core";

type AlgorandAddress = string;

export interface AlgorandNodeConfig {
  url: string;
  token?: string;
  port?: string;
}

export interface AlgorandIndexerConfig {
  url: string;
}

export interface AlgorandWalletConfig {
  node: AlgorandNodeConfig;
  indexer: AlgorandIndexerConfig;
}

const DEFAULT_CONFIG: AlgorandWalletConfig = {
  node: { url: 'https://node.algoexplorerapi.io' },
  indexer: { url: 'https://indexer.algoexplorerapi.io' }
}

export class AlgorandWallet extends Wallet {
  private readonly WAIT_ROUNDS = 5;
  private readonly client: MyAlgoConnect;
  private accounts: AlgorandAddress[];
  private config: AlgorandWalletConfig;

  constructor(config?: AlgorandWalletConfig) {
    super();
    this.config = config || DEFAULT_CONFIG;
    this.client = new MyAlgoConnect();
    this.accounts = [];
  }

  getName(): string {
    return 'MyAlgo';
  }

  async connect(): Promise<void> {
    const accounts = await this.client.connect();
    this.accounts = accounts.map(a => a.address);
    this.emit('connect');
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
    this.emit('disconnect');
  }

  getChainId(): ChainId {
    return CHAINS['algorand'];
  }

  async createTransaction(params: any): Promise<object> {
    return new algosdk.Transaction({ ...params });
  }

  async signTransaction(tx: any): Promise<any> {
    const txsArray = Array.isArray(tx) ? tx : [ tx ];
    const result = await this.client.signTransaction(txsArray.map(tx => tx.toByte()));
    return result.map(s => s.blob);
  }

  getPublicKey(): string | undefined {
    return this.accounts.length > 0 ? this.accounts[0] : undefined;
  }

  async sendTransaction(signedTx: Uint8Array): Promise<any> {
    const algod = new algosdk.Algodv2(
      this.config.node.token || '',
      this.config.node.url,
      this.config.node.port || ''
    );
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    return await algosdk.waitForConfirmation(algod, txId, this.WAIT_ROUNDS);
  }

  async signMessage(msg: Uint8Array): Promise<any> {
    const pk = await this.getPublicKey();
    return this.client.signBytes(msg, pk!);
  }

  async getBalance(): Promise<string> {
    if (this.accounts.length === 0) throw new Error('Not connected');

    const address = this.getPublicKey();
    const res = await fetch(`${this.config.indexer.url}/v2/accounts/${address}`);
    const json = await res.json();
    return json.account.amount.toString();
  }

  getIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NTAgNjUwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkFMR09fTG9nb3NfMTkwMzIwPC90aXRsZT48ZyBpZD0ibElOVDdXIj48cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iNDQ0LjE4IDQ0NC4zMiA0MDYuODEgNDQ0LjMyIDM4Mi41NCAzNTQuMDQgMzMwLjM2IDQ0NC4zMyAyODguNjQgNDQ0LjMzIDM2OS4yOSAzMDQuNTcgMzU2LjMxIDI1Ni4wNSAyNDcuNTYgNDQ0LjM2IDIwNS44MiA0NDQuMzYgMzQzLjY0IDIwNS42NCAzODAuMTggMjA1LjY0IDM5Ni4xOCAyNjQuOTUgNDMzLjg4IDI2NC45NSA0MDguMTQgMzA5LjcxIDQ0NC4xOCA0NDQuMzIiLz48L2c+PC9zdmc+';
  }
}
