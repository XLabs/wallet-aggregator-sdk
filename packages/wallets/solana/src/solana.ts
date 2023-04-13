import { WalletAdapter, WalletError } from "@solana/wallet-adapter-base";
import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";
import {
  CHAIN_ID_SOLANA,
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
  SolanaSignedTransaction,
  SolanaSubmitTransactionResult,
  SolanaUnsignedTransaction,
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
    return this.adapter.name;
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
    tx: Transaction
  ): Promise<SendTransactionResult<TransactionSignature>>;
  async sendTransaction(
    tx: Transaction[]
  ): Promise<SendTransactionResult<TransactionSignature[]>>;
  async sendTransaction(
    toSign: SolanaSignedTransaction
  ): Promise<SendTransactionResult<SolanaSubmitTransactionResult>> {
    const txs = Array.isArray(toSign) ? toSign : [toSign];

    if (txs.length === 0) {
      throw new Error("Empty transactions array");
    }

    const ids: TransactionSignature[] = [];
    for (const tx of txs) {
      const id = await this.adapter.sendTransaction(tx, this.connection);
      ids.push(id);
    }

    await this.connection.confirmTransaction(ids[0]);

    return {
      id: ids[0],
      data: ids.length === 1 ? ids[0] : ids,
    };
  }

  async signAndSendTransaction(
    tx: SolanaUnsignedTransaction
  ): Promise<SendTransactionResult<SolanaSubmitTransactionResult>> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const signed = await this.signTransaction(tx);
    return this.sendTransaction(signed);
  }

  signMessage(msg: SolanaMessage): Promise<Signature> {
    if (!this.adapter.signMessage) throw new Error("Not supported");
    return this.adapter.signMessage(msg);
  }

  getIcon(): string {
    return this.adapter.icon;
  }

  getWalletState(): WalletState {
    const state = this.adapter.readyState;
    if (!(state in WalletState)) {
      throw new Error(`Unknown wallet state ${state}`);
    }
    return WalletState[state];
  }
}
