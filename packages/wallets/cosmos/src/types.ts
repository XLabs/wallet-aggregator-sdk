import { ExecuteInstruction } from "@cosmjs/cosmwasm-stargate";
import { EncodeObject } from "@cosmjs/proto-signing";
import { StdFee } from "@cosmjs/stargate";
import { WalletInfo } from "./wallets";

export type RpcMap = Record<string, string>;

export interface CosmosWalletConfig {
  chainId?: string;
  rpcs?: RpcMap;
  walletInfo: WalletInfo;
}

export interface CosmosConnectOptions {
  chainId?: string;
}

export interface CosmosTransaction {
  msgs: EncodeObject[];
  fee: StdFee;
  memo: string;
}

export interface CosmosExecuteTransaction {
  instructions: ExecuteInstruction[];
  fee: StdFee;
  memo?: string;
}

export interface TxRaw {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  signatures: Uint8Array[];
}
