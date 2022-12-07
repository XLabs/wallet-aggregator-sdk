import MyAlgoConnect from '@randlabs/myalgo-connect';
import algosdk from 'algosdk';
import { CHAINS } from './constants';
import { Wallet } from "./wallet";

type AlgorandAddress = string;

export class AlgorandWallet extends Wallet {
  private readonly WAIT_ROUNDS = 5;
  private readonly client: MyAlgoConnect;
  private accounts: AlgorandAddress[];

  constructor() {
    super();
    this.client = new MyAlgoConnect();
    this.accounts = [];
  }

  getName(): string {
    return 'MyAlgo';
  }

  async connect(): Promise<void> {
    const accounts = await this.client.connect();
    this.accounts = accounts.map(a => a.address);
  }

  async disconnect(): Promise<void> {
    this.accounts = [];
  }

  getChainId(): number {
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

  async getPublicKey(): Promise<string | undefined> {
    return this.accounts.length > 0 ? this.accounts[0] : undefined;
  }

  async sendTransaction(signedTx: Uint8Array): Promise<any> {
    const algod = new algosdk.Algodv2('', 'https://node.testnet.algoexplorerapi.io', '');
    const { txId } = await algod.sendRawTransaction(signedTx).do();
    return await algosdk.waitForConfirmation(algod, txId, this.WAIT_ROUNDS);
  }

  async signMessage(msg: Uint8Array): Promise<any> {
    const pk = await this.getPublicKey();
    return this.client.signBytes(msg, pk!);
  }
}
