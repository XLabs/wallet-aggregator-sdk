import {
  Connection,
  ExecuteTransactionRequestType,
  JsonRpcProvider,
  SuiTransactionBlockResponseOptions,
  TransactionBlock,
} from "@mysten/sui.js";
import {
  StandardConnectMethod,
  StandardDisconnectMethod,
  Wallet as StandardWallet,
  SuiSignAndExecuteTransactionBlockMethod,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignMessageInput,
  SuiSignMessageMethod,
  SuiSignMessageOutput,
  SuiSignTransactionBlockMethod,
  SuiSignTransactionBlockOutput,
  WalletAccount,
} from "@mysten/wallet-standard";
import {
  BaseFeatures,
  CHAIN_ID_SUI,
  ChainId,
  NotConnected,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletEvents,
} from "@xlabs-libs/wallet-aggregator-core";
import { DEFAULTS, SuiWalletName, WalletInfo } from "./walletsInfo";

export enum FeatureName {
  STANDARD__CONNECT = "standard:connect",
  STANDARD__DISCONNECT = "standard:disconnect",
  STANDARD__EVENTS = "standard:events",
  SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK = "sui:signAndExecuteTransactionBlock",
  SUI__SIGN_TRANSACTION_BLOCK = "sui:signTransactionBlock",
  SUI__SIGN_MESSAGE = "sui:signMessage",
}

interface SignAndSendTransactionOptions {
  transactionBlock: TransactionBlock;
  requestType?: ExecuteTransactionRequestType;
  options?: SuiTransactionBlockResponseOptions;
}

type ConnectFeature = { connect: StandardConnectMethod };
type DisconnectFeature = { disconnect: StandardDisconnectMethod };
type SignAndExecuteTransactionBlockFeature = {
  signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod;
};
type SignTransactionBlockFeature = {
  signTransactionBlock: SuiSignTransactionBlockMethod;
};
type SignMessageFeature = { signMessage: SuiSignMessageMethod };
type SuiNetworkInfo = {
  chain: string;
};

const DO_NOT_REMOVE_WALLET_FROM = ["OKX", "Bitget"] as const;

export class SuiWallet extends Wallet<
  typeof CHAIN_ID_SUI,
  void,
  TransactionBlock,
  SuiSignTransactionBlockOutput,
  SuiSignTransactionBlockOutput,
  SuiSignAndExecuteTransactionBlockOutput,
  SignAndSendTransactionOptions,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignMessageInput,
  SuiSignMessageOutput,
  SuiNetworkInfo,
  BaseFeatures,
  WalletEvents
> {
  private readonly _name;
  private accounts: WalletAccount[] = [];
  private activeAccount?: WalletAccount;

  constructor(
    private readonly wallet: StandardWallet,
    private readonly connection?: Connection
  ) {
    super();
    if (DO_NOT_REMOVE_WALLET_FROM.find((name) => wallet.name.includes(name))) {
      this._name = wallet.name;
    } else {
      this._name = wallet.name.replace("Wallet", "").trim();
    }
  }

  async connect(): Promise<string[]> {
    const { connect } = this.getFeature<ConnectFeature>(
      FeatureName.STANDARD__CONNECT
    );

    const { accounts } = await connect();

    this.accounts = [...accounts];
    this.activeAccount = accounts[0];
    this.emit("connect");

    return this.accounts.map((a) => a.address);
  }

  async disconnect(): Promise<void> {
    const { disconnect } =
      this.getFeature<DisconnectFeature | undefined>(
        FeatureName.STANDARD__DISCONNECT,
        false
      ) || {};

    if (disconnect) {
      await disconnect();
    }

    this.accounts = [];

    this.emit("disconnect");
  }

  signTransaction(
    transactionBlock: TransactionBlock
  ): Promise<SuiSignTransactionBlockOutput> {
    if (!this.activeAccount) throw new NotConnected();

    const { signTransactionBlock } =
      this.getFeature<SignTransactionBlockFeature>(
        FeatureName.SUI__SIGN_TRANSACTION_BLOCK
      );

    return signTransactionBlock({
      transactionBlock,
      account: this.activeAccount,
      chain: this.activeAccount.chains[0],
    });
  }

  async sendTransaction(
    tx: SuiSignTransactionBlockOutput
  ): Promise<SendTransactionResult<SuiSignAndExecuteTransactionBlockOutput>> {
    if (!this.connection) throw new Error("Connection not provided");
    const provider = new JsonRpcProvider(this.connection);

    const result = await provider.executeTransactionBlock({
      signature: tx.signature,
      transactionBlock: tx.transactionBlockBytes,
    });

    return {
      id: result.digest,
      data: result,
    };
  }

  async signAndSendTransaction(
    options: SignAndSendTransactionOptions
  ): Promise<SendTransactionResult<SuiSignAndExecuteTransactionBlockOutput>> {
    if (!this.activeAccount) throw new NotConnected();

    const { signAndExecuteTransactionBlock } =
      this.getFeature<SignAndExecuteTransactionBlockFeature>(
        FeatureName.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK
      );

    const result = await signAndExecuteTransactionBlock({
      ...options,
      account: this.activeAccount,
      chain: this.activeAccount.chains[0],
    });

    return {
      id: result.digest,
      data: result,
    };
  }

  getName(): string {
    return this._name;
  }

  getUrl(): string {
    const info = WalletInfo[this.wallet.name as SuiWalletName];
    return info?.url || DEFAULTS.url;
  }

  getChainId() {
    return CHAIN_ID_SUI;
  }

  getAddress(): string | undefined {
    return this.activeAccount?.address;
  }

  getAddresses(): string[] {
    return this.accounts.map((a) => a.address);
  }

  setMainAddress(address: string): void {
    const account = this.accounts.find((a) => a.address === address);
    if (!account) throw new Error("Account not found");
    this.activeAccount = account;
  }

  getBalance(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  signMessage(msg: SuiSignMessageInput): Promise<SuiSignMessageOutput> {
    const { signMessage } = this.getFeature<SignMessageFeature>(
      FeatureName.SUI__SIGN_MESSAGE
    );

    return signMessage(msg);
  }

  getIcon(): string {
    const info = WalletInfo[this.wallet.name as SuiWalletName];
    return info?.icon || DEFAULTS.icon;
  }

  isConnected(): boolean {
    return this.accounts.length > 0;
  }

  getNetworkInfo(): SuiNetworkInfo | undefined {
    return this.activeAccount
      ? { chain: this.activeAccount.chains[0] }
      : undefined;
  }

  private getFeature<T>(name: FeatureName, mustSupport = true): T {
    const feature = this.wallet.features[name];
    if (!feature && mustSupport) throw new NotSupported();
    return feature as T;
  }

  getFeatures(): BaseFeatures[] {
    const features = [BaseFeatures.SendTransaction];
    if (this.wallet.features[FeatureName.SUI__SIGN_TRANSACTION_BLOCK]) {
      features.push(BaseFeatures.SignTransaction);
    }
    if (
      this.wallet.features[FeatureName.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK]
    ) {
      features.push(BaseFeatures.SignAndSendTransaction);
    }
    if (this.wallet.features[FeatureName.SUI__SIGN_MESSAGE]) {
      features.push(BaseFeatures.SignMessage);
    }
    return features;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_SUI;
  }
}
