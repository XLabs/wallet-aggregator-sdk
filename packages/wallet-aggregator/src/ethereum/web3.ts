import { TransactionRequest } from "@ethersproject/abstract-provider";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from 'ethers';
import { EthereumWallet } from "./ethereum";

// type EthProvider = ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc;

export class EthereumWeb3Wallet extends EthereumWallet {
  private provider?: ethers.providers.Web3Provider;  

  constructor() {
    super();
  }

  getName(): string {
    return 'Eth Metamask';
  }

  async connect(): Promise<void> {
    // // TODO: retrieve network and other info
    // this.provider.send('eth_requestAccounts', []);
    const detectedProvider = await detectEthereumProvider();

    this.provider = new ethers.providers.Web3Provider(
      // @ts-ignore
      detectedProvider,
      'any'
    );

    await this.provider.send('eth_requestAccounts', []);
  }

  async disconnect(): Promise<void> {
  }

  async getPublicKey(): Promise<string> {
    if (!this.provider) throw new Error('Not connected');

    return this.provider.getSigner().getAddress();
  }

  async createTransaction(params: object): Promise<object> {
    return params;
  }

  async signTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    // return this.provider.getSigner().signTransaction(tx);
    return tx;
  }

  async sendTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner().sendTransaction(tx);
  }

  async signMessage(msg: Uint8Array): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner().signMessage(msg);
  }

  getSigner(): ethers.Signer {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner();
  }
}