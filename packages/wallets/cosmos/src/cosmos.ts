import { AccountData, StdSignature } from "@cosmjs/amino";
import {
  ExecuteResult,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { DeliverTxResponse, SigningStargateClient } from "@cosmjs/stargate";
import {
  BaseFeatures,
  CHAIN_ID_WORMCHAIN,
  ChainId,
  NotConnected,
  SendTransactionResult,
  Wallet,
  WalletState,
  isCosmWasmChain,
} from "@xlabs-libs/wallet-aggregator-core";
import {
  CosmosConnectOptions,
  CosmosExecuteTransaction,
  CosmosTransaction,
  CosmosWalletConfig,
  RpcMap,
  TxRaw,
} from "./types";
import { WalletInfo } from "./wallets";

const DEFAULT_RPCS: RpcMap = {};

/**
 * A class to interact with Cosmos blockchains.
 *
 * Caveat on smart contract execution: sendTransaction and signAndSendTransaction
 * do not parse logs and events. You can parse them through the utility methods
 * offered by cosmjs libraries, or use the executeMultiple method instead.
 */
export class CosmosWallet extends Wallet<
  ChainId,
  CosmosConnectOptions,
  CosmosTransaction,
  TxRaw,
  TxRaw,
  DeliverTxResponse,
  CosmosTransaction,
  DeliverTxResponse
> {
  private chainId?: string;
  private rpcs: RpcMap;
  private walletInfo: WalletInfo;
  private signer?: OfflineSigner;
  private activeAccount?: AccountData;
  private accounts: AccountData[] = [];

  constructor({ chainId, rpcs, walletInfo }: CosmosWalletConfig) {
    super();
    this.chainId = chainId;
    this.rpcs = Object.assign({}, DEFAULT_RPCS, rpcs);
    this.walletInfo = walletInfo;
  }

  getName(): string {
    return this.walletInfo.name;
  }

  getUrl(): string {
    return this.walletInfo.url;
  }

  getIcon(): string {
    return this.walletInfo.icon;
  }

  getChainId() {
    return CHAIN_ID_WORMCHAIN;
  }

  getCosmosChainId() {
    return this.chainId;
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

  async connect({ chainId }: CosmosConnectOptions = {}): Promise<string[]> {
    if (chainId) this.chainId = chainId;
    if (!this.chainId) throw new Error("Chain id not set");
    const extension = this.walletInfo.locate();
    if (!extension) throw new Error("Wallet not found");

    this.signer = await extension.getOfflineSignerAuto(this.chainId);
    this.accounts = [...(await this.signer.getAccounts())];
    this.activeAccount = this.accounts[0];
    return this.accounts.map((a) => a.address);
  }

  async switchChain(chainId: string): Promise<void> {
    await this.connect({ chainId });
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

  async signTransaction(tx: CosmosTransaction): Promise<TxRaw> {
    // it doesn't matter if we use getSigningClient or getSigningCosmWasmClient
    // because the code to sign is the same for both
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/cosmwasm-stargate/src/signingcosmwasmclient.ts#L560
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/stargate/src/signingstargateclient.ts#L323
    const signer = await this.getSigningStargateClient();

    return await signer.sign(
      this.activeAccount!.address,
      tx.msgs,
      tx.fee,
      tx.memo
    );
  }

  async sendTransaction(
    tx: TxRaw
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    const signer = await this.getSigningStargateClient();

    const response = await signer.broadcastTx(tx.bodyBytes);
    return {
      id: response.transactionHash,
      data: response,
    };
  }

  async signAndSendTransaction(
    tx: CosmosTransaction
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    const signer = await this.getSigningStargateClient();

    const response = await signer.signAndBroadcast(
      this.activeAccount!.address,
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
    tx: CosmosExecuteTransaction
  ): Promise<SendTransactionResult<ExecuteResult>> {
    const signer = await this.getSigningCosmWasmClient();

    const res = await signer.executeMultiple(
      this.activeAccount!.address,
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
    if (!this.chainId) throw new Error("Chain id not set");
    const extension = this.walletInfo.locate();
    if (!extension) throw new Error("Wallet not found");

    return await extension.signArbitrary(
      this.chainId,
      this.activeAccount.address,
      msg
    );
  }

  getWalletState(): WalletState {
    if (!window) return WalletState.Unsupported;
    const extension = this.walletInfo.locate();
    return extension ? WalletState.Installed : WalletState.NotDetected;
  }

  async calculateFee(tx: CosmosTransaction): Promise<string> {
    const signer = await this.getSigningCosmWasmClient();

    const fee = await signer.simulate(
      this.activeAccount!.address,
      tx.msgs,
      tx.memo
    );
    return fee.toString();
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return isCosmWasmChain(chainId);
  }

  async getSigningStargateClient(): Promise<SigningStargateClient> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    if (!this.chainId) throw new Error("Chain id not set");

    const rpc = this.rpcs[this.chainId];
    if (!rpc) throw new Error(`Missing RPC for chain ${this.chainId}`);

    return SigningStargateClient.connectWithSigner(rpc, this.signer);
  }

  async getSigningCosmWasmClient(): Promise<SigningCosmWasmClient> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    if (!this.chainId) throw new Error("Chain id not set");

    const rpc = this.rpcs[this.chainId];
    if (!rpc) throw new Error(`Missing RPC for chain ${this.chainId}`);

    return SigningCosmWasmClient.connectWithSigner(rpc, this.signer);
  }
}
