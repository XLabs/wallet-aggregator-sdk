import { AccountData, StdFee, StdSignature } from "@cosmjs/amino";
import {
  ExecuteInstruction,
  ExecuteResult,
  JsonObject,
  MsgExecuteContractEncodeObject,
} from "@cosmjs/cosmwasm-stargate";
import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { Coin, DeliverTxResponse } from "@cosmjs/stargate";
import {
  SUPPORTED_WALLETS,
  connect,
  getSigningClient,
  getSigningCosmWasmClient,
  walletSignArbitrary,
} from "@sei-js/core";
import {
  BaseFeatures,
  CHAIN_ID_SEI,
  ChainId,
  NotConnected,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";
import { SeiWalletType, WALLETS } from "./wallets";

export type SeiChainId = "pacific-1" | "atlantic-2" | "sei-devnet-3";
export type GetWalletsOptions = Omit<SeiWalletConfig, "type">;
export interface SeiTransaction {
  msgs: EncodeObject[];
  fee: StdFee;
  memo: string;
}
export interface SeiExecuteTransaction {
  instructions: ExecuteInstruction[];
  fee: StdFee;
  memo?: string;
}

interface TxRaw {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  signatures: Uint8Array[];
}

export const getSupportedWallets = (config: GetWalletsOptions): SeiWallet[] => {
  return SUPPORTED_WALLETS.map(
    (w) =>
      new SeiWallet({
        ...config,
        type: w.windowKey,
      })
  );
};

export const getInstalledWallets = (config: GetWalletsOptions): SeiWallet[] => {
  return SUPPORTED_WALLETS.filter((w) => !!window[w.windowKey]).map(
    (w) =>
      new SeiWallet({
        ...config,
        type: w.windowKey,
      })
  );
};

export interface SeiWalletConfig {
  type: SeiWalletType;
  chainId: SeiChainId;
  rpcUrl: string;
}

/**
 * Helper method to build messages for smart contract execution to use along
 * sign transaction methods. The SeiWallet class also provides an executeMultiple
 * method which can be used instead.
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

/**
 * A class to interact with the Sei blockchain.
 *
 * Caveat on smart contract execution: sendTransaction and signAndSendTransaction
 * do not parse logs and events. You can parse them through the utility methods
 * offered by cosmjs libraries, or use the executeMultiple method instead.
 */
export class SeiWallet extends Wallet<
  typeof CHAIN_ID_SEI,
  void,
  SeiTransaction,
  TxRaw,
  TxRaw,
  DeliverTxResponse,
  SeiTransaction,
  DeliverTxResponse
> {
  private type: SeiWalletType;
  private chainId: SeiChainId;
  private rpcUrl: string;
  private activeAccount?: AccountData;
  private accounts: AccountData[] = [];
  private signer?: OfflineSigner;

  constructor(config: SeiWalletConfig) {
    super();
    this.type = config.type;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
  }

  getName(): string {
    return WALLETS[this.type]?.name || this.type;
  }

  getUrl(): string {
    return WALLETS[this.type]?.url || "https://www.seinetwork.io/";
  }

  getIcon(): string {
    return WALLETS[this.type]?.icon || "";
  }

  getChainId() {
    return CHAIN_ID_SEI;
  }

  getAddresses(): string[] {
    return this.accounts.map((a) => a.address);
  }

  setMainAddress(address: string): void {
    if (!this.accounts.find((a) => a.address === address))
      throw new Error("Address not found");
    this.activeAccount = this.accounts.find((a) => a.address === address);
  }

  getBalance(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  isConnected(): boolean {
    return !!this.signer;
  }

  getNetworkInfo() {
    return {
      chainId: this.chainId,
    };
  }

  async connect(): Promise<string[]> {
    const { offlineSigner, accounts } = await connect(this.type, this.chainId);
    this.signer = offlineSigner;
    this.accounts = [...accounts];
    this.activeAccount = accounts[0];
    return accounts.map((a) => a.address);
  }

  disconnect(): Promise<void> {
    this.accounts = [];
    this.activeAccount = undefined;
    this.signer = undefined;
    return Promise.resolve();
  }

  getAccounts(): string[] {
    return this.accounts.map((a) => a.address);
  }

  getAddress(): string | undefined {
    return this.activeAccount?.address;
  }

  async signTransaction(tx: SeiTransaction): Promise<TxRaw> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    // it doesn't matter if we use getSigningClient or getSigningCosmWasmClient
    // because the code to sign is the same for both
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/cosmwasm-stargate/src/signingcosmwasmclient.ts#L560
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/stargate/src/signingstargateclient.ts#L323
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    return await signer.sign(
      this.activeAccount.address,
      tx.msgs,
      tx.fee,
      tx.memo
    );
  }

  async sendTransaction(
    tx: TxRaw
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    const response = await signer.broadcastTx(tx.bodyBytes);
    return {
      id: response.transactionHash,
      data: response,
    };
  }

  async signAndSendTransaction(
    tx: SeiTransaction
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    const response = await signer.signAndBroadcast(
      this.activeAccount.address,
      tx.msgs,
      tx.fee,
      tx.memo
    );
    return {
      id: response.transactionHash,
      data: response,
    };
  }

  async executeMultiple(
    tx: SeiExecuteTransaction
  ): Promise<SendTransactionResult<ExecuteResult>> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    const signer = await getSigningCosmWasmClient(this.rpcUrl, this.signer);
    const res = await signer.executeMultiple(
      this.activeAccount.address,
      tx.instructions,
      tx.fee,
      tx.memo
    );

    return {
      id: res.transactionHash,
      data: res,
    };
  }

  async signMessage(msg: Uint8Array): Promise<StdSignature> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    return await walletSignArbitrary(
      this.type,
      this.chainId,
      this.activeAccount.address,
      msg
    );
  }

  getWalletState(): WalletState {
    if (!window) return WalletState.Unsupported;
    return window[this.type] ? WalletState.Installed : WalletState.NotDetected;
  }

  async calculateFee(tx: SeiTransaction): Promise<string> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    const fee = await signer.simulate(
      this.activeAccount.address,
      tx.msgs,
      tx.memo
    );
    return fee.toString();
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_SEI;
  }
}
