import { ExecuteInstruction } from "@cosmjs/cosmwasm-stargate";
import { EncodeObject } from "@cosmjs/proto-signing";
import { StdFee } from "@cosmjs/stargate";
import { WalletInfo } from "./wallets";

export type ResourceMap = Record<string, string>;

export interface CosmosWalletConfig {
  chainId?: string;
  rpcs?: ResourceMap;
  rests?: ResourceMap;
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

export interface AccountResponse {
  account: {
    "@type": string;
    base_account: {
      address: string;
      pub_key?: {
        "@type": string;
        key: string;
      };
      account_number: string;
      sequence: string;
    };
    code_hash: string;
  };
}
