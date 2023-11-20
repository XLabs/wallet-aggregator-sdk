import { ChainId as InjectiveChainId } from "@injectivelabs/ts-types";
import {
  MsgBroadcasterOptions,
  MsgBroadcasterTxOptions,
  Wallet as WalletType,
} from "@injectivelabs/wallet-ts";

export type BroadcasterOptions = Omit<MsgBroadcasterOptions, "walletStrategy">;

export interface InjectiveWalletConfig {
  /** Injective Network chain id to connect to */
  networkChainId: InjectiveChainId;
  /** Injective Wallet Type */
  type: WalletType;
  /** Message broadcaster options */
  broadcasterOptions: BroadcasterOptions;
  /** Disabled wallets */
  disabledWallets?: WalletType[];
}

export type InjectiveTransaction = MsgBroadcasterTxOptions;

export interface InjectiveNetworkInfo {
  id: string;
}

export type InjectiveEIP712Message = string;
export type InjectiveSignedEIP712Message = string;

export type ConcreteWalletConfig = Omit<
  InjectiveWalletConfig,
  "type" | "disabledWallets"
>;

declare global {
  interface Window {
    keplr: object;
    leap: object;
    cosmostation: object;
    okxwallet: Record<string, object>;
  }
}
