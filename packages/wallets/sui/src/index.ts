import { Connection, JsonRpcProvider, devnetConnection } from "@mysten/sui.js";
import {
  StandardConnectMethod,
  StandardDisconnectMethod,
  Wallet as StandardWallet,
  SuiSignAndExecuteTransactionBlockMethod,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignMessageInput,
  SuiSignMessageMethod,
  SuiSignMessageOutput,
  SuiSignTransactionBlockInput,
  SuiSignTransactionBlockMethod,
  SuiSignTransactionBlockOutput,
  WalletAccount,
  Wallets,
  getWallets as getSuiWallets,
} from "@mysten/wallet-standard";
import {
  CHAIN_ID_UNSET,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletEvents,
} from "@xlabs-libs/wallet-aggregator-core";

export enum FeatureName {
  STANDARD__CONNECT = "standard:connect",
  STANDARD__DISCONNECT = "standard:disconnect",
  STANDARD__EVENTS = "standard:events",
  SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK = "sui:signAndExecuteTransactionBlock",
  SUI__SIGN_TRANSACTION_BLOCK = "sui:signTransactionBlock",
  SUI__SIGN_MESSAGE = "sui:signMessage",
}

const WALLET_DETECT_TIMEOUT = 250;

interface GetWalletsOptions {
  timeout?: number;
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

const supportsSui = (wallet: StandardWallet): boolean => {
  const { features } = wallet;

  return Object.entries(features).some(([featureName]) =>
    featureName.startsWith("sui:")
  );
};

export const getWallets = async (
  options: GetWalletsOptions = {}
): Promise<SuiWallet[]> => {
  const timeout = options.timeout || WALLET_DETECT_TIMEOUT;
  const detector: Wallets = getSuiWallets();

  const wallets: StandardWallet[] = [...detector.get()];
  return new Promise((resolve) => {
    let removeListener: (() => void) | undefined = undefined;

    const createResolutionTimeout = () =>
      setTimeout(() => {
        if (removeListener) removeListener();
        resolve(wallets.filter(supportsSui).map((w) => new SuiWallet(w)));
      }, timeout);

    let resolution = createResolutionTimeout();

    removeListener = detector.on("register", (wallet: StandardWallet) => {
      wallets.push(wallet);
      clearTimeout(resolution);
      resolution = createResolutionTimeout();
    });
  });
};

export default class SuiWallet extends Wallet<
  SuiSignTransactionBlockInput,
  SuiSignTransactionBlockOutput,
  SuiSignAndExecuteTransactionBlockOutput,
  any,
  SuiSignMessageInput,
  SuiSignMessageOutput,
  WalletEvents
> {
  private accounts: WalletAccount[] = [];
  private activeAccount?: WalletAccount;

  constructor(
    private readonly wallet: StandardWallet,
    private readonly connection?: Connection
  ) {
    super();
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
    tx: SuiSignTransactionBlockInput
  ): Promise<SuiSignTransactionBlockOutput> {
    const { signTransactionBlock } =
      this.getFeature<SignTransactionBlockFeature>(
        FeatureName.SUI__SIGN_TRANSACTION_BLOCK
      );

    return signTransactionBlock(tx);
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
    tx: SuiSignTransactionBlockInput
  ): Promise<SendTransactionResult<SuiSignAndExecuteTransactionBlockOutput>> {
    const { signAndExecuteTransactionBlock } =
      this.getFeature<SignAndExecuteTransactionBlockFeature>(
        FeatureName.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK
      );

    const result = await signAndExecuteTransactionBlock(tx);

    return {
      id: result.digest,
      data: result,
    };
  }

  getName(): string {
    return this.wallet.name;
  }

  getUrl(): string {
    return "https://sui.io";
  }

  getChainId(): ChainId {
    // TODO: change to correct chain id when available
    return CHAIN_ID_UNSET;
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
    return this.wallet.icon;
  }

  isConnected(): boolean {
    return this.accounts.length > 0;
  }

  getNetworkInfo() {
    throw new Error("Method not implemented.");
  }

  private getFeature<T>(name: FeatureName, mustSupport = true): T {
    const feature = this.wallet.features[name];
    if (!feature && mustSupport) throw new NotSupported();
    return feature as T;
  }
}
