import {
  JsonObject,
  MsgExecuteContractEncodeObject,
} from "@cosmjs/cosmwasm-stargate";
import { Coin } from "@cosmjs/stargate";
import { CosmosWallet } from "./cosmos";
import { WALLETS } from "./wallets";
import { ResourceMap } from "./types";

/**
 * Helper method to build messages for smart contract execution to use along
 * sign transaction methods.
 */
export const buildExecuteMessage = (
  senderAddress: string,
  contractAddress: string,
  msg: JsonObject,
  funds?: readonly Coin[]
): MsgExecuteContractEncodeObject => {
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: {
      sender: senderAddress,
      contract: contractAddress,
      msg: new TextEncoder().encode(JSON.stringify(msg)),
      funds: [...(funds || [])].map((coin) => ({ ...coin })),
    },
  };
};

export const getWallets = (
  rpcs?: ResourceMap,
  rests?: ResourceMap
): CosmosWallet[] => {
  return Object.values(WALLETS).map(
    (w) =>
      new CosmosWallet({
        walletInfo: w,
        rpcs: rpcs,
        rests: rests,
      })
  );
};
