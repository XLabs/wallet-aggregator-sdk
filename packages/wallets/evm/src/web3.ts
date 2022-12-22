import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from 'ethers';
import { EVMWallet } from "./evm";

// detectEthereumProvider does not export its return type interface
export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

export class EVMWeb3Wallet extends EVMWallet {
  private metamaskProvider?: MetaMaskEthereumProvider;

  constructor() {
    super();
  }

  getName(): string {
    return 'Eth Metamask';
  }

  async innerConnect(): Promise<void> {
    this.metamaskProvider = await detectEthereumProvider() || undefined;

    if (!this.metamaskProvider) throw new Error('Failed to detect provider')

    this.provider = new ethers.providers.Web3Provider(
      this.metamaskProvider,
      'any'
    );

    this.metamaskProvider!.on('accountsChanged', () => this.onAccountsChanged());
    this.metamaskProvider!.on('chainChanged', (chainId: number) => this.onChainChanged(chainId));

    await this.provider.send('eth_requestAccounts', []);
  }

  async innerDisconnect(): Promise<void> {
    this.metamaskProvider?.removeAllListeners();
    this.metamaskProvider = undefined;
  }
}