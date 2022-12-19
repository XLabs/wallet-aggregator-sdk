import { TransactionRequest } from "@ethersproject/abstract-provider";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from 'ethers';
import { EthereumWallet } from "./ethereum";

// type EthProvider = ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc;

export class EthereumWeb3Wallet extends EthereumWallet {
  constructor() {
    super();
  }

  getName(): string {
    return 'Eth Metamask';
  }

  async innerConnect(): Promise<void> {
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

  async innerDisconnect(): Promise<void> {
  }
}