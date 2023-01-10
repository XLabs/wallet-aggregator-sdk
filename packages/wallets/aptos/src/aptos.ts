import { ChainId, CHAINS, SendTransactionResult, Wallet, WalletState } from "wallet-aggregator-core";
import { BaseWalletAdapter } from "@manahippo/aptos-wallet-adapter";

export type AptosAdapter = BaseWalletAdapter;

export class AptosWallet extends Wallet {
  constructor(private readonly adapter: AptosAdapter) {
    super();
  }

  getAdapter(): AptosAdapter {
    return this.adapter;
  }

  getName(): string {
    return this.adapter.name;
  }

  connect(): Promise<void> {
    return this.adapter.connect();
  }

  disconnect(): Promise<void> {
    return this.adapter.disconnect();
  }

  getChainId(): ChainId {
    return CHAINS['aptos'];
  }

  getPublicKey(): string | undefined {
    return this.adapter.publicAccount.address?.toString();
  }

  getBalance(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  signTransaction(tx: any): Promise<any> {
    return tx;
  }

  async sendTransaction(tx: any): Promise<SendTransactionResult> {
    const { hash } = await this.adapter.signAndSubmitTransaction(tx);
    return {
      id: hash
    }
  }

  signMessage(msg: Uint8Array): Promise<any> {
    return this.adapter.signMessage(msg);
  }

  getIcon(): string {
    return this.adapter.icon;
  }

  getWalletState(): WalletState {
    const state = this.adapter.readyState;
    if (!(state in WalletState)) {
      throw new Error(`Unknown wallet state ${state}`);
    }
    return WalletState[state];
  }
}