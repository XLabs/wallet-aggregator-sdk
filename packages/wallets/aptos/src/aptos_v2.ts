import {
  AvailableWallets,
  WalletCore,
  Wallet as AptosWalletType,
  DappConfig,
  AnyRawTransaction,
  InputGenerateTransactionOptions,
  AccountAuthenticator,
  Types,
  WalletName,
  AdapterPlugin,
  SignMessagePayload,
  SignMessageResponse,
  NetworkInfo,
  InputTransactionData,
  PendingTransactionResponse,
  InputSubmitTransactionData,
  AnyAptosWallet,
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

export type AptosAdapterPlugin = AdapterPlugin;
interface AptosSubmitResult {
  hash: Types.HexEncodedBytes;
}
type AptosMessage = string | SignMessagePayload | Uint8Array;
type SignedAptosMessage = string | SignMessageResponse;
type AptosTransactionResult =
  | { hash: Types.HexEncodedBytes; output?: any }
  | PendingTransactionResponse;

/**
 * An abstraction over Aptos blockchain wallets.
 *
 */
export class AptosWalletV2 extends Wallet<
  typeof CHAIN_ID_APTOS,
  string,
  Types.TransactionPayload,
  AccountAuthenticator,
  InputSubmitTransactionData,
  AptosSubmitResult,
  InputTransactionData,
  AptosSubmitResult,
  AptosMessage,
  SignedAptosMessage,
  NetworkInfo
> {
  /**
   * @param adapter The Aptos wallet adapter which will serve as the underlying connection to the wallet
   */
  private walletCore: WalletCore;
  constructor(
    private plugin: ReadonlyArray<AptosWalletType>,
    private optInWallets: ReadonlyArray<AvailableWallets>,
    dappConfig?: DappConfig,
    disableTelemetry?: boolean
  ) {
    super();
    this.walletCore = new WalletCore(
      plugin,
      optInWallets,
      dappConfig,
      disableTelemetry
    );
  }

  /** Retrieve the underlying Aptos adapter */
  // getAdapter(): AptosAdapter {
  //   return this.adapter;
  // }

  getName(): string {
    return this.walletCore.wallet?.name || "";
  }

  getUrl(): string {
    return this.walletCore.wallet?.url || "";
  }

  getWallets(): ReadonlyArray<AnyAptosWallet> {
    return this.walletCore.wallets;
  }

  async connect(walletName: string): Promise<string[]> {
    await this.walletCore?.connect(walletName);
    return this.getAddresses();
  }

  getNetworkInfo() {
    return this.walletCore?.network || undefined;
  }

  isConnected(): boolean {
    return this.walletCore?.isConnected();
  }

  disconnect(): Promise<void> {
    return this.walletCore?.disconnect();
  }

  getChainId() {
    return CHAIN_ID_APTOS;
  }

  getAddress(): string | undefined {
    return this.walletCore.account?.address;
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

  signTransaction(
    tx: AnyRawTransaction | Types.TransactionPayload,
    asFeePayer?: boolean,
    options?: InputGenerateTransactionOptions
  ): Promise<AccountAuthenticator> {
    return this.walletCore?.signTransaction(tx);
  }

  async sendTransaction(
    tx: InputSubmitTransactionData
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    const result = await this.walletCore?.submitTransaction(tx);

    return {
      id: result.hash,
      data: { hash: result.hash },
    };
  }

  async signAndSendTransaction(
    tx: InputTransactionData
  ): Promise<SendTransactionResult<AptosTransactionResult>> {
    const result = await this.walletCore.signAndSubmitTransaction(tx);

    return {
      id: result.hash,
      data: result,
    };
  }

  signMessage(msg: SignMessagePayload): Promise<SignedAptosMessage> {
    return this.walletCore.signMessage(msg);
  }

  getIcon(): string {
    return this.walletCore.wallet?.icon || "";
  }

  getWalletState(): WalletState {
    const currentWallet = this.walletCore.wallet?.name;
    const state = this.walletCore?.wallets
      .map((wallet) => {
        if (wallet.name === currentWallet) {
          return wallet.readyState;
        }
      })
      .filter(Boolean)[0];
    if (state && !(state in WalletState)) {
      throw new Error(`Unknown wallet state ${state}`);
    }
    if (state) {
      return WalletState[state];
    } else {
      return WalletState.NotDetected;
    }
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_APTOS;
  }
}
