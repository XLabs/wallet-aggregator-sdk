import {
  MsgExecuteContract,
  MsgSend,
  MsgTransfer,
} from "@injectivelabs/sdk-ts";
import { ResourceMap, WALLETS } from "@xlabs-libs/wallet-aggregator-cosmos";
import { MsgSend as CosmosMsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgTransfer as CosmosMsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import { MsgExecuteContract as CosmosMsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { CosmosEvmWallet } from "./cosmos-evm";

export const getWallets = (
  rpcs?: ResourceMap,
  rests?: ResourceMap
): CosmosEvmWallet[] => {
  return Object.values(WALLETS).map(
    (w) =>
      new CosmosEvmWallet({
        walletInfo: w,
        rpcs: rpcs,
        rests: rests,
      })
  );
};

export function mapMsgSend(msg: CosmosMsgSend): MsgSend {
  return MsgSend.fromJSON({
    srcInjectiveAddress: msg.fromAddress,
    dstInjectiveAddress: msg.toAddress,
    amount: msg.amount,
  });
}

export function mapMsgTransfer(msgTransfer: CosmosMsgTransfer): MsgTransfer {
  return MsgTransfer.fromJSON({
    amount: msgTransfer.token!,
    receiver: msgTransfer.receiver,
    port: msgTransfer.sourcePort,
    channelId: msgTransfer.sourceChannel,
    sender: msgTransfer.sender,
    height: msgTransfer.timeoutHeight
      ? {
          revisionHeight:
            Number(msgTransfer.timeoutHeight?.revisionHeight) || 0,
          revisionNumber:
            Number(msgTransfer.timeoutHeight?.revisionNumber) || 0,
        }
      : undefined,
    memo: msgTransfer.memo,
    timeout: Number(msgTransfer.timeoutTimestamp) || 0,
  });
}

export function mapMsgExecuteContract(
  msgExecute: CosmosMsgExecuteContract
): MsgExecuteContract {
  return MsgExecuteContract.fromJSON({
    ...msgExecute,
    msg: JSON.parse(Buffer.from(msgExecute.msg).toString()),
    contractAddress: msgExecute.contract,
  });
}
