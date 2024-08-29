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
  WalletReadyState,
  AptosStandardWallet,
} from "@aptos-labs/wallet-adapter-core";
import {
  AptosSignAndSubmitTransactionOutput,
  AptosSignMessageOutput,
  UserResponse,
  UserResponseStatus,
} from "@aptos-labs/wallet-standard";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import {
  BaseFeatures,
  CHAIN_ID_APTOS,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";
import { AptosWallet } from "./aptos";

export type AptosAdapterPlugin = AdapterPlugin;
interface AptosSubmitResult {
  hash: Types.HexEncodedBytes;
}
type AptosMessage = string | SignMessagePayload | Uint8Array;
type SignedAptosMessage =
  | SignMessageResponse
  | UserResponse<AptosSignMessageOutput>;
type AptosTransactionResult =
  | { hash: Types.HexEncodedBytes; output?: any }
  | PendingTransactionResponse
  | UserResponse<AptosSignAndSubmitTransactionOutput>;

export const supportedWallets = [
  /*wallet names o enum */
];
export function getAptosWallets(
  plugin: ReadonlyArray<AptosWalletType>,
  optInWallets: ReadonlyArray<AvailableWallets>,
  dappConfig?: DappConfig,
  disableTelemetry?: boolean
) {
  const core = new WalletCore([], ["Petra", "Nightly"]);

  const standartWallets = core.standardWallets.map((wallet) => {
    new AptosWalletV2(wallet);
  });
  //const pluginWallets = core.pluginWallets.map(wallet => new AptosWallet(wallet));
  return standartWallets;
}

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
  AptosTransactionResult,
  AptosMessage,
  SignedAptosMessage,
  NetworkInfo
> {
  /**
   * @param adapter The Aptos wallet adapter which will serve as the underlying connection to the wallet
   */
  //private walletCore: WalletCore;
  private wallet: AptosWalletType;
  private network: NetworkInfo | undefined;
  private address: string | AccountAddress | undefined;
  constructor(wallet: AptosStandardWallet) {
    super();
    this.wallet = this.standardizeStandardWalletToPluginWalletType(wallet);
    //this.wallet = wallet;
    // this.wallet = new WalletCore(
    //   plugin,
    //   optInWallets,
    //   dappConfig,
    //   disableTelemetry
    // );
    // this.wallet.wallets
  }

  /** Retrieve the underlying Aptos adapter */
  // getAdapter(): AptosAdapter {
  //   return this.adapter;
  // }

  /**
   * To maintain support for both plugins and AIP-62 standard wallets,
   * without introducing dapps breaking changes, we convert
   * AIP-62 standard compatible wallets to the legacy adapter wallet plugin type.
   *
   * @param standardWallet An AIP-62 standard compatible wallet
   */
  // https://github.com/aptos-labs/aptos-wallet-adapter/blob/39e75613f396028b2168d5a878d952074545006d/packages/wallet-adapter-core/src/WalletCore.ts#L376
  private standardizeStandardWalletToPluginWalletType = (
    standardWallet: AptosStandardWallet
  ) => {
    let standardWalletConvertedToWallet: AptosWalletType = {
      name: standardWallet.name as WalletName,
      url: standardWallet.url,
      icon: standardWallet.icon,
      provider: standardWallet,
      connect: standardWallet.features["aptos:connect"].connect,
      disconnect: standardWallet.features["aptos:disconnect"].disconnect,
      network: standardWallet.features["aptos:network"].network,
      account: standardWallet.features["aptos:account"].account,
      signAndSubmitTransaction:
        standardWallet.features["aptos:signAndSubmitTransaction"]
          ?.signAndSubmitTransaction,
      signMessage: standardWallet.features["aptos:signMessage"].signMessage,
      onAccountChange:
        standardWallet.features["aptos:onAccountChange"].onAccountChange,
      onNetworkChange:
        standardWallet.features["aptos:onNetworkChange"].onNetworkChange,
      signTransaction:
        standardWallet.features["aptos:signTransaction"].signTransaction,
      openInMobileApp:
        standardWallet.features["aptos:openInMobileApp"]?.openInMobileApp,
      changeNetwork:
        standardWallet.features["aptos:changeNetwork"]?.changeNetwork,
      readyState: WalletReadyState.Installed,
      isAIP62Standard: true,
    };
    return standardWalletConvertedToWallet;
  };

  getName(): string {
    return this.wallet?.name || "";
  }

  getUrl(): string {
    return this.wallet?.url || "";
  }

  async connect(): Promise<string[]> {
    if (this.wallet.connect === undefined) {
      throw new Error("Wallet not connected");
    }
    await this.wallet.connect();
    this.network = await this.wallet?.network();
    this.address = (await this.wallet?.account?.())?.address || "";
    return this.getAddresses();
  }

  getNetworkInfo() {
    return this.network || undefined;
  }

  isConnected(): boolean {
    return this.wallet !== undefined;
  }

  disconnect(): Promise<void> {
    return this.wallet?.disconnect();
  }

  getChainId() {
    return CHAIN_ID_APTOS;
  }

  getAddress(): string | undefined {
    return this.address?.toString();
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
    if (!this.wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    return this.wallet.signTransaction?.(tx);
  }

  async sendTransaction(
    tx: InputSubmitTransactionData
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    if (!this.wallet.submitTransaction) {
      throw new Error("Wallet not connected");
    }
    const result = await this.wallet?.submitTransaction(tx);

    return {
      id: result.hash,
      data: { hash: result.hash },
    };
  }

  async signAndSendTransaction(
    tx: InputTransactionData
  ): Promise<SendTransactionResult<AptosTransactionResult>> {
    if (!this.wallet.signAndSubmitTransaction) {
      throw new Error("Wallet not connected");
    }
    const result = await this.wallet.signAndSubmitTransaction(tx);
    this.wallet.isAIP62Standard;
    // Type guard to check if result is UserResponse<AptosSignAndSubmitTransactionOutput>
    const isUserResponse = (
      res: any
    ): res is UserResponse<AptosSignAndSubmitTransactionOutput> => {
      return (
        res.status === UserResponseStatus.APPROVED ||
        res.status === UserResponseStatus.REJECTED
      );
    };
    const hash = isUserResponse(result)
      ? result.status === UserResponseStatus.APPROVED
        ? result.args.hash
        : ""
      : result.hash;
    return {
      id: hash,
      data: result,
    };
  }

  signMessage(msg: SignMessagePayload): Promise<SignedAptosMessage> {
    return this.wallet.signMessage(msg);
  }

  getIcon(): string {
    return this.wallet?.icon || "";
  }

  getWalletState(): WalletState {
    const state = this.wallet?.readyState;
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
