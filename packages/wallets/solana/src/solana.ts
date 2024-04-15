import {
  WalletAdapter,
  WalletError,
  WalletName,
} from "@solana/wallet-adapter-base";
import { ConfirmOptions } from "@solana/web3.js";
import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";
import {
  BaseFeatures,
  CHAIN_ID_SOLANA,
  ChainId,
  SendTransactionResult,
  Signature,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";

export interface SolanaAdapter extends WalletAdapter {
  signTransaction?<T extends Transaction>(transaction: T): Promise<T>;
  signAllTransactions?<T extends Transaction>(transactions: T[]): Promise<T[]>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}

export type SolanaUnsignedTransaction = Transaction | Transaction[];
export type SolanaSignedTransaction = Transaction | Transaction[];
export type SolanaSubmitTransactionResult =
  | TransactionSignature
  | TransactionSignature[];
export type SolanaMessage = Uint8Array;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SolanaNetworkInfo {}

interface BaseSendOptions {
  options?: ConfirmOptions;
}

export interface SolanaSendTransactionParams extends BaseSendOptions {
  transaction: SolanaSignedTransaction;
}

export interface SolanaSignAndSendTransactionParams extends BaseSendOptions {
  transaction: SolanaUnsignedTransaction;
}

const BITGET_WALLET = {
  icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8yMDM1XzExMDYpIj4KPHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiM1NEZGRjUiLz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZl8yMDM1XzExMDYpIj4KPHBhdGggZD0iTTEzLjQ4MDYgMTk4LjYwNUMtMjkuMzI3NiAzMTkuMDQzIDE5OS42NjEgMjg1LjAyNyAzMTkuNTA3IDI1Mi45NjRDNDQyLjE2NSAyMTIuMjU5IDM1Ny4zODYgMzIuODI2OSAyNjkuNDE1IDI4Ljg1NThDMTgxLjQ0MyAyNC44ODQ3IDI4MC4zMjIgMTExLjgyNCAyMDUuNTk1IDEzNi42NTZDMTMwLjg2OCAxNjEuNDg3IDY2Ljk5MDcgNDguMDU4MyAxMy40ODA2IDE5OC42MDVaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIxX2ZfMjAzNV8xMTA2KSI+CjxwYXRoIGQ9Ik04NS41MTE4IC00NS44MjI1QzYzLjA1NjIgLTEwNy4xNzYgLTE2LjkxODkgLTIzLjk5NTMgLTU0LjA5OTUgMjUuMjY0M0MtODkuNTY1MiA3OC44NDc5IDMuMDA5MzcgMTI1LjE1MiAzOS4zMjA4IDEwMC4wMzdDNzUuNjMyMyA3NC45MjI3IDcuNzc0NDggNzAuMDM2MyAyOS4zNzA4IDM3LjM3ODVDNTAuOTY3MSA0LjcyMDc2IDExMy41ODEgMzAuODY5NSA4NS41MTE4IC00NS44MjI1WiIgZmlsbD0iIzAwRkZGMCIgZmlsbC1vcGFjaXR5PSIwLjY3Ii8+CjwvZz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjJfZl8yMDM1XzExMDYpIj4KPHBhdGggZD0iTTk2LjQ3OTYgMjI1LjQyNEM2NS44NTAyIDEyMi4zNjMgLTY2LjA4MTggMTc2LjYzNyAtMTI4LjIxOSAyMTYuNjU3Qy0xODcuOTkgMjY0LjA0MiAtNDYuMDcxMSA0MDAuMzQ4IDEyLjg3MjUgMzkzLjM3NkM3MS44MTYxIDM4Ni40MDMgLTM0LjQxMTggMzI3LjA2NSAxLjk4NzAyIDI5OC4xN0MzOC4zODU4IDI2OS4yNzYgMTM0Ljc2NiAzNTQuMjQ5IDk2LjQ3OTYgMjI1LjQyNFoiIGZpbGw9IiM5RDgxRkYiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyM19mXzIwMzVfMTEwNikiPgo8cGF0aCBkPSJNMjgyLjEyIC0xMDcuMzUzQzIxNi4wNDcgLTE4Ni4wMzEgMTIxLjQ2MyAtMTIwLjk3IDgyLjQyOTYgLTc4LjYwNDdDNDguMjczOSAtMzAuNjQ0NiAyMjQuMjc1IDU3LjIzMTIgMjczLjEyMSA0Mi4xNzE0QzMyMS45NjggMjcuMTExNSAyMDYuNTEyIC00LjA1MDM4IDIyNy4yOTcgLTMzLjI4NzlDMjQ4LjA4MiAtNjIuNTI1NSAzNjQuNzEyIC05LjAwNTY2IDI4Mi4xMiAtMTA3LjM1M1oiIGZpbGw9IiM0RDk0RkYiLz4KPC9nPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTkzLjE4OSAxNTIuODM2SDEzNi42NzRMODcuMjA4NiAxMDMuMDUxTDEzNy4zMSA1My4yNjYzTDE1MC45NTUgNDBIMTA1LjgxOUw0OC4zMzU5IDk3Ljc3NzNDNDUuNDM0OSAxMDAuNjg5IDQ1LjQ0OTggMTA1LjQwMiA0OC4zNjU2IDEwOC4yOTlMOTMuMTg5IDE1Mi44MzZaTTExOS4zMyAxMDMuMTY4SDExOC45OTVMMTE5LjMyNiAxMDMuMTY0TDExOS4zMyAxMDMuMTY4Wk0xMTkuMzMgMTAzLjE2OEwxNjguNzkxIDE1Mi45NDlMMTE4LjY5IDIwMi43MzRMMTA1LjA0NSAyMTZIMTUwLjE4TDIwNy42NjQgMTU4LjIyNkMyMTAuNTY1IDE1NS4zMTQgMjEwLjU1IDE1MC42MDIgMjA3LjYzNCAxNDcuNzA1TDE2Mi44MTEgMTAzLjE2OEgxMTkuMzNaIiBmaWxsPSJibGFjayIvPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfMjAzNV8xMTA2IiB4PSItOTAuMjQxMSIgeT0iLTY5LjczNjkiIHdpZHRoPSI1NjkuNTU4IiBoZWlnaHQ9IjQ1MS40MzEiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNDkuMjMwOCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzIwMzVfMTEwNiIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMV9mXzIwMzVfMTEwNiIgeD0iLTE2MC41MTEiIHk9Ii0xNjUuOTg3IiB3aWR0aD0iMzUxLjU5NiIgaGVpZ2h0PSIzNzEuNTA3IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQ5LjIzMDgiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8yMDM1XzExMDYiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZl8yMDM1XzExMDYiIHg9Ii0yNDEuMDc4IiB5PSI2Ny42NDIiIHdpZHRoPSI0NDQuODUxIiBoZWlnaHQ9IjQyNC40NTIiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNDkuMjMwOCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzIwMzVfMTEwNiIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyM19mXzIwMzVfMTEwNiIgeD0iLTIwLjM5NjgiIHk9Ii0yNDIuNzU4IiB3aWR0aD0iNDMwLjE5MSIgaGVpZ2h0PSIzODUuMTA1IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQ5LjIzMDgiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8yMDM1XzExMDYiLz4KPC9maWx0ZXI+CjxjbGlwUGF0aCBpZD0iY2xpcDBfMjAzNV8xMTA2Ij4KPHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==",
  name: "Bitget Wallet" as WalletName<"Bitget Wallet">,
};

const OVERRIDES = [BITGET_WALLET];

/**
 * Attempt to get an override for the given adapter.
 *
 * @param adapter Aptos adapter to get the override for or default to itself
 * @returns the current adapter or the override if it exists
 */
const getOverride = (adapter: WalletAdapter): Partial<WalletAdapter> =>
  OVERRIDES.find((override) =>
    override.name.toLocaleLowerCase().includes(adapter.name.toLocaleLowerCase())
  ) || adapter;

/**
 * Looks for a property in the overrides and returns it if it exists, otherwise returns the property from the adapter.
 *
 * @param propertyName property name to look for
 * @param overrides overrides to inspect for the property
 * @param adapter adapter to default to if the property is not found in the overrides
 * @returns the property value from the overrides if it exists, otherwise the property value from the adapter
 */
const getPropertyByName = <T>(
  propertyName: keyof WalletAdapter,
  overrides: Partial<WalletAdapter>,
  adapter: WalletAdapter
): T => (overrides[propertyName] || adapter[propertyName]) as T;

/**
 * Looks for a property value if overrides exist return it otherwise defaults to adapter value.
 * @param propertyName property name to look for
 * @param adapter adapter to default to if the property is not found in the overrides
 * @returns the property value
 */
const getWalletOverride = <T>(
  propertyName: keyof WalletAdapter,
  adapter: WalletAdapter
): T => getPropertyByName<T>(propertyName, getOverride(adapter), adapter);

/**
 * An abstraction over Solana blockchain wallets.
 *
 * This class works as a wrapper over the adapters provided by the `@solana/wallet-adapter-base` library. In order to use this class, simply create the adapter you wish to use and pass it as a constructor parameter:
 *
 * ```ts
 * const connection = new Connection(url)
 * const martian = new SolanaWallet(
 *     new PhantomWalletAdapter(),
 *     connection
 * )
 * ```
 */
export class SolanaWallet extends Wallet<
  typeof CHAIN_ID_SOLANA,
  void,
  SolanaUnsignedTransaction,
  SolanaSignedTransaction,
  SolanaSendTransactionParams,
  SolanaSubmitTransactionResult,
  SolanaSendTransactionParams,
  SolanaSubmitTransactionResult,
  SolanaMessage,
  Signature,
  SolanaNetworkInfo
> {
  constructor(
    private readonly adapter: SolanaAdapter,
    private readonly connection: Connection
  ) {
    super();
  }

  /** Retrieve the underlying solana adapter */
  getAdapter(): SolanaAdapter {
    return this.adapter;
  }

  getName(): string {
    return getWalletOverride("name", this.adapter);
  }

  getUrl(): string {
    return this.adapter.url;
  }

  async connect(): Promise<string[]> {
    if (this.isConnected()) return this.getAddresses();

    const addresses = await new Promise<string[]>((resolve, reject) => {
      this.adapter.on("connect", () => {
        this.adapter.off("connect");
        this.adapter.off("error");

        resolve(this.getAddresses());
      });

      this.adapter.on("error", (error: WalletError) => {
        this.adapter.off("connect");
        this.adapter.off("error");
        reject(error);
      });

      this.adapter.connect().catch(reject);
    });

    this.emit("connect");
    this.adapter.on("disconnect", () => this.emit("disconnect"));
    return addresses;
  }

  getNetworkInfo(): SolanaNetworkInfo | undefined {
    // TODO: investigate whether there is a way to retrieve the current network
    // See: https://solana.stackexchange.com/questions/141/what-method-should-a-dapp-use-to-detect-a-change-in-wallet-network-for-any-walle/309?noredirect=1#comment366_309
    return {};
  }

  isConnected(): boolean {
    return this.adapter.connected;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected()) return;

    await new Promise((resolve, reject) => {
      this.adapter.on("disconnect", () => {
        this.adapter.off("disconnect");
        this.adapter.off("error");
        resolve(undefined);
      });

      this.adapter.on("error", (error: WalletError) => {
        this.adapter.off("disconnect");
        this.adapter.off("error");
        reject(error);
      });

      this.adapter.disconnect().catch(reject);
    });

    this.adapter.removeAllListeners();
    this.emit("disconnect");
  }

  getChainId() {
    return CHAIN_ID_SOLANA;
  }

  getAddress(): string | undefined {
    return this.adapter.publicKey?.toString();
  }

  getAddresses(): string[] {
    const address = this.getAddress();
    return address ? [address] : [];
  }

  setMainAddress(): void {
    throw new Error("Not supported");
  }

  getBalance(): Promise<string> {
    throw new Error("Not supported");
  }

  async signTransaction(tx: Transaction): Promise<Transaction>;
  async signTransaction(tx: Transaction[]): Promise<Transaction[]>;
  async signTransaction(
    tx: SolanaUnsignedTransaction
  ): Promise<SolanaSignedTransaction> {
    if (!this.adapter.signTransaction || !this.adapter.signAllTransactions)
      throw new Error("Not supported");
    return Array.isArray(tx)
      ? this.adapter.signAllTransactions(tx)
      : this.adapter.signTransaction(tx);
  }

  async sendTransaction(
    params: SolanaSendTransactionParams
  ): Promise<SendTransactionResult<SolanaSubmitTransactionResult>> {
    const { transaction: toSign } = params;
    const txs = Array.isArray(toSign) ? toSign : [toSign];

    if (txs.length === 0) {
      throw new Error("Empty transactions array");
    }

    const ids: TransactionSignature[] = [];
    for (const tx of txs) {
      const id = await this.adapter.sendTransaction(tx, this.connection, {
        ...params.options,
      });
      ids.push(id);
    }

    await this.connection.confirmTransaction(
      ids[0],
      params.options?.commitment
    );

    return {
      id: ids[0],
      data: ids.length === 1 ? ids[0] : ids,
    };
  }

  async signAndSendTransaction(
    params: SolanaSignAndSendTransactionParams
  ): Promise<SendTransactionResult<SolanaSubmitTransactionResult>> {
    return this.sendTransaction(params);
  }

  signMessage(msg: SolanaMessage): Promise<Signature> {
    if (!this.adapter.signMessage) throw new Error("Not supported");
    return this.adapter.signMessage(msg);
  }

  getIcon(): string {
    return getWalletOverride("icon", this.adapter);
  }

  getWalletState(): WalletState {
    const state = this.adapter.readyState;
    if (!(state in WalletState)) {
      throw new Error(`Unknown wallet state ${state}`);
    }
    return WalletState[state];
  }

  getFeatures(): BaseFeatures[] {
    const features = [
      BaseFeatures.SendTransaction,
      BaseFeatures.SignAndSendTransaction,
    ];

    if (this.adapter.signTransaction && this.adapter.signAllTransactions) {
      features.push(BaseFeatures.SignTransaction);
    }
    if (this.adapter.signMessage) features.push(BaseFeatures.SignMessage);

    return features;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_SOLANA;
  }
}
