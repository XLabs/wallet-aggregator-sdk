import {
  AccountAuthenticator,
  InputSubmitTransactionData,
  Network,
  PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";

import {
  NetworkInfo,
  AptosSignMessageOutput,
  WalletCore,
  AdapterWallet,
  AnyRawTransaction,
  InputTransactionData,
  DappConfig,
  AvailableWallets,
  AptosSignMessageInput,
  AccountInfo,
  AptosSignAndSubmitTransactionOutput,
} from "@aptos-labs/wallet-adapter-core";

import {
  BaseFeatures,
  CHAIN_ID_APTOS,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";

type SendTransactionInput = {
  transaction: AnyRawTransaction;
  senderAuthenticator: AccountAuthenticator;
};

type SignTransactionInput = {
  transactionOrPayload: AnyRawTransaction | InputTransactionData;
  asFeePayer?: boolean;
};
type SignTransactionOutput = Promise<{
  authenticator: AccountAuthenticator;
  rawTransaction: Uint8Array;
}>;

export class AptosWallet extends Wallet<
  typeof CHAIN_ID_APTOS,
  void,
  SignTransactionInput,
  SignTransactionOutput,
  InputSubmitTransactionData,
  AptosSignAndSubmitTransactionOutput,
  InputTransactionData,
  AptosSignAndSubmitTransactionOutput,
  AptosSignMessageInput,
  AptosSignMessageOutput,
  NetworkInfo
> {
  private address: string | undefined;
  private account: AccountInfo | null = null;
  private network: NetworkInfo | undefined;
  /**
   * @param selectedAptosWallet The Aptos wallet adapter which will serve as the underlying connection to the wallet
   * @param walletCore WalletCore class obtained via walletCoreFactory static function
   */
  constructor(
    private readonly selectedAptosWallet: AdapterWallet,
    private readonly walletCore: WalletCore
  ) {
    super();
  }

  /**
   * @param optInWallets the adapter detects and adds AIP-62 standard wallets by default,
   * sometimes you might want to opt-in with specific wallets.
   * This props lets you define the AIP-62 standard wallets you want to support in your dapp
   * @param config Config used to initialize the dapp with
   * @param disableTelemetry A boolean flag to disable the adapter telemetry tool, false by default
   * @returns {WalletCore} WalletCore instance
   */
  static walletCoreFactory(
    optInWallets?: ReadonlyArray<AvailableWallets>,
    config?: DappConfig,
    disableTelemetry?: boolean
  ): WalletCore {
    return new WalletCore(optInWallets, config, disableTelemetry);
  }

  getName(): string {
    return this.selectedAptosWallet.name;
  }

  getUrl(): string {
    return this.selectedAptosWallet.url;
  }

  getAccount(): AccountInfo | null {
    return this.account;
  }

  async connect(): Promise<string[]> {
    await this.walletCore.connect(this.selectedAptosWallet.name);

    // set account
    this.account = this.walletCore.account;

    // Set address
    this.address = this.account?.address.toString();
    this.walletCore.on(
      "accountChange",
      async (accountInfo: AccountInfo | null) => {
        this.account = accountInfo;
        this.address = accountInfo?.address.toString();
      }
    );

    // Set network
    this.network = this.walletCore.network || undefined;
    this.walletCore.on("networkChange", async (network: NetworkInfo | null) => {
      this.network = network || undefined;
    });

    return this.getAddresses();
  }

  getNetworkInfo() {
    return this.network;
  }

  isConnected(): boolean {
    return this.walletCore.isConnected();
  }

  disconnect(): Promise<void> {
    this.walletCore.off("accountChange");
    this.walletCore.off("networkChange");
    return this.walletCore.disconnect();
  }

  getChainId() {
    return CHAIN_ID_APTOS;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getAddresses(): string[] {
    const address = this.getAddress();
    return address ? [address] : [];
  }

  setMainAddress(): void {
    throw new NotSupported();
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  async signTransaction(
    tx: SignTransactionInput
  ): Promise<SignTransactionOutput> {
    return this.walletCore.signTransaction({
      transactionOrPayload: tx.transactionOrPayload,
      asFeePayer: tx.asFeePayer,
    });
  }

  async sendTransaction(
    txInput: InputSubmitTransactionData
  ): Promise<SendTransactionResult<PendingTransactionResponse>> {
    const result = await this.walletCore.submitTransaction({
      transaction: txInput.transaction,
      senderAuthenticator: txInput.senderAuthenticator,
    });

    return {
      id: result.hash,
      data: result,
    };
  }

  async signAndSendTransaction(
    tx: InputTransactionData
  ): Promise<SendTransactionResult<AptosSignAndSubmitTransactionOutput>> {
    const result = await this.walletCore.signAndSubmitTransaction(tx);
    return {
      id: result.hash,
      data: result,
    };
  }

  async signMessage(
    msg: AptosSignMessageInput
  ): Promise<AptosSignMessageOutput> {
    return this.walletCore.signMessage(msg);
  }

  getIcon(): string {
    return this.selectedAptosWallet.icon;
  }

  getWalletState(): WalletState {
    const state = this.selectedAptosWallet.readyState;
    return WalletState[state || WalletState.NotDetected];
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_APTOS;
  }
}
