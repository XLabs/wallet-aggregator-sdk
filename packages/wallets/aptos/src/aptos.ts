import { ChainId, CHAINS, SendTransactionResult, Wallet, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import { BaseWalletAdapter, SignMessagePayload, SignMessageResponse } from "@manahippo/aptos-wallet-adapter";
import { Types } from "aptos";

export type AptosAdapter = BaseWalletAdapter;
export interface AptosSubmitResult {
  hash: Types.HexEncodedBytes
}

export type AptosMessage = string | SignMessagePayload | Uint8Array;
export type SignedAptosMessage = string | SignMessageResponse;

export class AptosWallet extends Wallet<
  Types.TransactionPayload,
  Types.TransactionPayload,
  AptosSubmitResult,
  AptosMessage,
  SignedAptosMessage
> {
  constructor(private readonly adapter: AptosAdapter) {
    super();
  }

  getAdapter(): AptosAdapter {
    return this.adapter;
  }

  getName(): string {
    return this.adapter.name;
  }

  getUrl(): string {
    return this.adapter.url;
  }

  async connect(): Promise<string[]> {
    await this.adapter.connect();
    return this.getAddresses()
  }

  isConnected(): boolean {
    return this.adapter.connected;
  }

  disconnect(): Promise<void> {
    return this.adapter.disconnect();
  }

  getChainId(): ChainId {
    return CHAINS['aptos'];
  }

  getAddress(): string | undefined {
    return this.adapter.publicAccount.address?.toString();
  }

  getAddresses(): string[] {
    const address = this.getAddress()
    return address ? [ address ] : []
  }

  setMainAddress(address: string): void {
    throw new Error("Not supported");
  }

  getBalance(): Promise<string> {
    throw new Error("Not supported");
  }

  async signTransaction(tx: Types.TransactionPayload): Promise<Types.TransactionPayload> {
    return tx;
  }

  async sendTransaction(tx: Types.TransactionPayload): Promise<SendTransactionResult<AptosSubmitResult>> {
    const result = await this.adapter.signAndSubmitTransaction(tx);
    return {
      id: result.hash,
      data: result
    }
  }

  signMessage(msg: AptosMessage): Promise<SignedAptosMessage> {
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