import {
  Account,
  Action,
  FinalExecutionOutcome,
  Network,
  NetworkId,
  setupWalletSelector,
  Wallet as InternalWallet,
  WalletMetadata,
  WalletSelector,
} from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import {
  Address,
  NotSupported,
  SendTransactionResult,
} from "@xlabs-libs/wallet-aggregator-core";
import { BN } from "bn.js";
import {
  Account as ConnectedAccount,
  connect,
  ConnectConfig as NearConfig,
} from "near-api-js";
import {
  NearTransactionParams,
  NearTransactionResult,
  NearWallet,
} from "./near";

export interface NearModalSelectorWalletParams {
  /** Near configuration */
  config: NearConfig;
  /** List of modules/wallets available */
  modules: any[];
  /** Contract ID the wallet/application will interact with */
  contractId: string;
  /** Allow browser wallets to redirect to another page */
  allowRedirect?: boolean;
}

/**
 * A class that acts as a façade for Near wallets, and provides a ui modal
 * to select between them.
 *
 * ```ts
 * import { wrapWallet } from "@xlabs-libs/wallet-aggregator-near";
 * import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
 *
 *
 * new NearModalSelectorWallet({
 *    config,
 *    contractId,
 *    modules: [
 *     setupMeteorWallet(),
 *     setupSender(),
 *     // ... other modules
 *    ]
 * });
 *
 * // or with a utility function
 * const meteorWallet = wrapWallet({ config, contractId, factory: setupMeteorWallet() });
 * ```
 */
export class NearModalSelectorWallet extends NearWallet {
  private readonly config: NearConfig;
  // Keep as any[] for now to avoid build errors due to mismatching @near-wallet-selector/* wallets
  // and the package's @near-wallet-selector/core version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly modules: any[];
  private readonly contractId: string;
  private accounts: Account[] = [];
  private activeAccount?: Account;
  private selector?: WalletSelector;
  private metadata?: WalletMetadata;
  private allowRedirect: boolean;
  private network?: Network;

  constructor({
    config,
    modules,
    contractId,
    allowRedirect,
  }: NearModalSelectorWalletParams) {
    super();
    this.config = config;
    this.modules = modules;
    this.contractId = contractId;
    this.allowRedirect = allowRedirect ?? true;
  }

  getAddress(): string | undefined {
    return this.activeAccount?.accountId;
  }

  getAddresses(): string[] {
    if (!this.selector) return [];

    return this.accounts.map((a) => a.accountId);
  }

  setMainAddress(id: string): void {
    const account = this.accounts.find((acc) => acc.accountId === id);
    if (!account) {
      throw new Error("Account not found/enabled");
    }
    this.selector?.setActiveAccount(id);
    this.activeAccount = account;
  }

  getNetworkInfo(): Network | undefined {
    return this.network;
  }

  getName(): string {
    if (!this.metadata) return "Near";
    return this.metadata.name;
  }

  getUrl(): string {
    return "https://near.org";
  }

