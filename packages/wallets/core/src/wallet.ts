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

export abstract class Wallet<E extends WalletEvents = any> extends EventEmitter<E> {
  abstract getName(): string;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getChainId(): ChainId;
  abstract getPublicKey(): string | undefined;
  abstract getBalance(): Promise<string>;
  abstract signTransaction(tx: any): Promise<any>;
  abstract sendTransaction(tx: any): Promise<any>;
  abstract signMessage(msg: Uint8Array): Promise<any>;
  abstract getIcon(): string;
  getWalletState(): WalletState {
    // default
    return WalletState.Installed;
  }
}
