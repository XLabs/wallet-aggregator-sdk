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
  getSigningClient,
  getSigningCosmWasmClient,
  SeiWallet as SeiInnerWallet,
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
import { WALLETS } from "./wallets";

export type SeiChainId = "pacific-1" | "atlantic-2" | "sei-devnet-3";
export type GetWalletsOptions = Omit<SeiWalletConfig, "wallet">;
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

interface Window {
  // eslint-disable-next-line
  [key: string]: any;
}

export const getSupportedWallets = (config: GetWalletsOptions): SeiWallet[] => {
  return SUPPORTED_WALLETS.map(
    (wallet) =>
      new SeiWallet({
        ...config,
        wallet,
      })
  );
};

export const getInstalledWallets = (config: GetWalletsOptions): SeiWallet[] => {
  return SUPPORTED_WALLETS.filter(
    (wallet) => !!(window as Window)[wallet.walletInfo.windowKey]
  ).map(
    (wallet) =>
      new SeiWallet({
        ...config,
        wallet,
      })
  );
};

export interface SeiWalletConfig {
  wallet: SeiInnerWallet;
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
  private wallet: SeiInnerWallet;
  private chainId: SeiChainId;
  private rpcUrl: string;
  private activeAccount?: AccountData;
  private accounts: AccountData[] = [];
  private signer?: OfflineSigner;

  constructor(config: SeiWalletConfig) {
    super();
    this.wallet = config.wallet;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
  }

  getName(): string {
    return this.wallet.walletInfo.name;
    // return WALLETS[this.type]?.name || this.type;
  }

  getUrl(): string {
    return this.wallet.walletInfo.website;
  }

  getIcon(): string {
    return (
      WALLETS[this.wallet.walletInfo.windowKey]?.icon ||
      this.wallet.walletInfo.icon
    );
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
    await this.wallet.connect(this.chainId);
    this.signer = await this.wallet.getOfflineSigner(this.chainId);
    this.accounts = [...(await this.wallet.getAccounts(this.chainId))];
    this.activeAccount = this.accounts[0];
    return this.accounts.map((a) => a.address);
  }

  disconnect(): Promise<void> {
    this.accounts = [];
    this.activeAccount = undefined;
    this.signer = undefined;
    return this.wallet.disconnect(this.chainId);
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

  async signMessage(msg: string): Promise<StdSignature | undefined> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    if (!this.wallet.signArbitrary) throw new Error("Method not supported");
    return this.wallet.signArbitrary(
      this.chainId,
      this.activeAccount.address,
      msg
    );
  }

  getWalletState(): WalletState {
    if (!window) return WalletState.Unsupported;
    const key: string = this.wallet.walletInfo.windowKey;
    return (window as Window)[key]
      ? WalletState.Installed
      : WalletState.NotDetected;
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
    const features = [
      BaseFeatures.SignTransaction,
      BaseFeatures.SendTransaction,
      BaseFeatures.SignAndSendTransaction,
    ];
    if (this.wallet.signArbitrary) features.push(BaseFeatures.SignMessage);
    return features;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_SEI;
  }
}