  getIcon(): string {
    if (!this.metadata)
      return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MzkgNjM5Ij4KICA8cGF0aCBkPSJtNDU3LjYxLDE0NGMtMTMsMC0yNS4wNyw2Ljc0LTMxLjg4LDE3LjgybC03My4zNywxMDguOTNjLTIuMzksMy41OS0xLjQyLDguNDMsMi4xNywxMC44MiwyLjkxLDEuOTQsNi43NiwxLjcsOS40MS0uNThsNzIuMjItNjIuNjRjMS4yLTEuMDgsMy4wNS0uOTcsNC4xMy4yMy40OS41NS43NSwxLjI2Ljc1LDEuOTl2MTk2LjEyYzAsMS42Mi0xLjMxLDIuOTItMi45MywyLjkyLS44NywwLTEuNjktLjM4LTIuMjQtMS4wNUwyMTcuNTYsMTU3LjI0Yy03LjExLTguMzktMTcuNTUtMTMuMjMtMjguNTQtMTMuMjRoLTcuNjNjLTIwLjY1LDAtMzcuMzksMTYuNzQtMzcuMzksMzcuMzl2Mjc2LjIyYzAsMjAuNjUsMTYuNzQsMzcuMzksMzcuMzksMzcuMzksMTMsMCwyNS4wNy02Ljc0LDMxLjg4LTE3LjgybDczLjM3LTEwOC45M2MyLjM5LTMuNTksMS40Mi04LjQzLTIuMTctMTAuODItMi45MS0xLjk0LTYuNzYtMS43LTkuNDEuNThsLTcyLjIyLDYyLjY0Yy0xLjIsMS4wOC0zLjA1Ljk3LTQuMTMtLjIzLS40OS0uNTUtLjc1LTEuMjYtLjc0LTEuOTl2LTE5Ni4xN2MwLTEuNjIsMS4zMS0yLjkyLDIuOTMtMi45Mi44NiwwLDEuNjkuMzgsMi4yNCwxLjA1bDIxOC4yOCwyNjEuMzdjNy4xMSw4LjM5LDE3LjU1LDEzLjIzLDI4LjU0LDEzLjI0aDcuNjNjMjAuNjUuMDEsMzcuNC0xNi43MiwzNy40Mi0zNy4zN1YxODEuMzljMC0yMC42NS0xNi43NC0zNy4zOS0zNy4zOS0zNy4zOVoiLz4KPC9zdmc+";
    return this.metadata.iconUrl;
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  async signTransaction(
    tx: NearTransactionParams
  ): Promise<NearTransactionParams> {
    const wallet = await this.getWallet();
    if (!wallet) throw new Error("Not connected");
    return tx;
  }

  async sendTransaction(
    txs: NearTransactionParams
  ): Promise<SendTransactionResult<NearTransactionResult>> {
    const wallet = await this.getWallet();
    if (!wallet || !this.activeAccount) throw new Error("Not connected");

    let result: FinalExecutionOutcome[];
    if (wallet.type === "browser") {
      const connection = await connect(this.config);
      const account = await connection.account(this.activeAccount.accountId);
      result = [];
      for (const tx of txs.transactions) {
        // browser wallets may redirect to another page, which might not be desirable for developers
        if (this.allowRedirect) {
          for (const tx of txs.transactions) {
            const outcome = await wallet.signAndSendTransaction(tx);
            result.push(outcome as FinalExecutionOutcome);
          }
        } else {
          for (const action of tx.actions) {
            result.push(await this.executeAction(account, action));
          }
        }
      }
    } else {
      result = await wallet.signAndSendTransactions(txs);
    }

    return {
      id: result[result.length - 1].transaction_outcome.id,
      data: result,
    };
  }

  private async executeAction(
    account: ConnectedAccount,
    action: Action
  ): Promise<FinalExecutionOutcome> {
    switch (action.type) {
      case "FunctionCall":
        return account.functionCall({
          args: action.params.args,
          methodName: action.params.methodName,
          gas: new BN(action.params.gas || 0),
          attachedDeposit: new BN(action.params.deposit || 0),
          contractId: this.contractId,
        });
      default:
        throw new Error(
          "WIP: only FunctionCall is supported for browser wallets"
        );
    }
  }

  signMessage(): Promise<never> {
    throw new NotSupported();
  }

  /**
   * TODO: this is using a modal library. Find a way to programatically select a wallet, maybe by receiving
   * the type through constructor or as an argument for connect()
   */
  async connect(): Promise<Address[]> {
    const selector = await setupWalletSelector({
      network: this.config.networkId as NetworkId,
      modules: this.modules, // eslint-disable-line
    });

    this.selector = selector;

    return new Promise((resolve, reject) => {
      const modal = setupModal(selector, {
        contractId: this.contractId,
        onHide: (reason) => {
          if (reason === "user-triggered") {
            reject("Connect cancelled");
          }
        },
      });

      modal.show();

      const onSignIn = async ({ accounts }: { accounts: Account[] }) => {
        await onConnect(accounts);
      };

      const onConnect = async (accounts: Account[]) => {
        modal.hide();

        const wallet = await selector.wallet();

        this.accounts = accounts;
        this.activeAccount = accounts[0];
        this.metadata = wallet?.metadata;
        this.network = {
          ...selector.options.network,
        };

        selector?.on("networkChanged", this.onNetworkChange);

        selector?.off("signedIn", onSignIn);
        resolve(this.getAddresses());
      };

      selector.on("signedIn", onSignIn);

      const accounts = selector.store.getState().accounts;
      if (accounts.length > 0) {
        onConnect(accounts).catch(reject);
      }
    });
  }

  isConnected(): boolean {
    return !!this.selector?.isSignedIn();
  }

  async disconnect(): Promise<void> {
    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error("Not connected");
    }

    this.accounts = [];
    this.activeAccount = undefined;
    this.metadata = undefined;
    await wallet.signOut();

    this.selector?.off("networkChanged", this.onNetworkChange);
    this.selector = undefined;
  }

  /** Returns the active/internal wallet */
  async getWallet(): Promise<InternalWallet | undefined> {
    return this.selector?.wallet();
  }

  private onNetworkChange = ({ networkId }: { networkId: string }) => {
    if (!this.network) return;

    this.network = {
      ...this.network,
      networkId,
    };

    this.emit("networkChanged");
  };
}
