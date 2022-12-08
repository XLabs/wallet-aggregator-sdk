
export type TxParams = object;
export type Tx = object;
export type SignedTx = object;
export type TxResult = object;
export type Message = any;
export type SignedMessage = any;

export abstract class Wallet {
  abstract getName(): string;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getChainId(): number;
  abstract getPublicKey(): string | undefined;
  abstract getBalance(): Promise<string>;
  abstract signTransaction(tx: any): Promise<any>;
  abstract sendTransaction(tx: any): Promise<any>;
  abstract signMessage(tx: Uint8Array): Promise<any>;
}
