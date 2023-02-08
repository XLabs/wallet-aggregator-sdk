import EventEmitter from "eventemitter3";
import { ChainId } from "./constants";

export interface WalletEvents {
  connect(): void;
  disconnect(): void;
}

export enum WalletState {
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  Loadable = 'Loadable',
  Unsupported = 'Unsupported'
}

export interface SendTransactionResult<R> {
  id: string;
  data?: R;
}

export type Address = string;
export type IconSource = string;
export type Signature = Uint8Array;

export type BaseUnsignedTransaction = any;
export type BaseSignedTransaction = any;
export type BaseSubmitTransactionResult = any;
export type BaseMessage = any;
export type SignMessageResult = any;

export abstract class Wallet<
  BUT extends BaseUnsignedTransaction = any,
  BST extends BaseSignedTransaction = any,
  R extends BaseSubmitTransactionResult = any,
  BM extends BaseMessage = any,
  MR extends SignMessageResult = any,
  E extends WalletEvents = any
> extends EventEmitter<E> {
  abstract getName(): string;
  abstract getUrl(): string;
  abstract connect(): Promise<Address[]>;
  abstract disconnect(): Promise<void>;
  abstract getChainId(): ChainId;
  abstract getAddress(): Address | undefined;
  abstract getAddresses(): Address[];
  abstract setMainAddress(address: Address): void
  abstract getBalance(): Promise<string>;
  abstract signTransaction(tx: BUT): Promise<BST>;
  abstract sendTransaction(tx: BST): Promise<SendTransactionResult<R>>;
  abstract signMessage(msg: BM): Promise<MR>;
  abstract getIcon(): IconSource;
  abstract isConnected(): boolean;

  async signAndSendTransaction(tx: any): Promise<SendTransactionResult<R>> {
    const signed = await this.signTransaction(tx)
    return this.sendTransaction(tx)
  }

  getWalletState(): WalletState {
    // default
    return WalletState.Installed;
  }
}
