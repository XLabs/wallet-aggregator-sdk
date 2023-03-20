import {
  Account,
  FinalExecutionOutcome,
  HardwareWalletAccount,
  InjectedWalletMetadata,
  Network,
  NetworkId,
  setupWalletSelector,
  Wallet as InternalWallet,
  WalletModule,
  WalletModuleFactory,
  WalletSelector,
} from "@near-wallet-selector/core";
import {
  Address,
  NotSupported,
  SendTransactionResult,
} from "@xlabs-libs/wallet-aggregator-core";
import { ConnectConfig as NearConfig } from "near-api-js";
import {
  NearTransactionParams,
  NearTransactionResult,
  NearWallet,
} from "./near";

export interface WrappedNearWalletParams {
  /** Near configuration */
  config: NearConfig;
  /** Wallet factory */
  module: WalletModule;
  /** Contract ID the wallet/application will interact with */
  contractId: string;

  hardwareAccounts?: HardwareWalletAccount[];
}

export const getNetworkPreset = (networkId: NetworkId): Network => {
  switch (networkId) {
    case "mainnet":
      return {
        networkId,
        nodeUrl: "https://rpc.mainnet.near.org",
        helperUrl: "https://helper.mainnet.near.org",
        explorerUrl: "https://explorer.near.org",
        indexerUrl: "https://api.kitwallet.app",
      };
    case "testnet":
      return {
        networkId,
        nodeUrl: "https://rpc.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
        indexerUrl: "https://testnet-api.kitwallet.app",
      };
  }
};

interface WrapWalletParams {
  factory: WalletModuleFactory;
  config: NearConfig;
  contractId: string;
}

export const wrapWallet = async ({
  factory,
  config,
  contractId = "",
}: WrapWalletParams): Promise<WrappedNearWallet> => {
  const module = await factory({
    options: {
      network: getNetworkPreset(config.networkId as NetworkId),
      debug: false,
      optimizeWalletOrder: false,
    },
  });

  if (!module) throw new Error("Failed to initialize wallet module");

  return new WrappedNearWallet({
    config,
    contractId: contractId,
    module,
  });
};

/**
 * A class that wraps a single Near wallet
 *
 * This class wraps a wallet module created through one of the WalletModuleFactory
 * provided by the @near-wallet-aggregator package and uses a wallet selector of its own
 * to configure it and iteract with it.
 *
 * ```ts
 * import { wrapWallet } from "@xlabs-libs/wallet-aggregator-near";
 * import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
 *
 * const factory = await setupMeteorWallet();
 * const module = await factory({ options });
 *
 * new WrappedNearWallet({
 *    config,
 *    contractId,
 *    module
 * });
 *
 * // or with a utility function
 * const meteorWallet = wrapWallet({ config, contractId, factory: setupMeteorWallet() });
 * ```
 */
export class WrappedNearWallet extends NearWallet {
  private readonly config: NearConfig;
  private readonly module: WalletModule;
  private readonly contractId: string;
  private wallet?: InternalWallet;

  private hardwareAccounts: HardwareWalletAccount[];

  private selector?: WalletSelector;
  private accounts: Account[] = [];
  private activeAccount?: Account;
  private network?: Network;

  constructor({
    config,
    module,
    contractId,
    hardwareAccounts,
  }: WrappedNearWalletParams) {
    super();
    this.config = config;
    this.module = module;
    this.contractId = contractId;
    this.hardwareAccounts = hardwareAccounts || [];
  }

  async connect(): Promise<Address[]> {
    this.selector = await setupWalletSelector({
      network: this.config.networkId as NetworkId,
      modules: [() => Promise.resolve(this.module)],
      allowMultipleSelectors: true,
    });

    const wallet = await this.selector.wallet(this.module.id);
    // const wallet = await this.selector.store.getState().modules[0].wallet();

    let accounts: Account[];
    switch (wallet.type) {
      case "browser":
      case "bridge":
      case "injected":
        accounts = await wallet.signIn({ contractId: this.contractId });
        break;
      case "hardware":
        accounts = await wallet.signIn({
          contractId: this.contractId,
          accounts: this.hardwareAccounts,
        });
        break;
      default:
        throw new Error("Invalid wallet type");
    }

    this.network = { ...this.selector.options.network };
    this.wallet = wallet;
    this.accounts = accounts;
    this.activeAccount = accounts[0];
    return this.accounts.map((a) => a.accountId);
  }

  async disconnect(): Promise<void> {
    if (!this.wallet) return;

    await this.wallet.signOut();
    this.accounts = [];
    this.wallet = undefined;
  }

  signTransaction(tx: NearTransactionParams): Promise<NearTransactionParams> {
    if (!this.wallet) throw new Error("Not connected");
    return Promise.resolve(tx);
  }

  async sendTransaction(
    tx: NearTransactionParams
  ): Promise<SendTransactionResult<NearTransactionResult>> {
    if (!this.wallet) throw new Error("Not connected");

    let result: FinalExecutionOutcome[];
    if (this.wallet.type === "browser") {
      throw new Error("Browser wallets not supported");
    } else {
      result = await this.wallet.signAndSendTransactions(tx);
    }

    return {
      id: result[result.length - 1].transaction_outcome.id,
      data: result,
    };
  }

  isConnected(): boolean {
    return !!this.wallet;
  }

  getActiveAccount(): Account | undefined {
    return this.activeAccount;
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  getAddress(): string | undefined {
    return this.activeAccount?.accountId;
  }

  getAddresses(): string[] {
    if (!this.selector) return [];
    return this.accounts.map((a) => a.accountId);
  }

  setMainAddress(address: string): void {
    const account = this.accounts.find((acc) => acc.accountId === address);
    if (!account) {
      throw new Error("Account not found/enabled");
    }
    this.selector?.setActiveAccount(address);
    this.activeAccount = account;
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  getIcon(): string {
    return this.module.metadata.iconUrl;
  }

  getName(): string {
    return this.module.metadata.name;
  }

  getUrl(): string {
    return this.module.type === "injected"
      ? (this.module.metadata as InjectedWalletMetadata).downloadUrl
      : "https://near.org";
  }

  getNetworkInfo(): Network | undefined {
    return this.network;
  }

  /** Returns the active/internal wallet */
  getWallet(): Promise<InternalWallet | undefined> {
    return Promise.resolve(this.wallet);
  }
}
