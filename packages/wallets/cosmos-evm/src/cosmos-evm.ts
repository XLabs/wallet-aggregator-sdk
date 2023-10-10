// import {
//   NotConnected,
//   SendTransactionResult,
// } from "@xlabs-libs/wallet-aggregator-core";
// import Long from "long";
// import {
//   CosmosWallet,
//   CosmosTransaction,
//   CosmosWalletConfig,
//   TxRaw,
// } from "@xlabs-libs/wallet-aggregator-cosmos";
// import { proto } from "evmosjs";
import { EncodeObject } from "@cosmjs/proto-signing";
import { DeliverTxResponse, SigningStargateClient } from "@cosmjs/stargate";
import {
  MsgExecuteContract,
  MsgSend,
  MsgTransfer,
  TxClient,
  createTransaction,
} from "@injectivelabs/sdk-ts";
import {
  NotConnected,
  SendTransactionResult,
} from "@xlabs-libs/wallet-aggregator-core";
import {
  AccountResponse,
  CosmosTransaction,
  CosmosWallet,
  CosmosWalletConfig,
  ExtensionWallet,
  TxRaw,
} from "@xlabs-libs/wallet-aggregator-cosmos";
import { MsgSend as CosmosMsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgTransfer as CosmosMsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import { MsgExecuteContract as CosmosMsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { mapMsgExecuteContract, mapMsgSend, mapMsgTransfer } from "./utils";
import Long from "long";

type Msg = MsgSend | MsgTransfer | MsgExecuteContract;
type CosmosMsg = CosmosMsgSend | CosmosMsgTransfer | CosmosMsgExecuteContract;

const TIMEOUT_HEIGHT = 1000;

export class CosmosEvmWallet extends CosmosWallet {
  constructor(config: CosmosWalletConfig) {
    super(config);
  }

  private async getAccount(address: string): Promise<AccountResponse> {
    if (!this.chainId) throw new Error("Chain id not set");
    const rest = this.rests[this.chainId];
    if (!rest) throw new Error("RPC not found");
    const response = await fetch(
      `${rest}/cosmos/auth/v1beta1/accounts/${address}`
    );
    const account = (await response.json()) as AccountResponse;
    return account;
  }

  private adaptMessage(msg: EncodeObject, client: SigningStargateClient): Msg {
    const decoded = (
      msg.value instanceof Uint8Array ? client.registry.decode(msg) : msg.value
    ) as CosmosMsg;
    switch (msg.typeUrl) {
      case "/cosmos.bank.v1beta1.MsgSend":
        return mapMsgSend(decoded as CosmosMsgSend);
      case "/ibc.applications.transfer.v1.MsgTransfer":
        return mapMsgTransfer(decoded as CosmosMsgTransfer);
      case "/cosmwasm.wasm.v1.MsgExecuteContract":
        return mapMsgExecuteContract(decoded as CosmosMsgExecuteContract);
      default:
        throw new Error("Unknown message type");
    }
  }

  async signTransaction(tx: CosmosTransaction): Promise<TxRaw> {
    if (!this.activeAccount) throw new NotConnected();
    if (!this.chainId) throw new Error("Chain id not set");
    const extension = this.getExtension();

    const client = await this.getSigningStargateClient();

    const { pubKey } = await extension.getKey(this.chainId);
    const pkey = Buffer.from(pubKey).toString("base64");

    const { account } = await this.getAccount(this.activeAccount.address);

    const height = await client.getHeight();

    const toSign = createTransaction({
      message: tx.msgs.map((msg) => this.adaptMessage(msg, client)),
      chainId: this.chainId,
      pubKey: pkey,
      fee: tx.fee,
      accountNumber: parseInt(account.base_account.account_number),
      sequence: parseInt(account.base_account.sequence),
      memo: tx.memo,
      timeoutHeight: height + TIMEOUT_HEIGHT,
    });

    const signer = await extension.getOfflineSigner(this.chainId);
    const signed = await signer.signDirect(this.activeAccount.address, {
      ...toSign.signDoc,
      accountNumber: Long.fromString(account.base_account.account_number),
    });

    return {
      ...signed.signed,
      signatures: [Buffer.from(signed.signature.signature, "base64")],
    };
  }

  async signAndSendTransaction(
    tx: CosmosTransaction
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    const signed = await this.signTransaction(tx);
    return this.sendTransaction(signed);
  }

  async sendTransaction(
    tx: TxRaw
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    if (!this.chainId) throw new Error("Chain id not set");

    const client = await this.getSigningStargateClient();
    const data = await client.broadcastTx(
      Buffer.from(TxClient.encode(tx), "base64")
    );
    return {
      id: data.transactionHash,
      data,
    };
  }

  private getExtension(): ExtensionWallet {
    const wallet = this.walletInfo.locate();
    if (!wallet) throw new Error("Extension not found");
    return wallet;
  }
}
