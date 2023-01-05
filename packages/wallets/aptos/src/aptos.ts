import { ChainId, CHAINS, Wallet } from "wallet-aggregator-core";
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

  sendTransaction(tx: any): Promise<any> {
    return this.adapter.signAndSubmitTransaction(tx)
  }

  signMessage(msg: Uint8Array): Promise<any> {
    return this.adapter.signMessage(msg);
  }

  getIcon(): string {
    return this.adapter.icon;
  }
}