import { ChainId, CHAINS, NotSupported, SendTransactionResult, Wallet, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import { BaseWalletAdapter, NetworkInfo, SignMessagePayload, SignMessageResponse } from "@manahippo/aptos-wallet-adapter";
import { Types } from "aptos";

export type AptosAdapter = BaseWalletAdapter;
export interface AptosSubmitResult {
  hash: Types.HexEncodedBytes
}

export type AptosMessage = string | SignMessagePayload | Uint8Array;
export type SignedAptosMessage = string | SignMessageResponse;

/**
 * An abstraction over Aptos blockchain wallets.
 * 
 * This class works as a wrapper over the adapters provided by the `@manahippo/aptos-wallet-adapter` library. In order to use this class, simply create the adapter you wish to use and pass it as a constructor parameter:
 * 
 * ```ts
 * const martian = new AptosWallet(
    new MartianWalletAdapter()
  )
 * ```
 */
export class AptosWallet extends Wallet<
  Types.TransactionPayload,
  Types.TransactionPayload,
  AptosSubmitResult,
  NetworkInfo,
  AptosMessage,
  SignedAptosMessage
> {
  /**
   * @param adapter The Aptos wallet adapter which will serve as the underlying connection to the wallet
   */
  constructor(private readonly adapter: AptosAdapter) {
    super();
  }

  /** Retrieve the underlying Aptos adapter */
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

  getNetworkInfo() {
    return this.adapter.network;
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

  setMainAddress(): void {
    throw new NotSupported();
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  signTransaction(tx: Types.TransactionPayload): Promise<Types.TransactionPayload> {
    return Promise.resolve(tx);
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