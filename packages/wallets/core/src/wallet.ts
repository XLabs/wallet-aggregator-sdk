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

export interface SendTransactionResult<R = any> {
  id: string;
  data?: R;
}

export type PublicKey = string;

export abstract class Wallet<R = any, E extends WalletEvents = any> extends EventEmitter<E> {
  abstract getName(): string;
  abstract connect(): Promise<PublicKey[]>;
  abstract disconnect(): Promise<void>;
  abstract getChainId(): ChainId;
  abstract getPublicKey(): PublicKey | undefined;
  abstract getBalance(): Promise<string>;
  abstract signTransaction(tx: any): Promise<any>;
  abstract sendTransaction(tx: any): Promise<SendTransactionResult<R>>;
  abstract signMessage(msg: Uint8Array): Promise<Uint8Array>;
  abstract getIcon(): string;
  getWalletState(): WalletState {
    // default
    return WalletState.Installed;
  }
}
