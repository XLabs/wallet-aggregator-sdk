import { BaseFeatures } from "@xlabs-libs/wallet-aggregator-core";

export interface AccountDataResponse {
  account: {
    amount: number;
  };
}

export interface SendTransactionResponse {
  txId: string;
}

export type EncodedSignedTransaction = string;
export type SignTransactionResult = (EncodedSignedTransaction | null)[];

export type SubmittedTransactionMap = Record<string, string>;
export type AlgorandMessage = Uint8Array;

/** Algorand Node configuration */
export interface AlgorandNodeConfig {
  url: string;
  token?: string;
  port?: string;
}

/** Algorand Indexer configuration */
export interface AlgorandIndexerConfig {
  url: string;
}

/** Algorand Wallet constructor parameters */
export interface AlgorandWalletParams {
  /** Algorand Node configuration */
  node?: AlgorandNodeConfig;
  /** Algorand indexer configuration */
  indexer?: AlgorandIndexerConfig;
  /** Amount of rounds to wait for transaction confirmation. Defaults to 1000. */
  waitRounds?: number;
  /** Default account. The wallet assumes this account has already been connected to/enabled. */
  defaultAccount?: string;
}

/** Algorand Wallet configuration */
export interface AlgorandWalletConfig {
  /** Algorand Node configuration */
  node: AlgorandNodeConfig;
  /** Algorand indexer configuration */
  indexer: AlgorandIndexerConfig;
  /** Amount of rounds to wait for transaction confirmation. Defaults to 1000. */
  waitRounds: number;
}

export interface AlgorandNetworkInfo {
  genesisID: string;
  genesisHash: string;
}

export interface MultisigMetadata {
  /**
   * Multisig version.
   */
  version: number;

  /**
   * Multisig threshold value. Authorization requires a subset of signatures,
   * equal to or greater than the threshold value.
   */
  threshold: number;

  /**
   * List of Algorand addresses of possible signers for this
   * multisig. Order is important.
   */
  addrs: string[];
}

export interface SignerTransaction {
  /**
   * Base64 encoding of the canonical msgpack encoding of a Transaction.
   */
  txn: string;

  /**
   * Optional authorized address used to sign the transaction when the account
   * is rekeyed. Also called the signor/sgnr.
   */
  authAddr?: string;

  /**
   * Multisig metadata used to sign the transaction
   */
  msig?: MultisigMetadata;
  /**
   * Optional list of addresses that must sign the transactions
   */
  signers?: string[];
  /**
   * Optional base64 encoding of the canonical msgpack encoding of a
   * SignedTxn corresponding to txn, when signers=[]
   */
  stxn?: string;
  /**
   * Optional message explaining the reason of the transaction
   */
  message?: string;
  /**
   * Optional message explaining the reason of this group of transaction
   * Field only allowed in the first transaction of a group
   */
  groupMessage?: string;
}

export interface SignTxnsError<T = unknown> extends Error {
  code: number;
  data?: T;
}

enum Features {
  TealSign = "TealSign",
}
export type AlgorandFeatures = BaseFeatures | Features;
export const AlgorandFeatures = {
  ...BaseFeatures,
  ...Features,
};

export enum AlgorandWalletType {
  Defly = "defly",
  Ledger = "ledger",
  Pera = "pera",
}
