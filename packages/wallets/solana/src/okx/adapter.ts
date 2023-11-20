import {
  BaseMessageSignerWalletAdapter,
  isVersionedTransaction,
  scopePollingDetectionStrategy,
  WalletAccountError,
  WalletConnectionError,
  WalletDisconnectedError,
  WalletDisconnectionError,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

import type {
  EventEmitter,
  SendTransactionOptions,
  WalletName,
} from "@solana/wallet-adapter-base";
import type {
  Connection,
  SendOptions,
  Transaction,
  TransactionSignature,
  TransactionVersion,
  VersionedTransaction,
} from "@solana/web3.js";

interface OKXWalletEvents {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(newPublicKey: PublicKey): unknown;
}

interface OKXWalletSolanaAdapter extends EventEmitter<OKXWalletEvents> {
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;

  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;

  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
}

interface OKXWindow extends Window {
  okxwallet?: {
    solana?: OKXWalletSolanaAdapter;
  };
}

declare const window: OKXWindow;

export const OKXWalletName = "OKX Wallet" as WalletName<"OKX Wallet">;

export class OKXWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = OKXWalletName;
  url = "https://okx.com/web3";
  icon =
    "data:image/png;base64,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";
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set([
    "legacy",
    0,
  ]);

  #connecting = false;
  #wallet: OKXWalletSolanaAdapter | null = null;
  #publicKey: PublicKey | null = null;
  #readyState: WalletReadyState =
    typeof window === "undefined" || typeof document === "undefined"
      ? WalletReadyState.Unsupported
      : WalletReadyState.NotDetected;

  constructor() {
    super();
    this.#connecting = false;
    this.#wallet = null;
    this.#publicKey = null;

    if (this.#readyState !== WalletReadyState.Unsupported) {
      scopePollingDetectionStrategy(() => {
        if (window.okxwallet?.solana) {
          this.#readyState = WalletReadyState.Installed;
          this.emit("readyStateChange", this.#readyState);
          return true;
        }
        return false;
      });
    }
  }

  get publicKey() {
    return this.#publicKey;
  }

  get connecting() {
    return this.#connecting;
  }

  get readyState() {
    return this.#readyState;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;
      if (this.readyState !== WalletReadyState.Installed)
        throw new WalletNotReadyError();

      this.#connecting = true;

      const wallet = window.okxwallet?.solana;

      if (!wallet?.isConnected) {
        try {
          await wallet?.connect();
        } catch (error: unknown) {
          throw new WalletConnectionError("connection error", error);
        }
      }

      if (!wallet?.publicKey) throw new WalletAccountError();

      let publicKey: PublicKey;
      try {
        publicKey = new PublicKey(wallet.publicKey.toBytes());
      } catch (error: unknown) {
        throw new WalletPublicKeyError("publickey error", error);
      }

      wallet.on("disconnect", this._disconnected);
      wallet.on("accountChanged", this._accountChanged);

      this.#wallet = wallet;
      this.#publicKey = publicKey;

      this.emit("connect", publicKey);
    } catch (error: unknown) {
      this.emit("error", error as WalletError);
      throw error;
    } finally {
      this.#connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this.#wallet;
    if (wallet) {
      wallet.off("disconnect", this._disconnected);
      wallet.off("accountChanged", this._accountChanged);

      this.#wallet = null;
      this.#publicKey = null;

      try {
        await wallet.disconnect();
      } catch (error: unknown) {
        this.emit(
          "error",
          new WalletDisconnectionError("disconnect error", error)
        );
      }
    }

    this.emit("disconnect");
  }

  async sendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    connection: Connection,
    options: SendTransactionOptions = {}
  ): Promise<TransactionSignature> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        const { signers, ...sendOptions } = options;

        if (isVersionedTransaction(transaction)) {
          signers?.length && transaction.sign(signers);
        } else {
          transaction = (await this.prepareTransaction(
            transaction,
            connection,
            sendOptions
          )) as T;
          signers?.length &&
            (transaction as Transaction).partialSign(...signers);
        }

        sendOptions.preflightCommitment =
          sendOptions.preflightCommitment || connection.commitment;

        const { signature } = await wallet.signAndSendTransaction(
          transaction,
          sendOptions
        );
        return signature;
      } catch (error: unknown) {
        if (error instanceof WalletError) throw error;
        throw new WalletSendTransactionError("send transaction error", error);
      }
    } catch (error: unknown) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signTransaction(transaction)) || transaction;
      } catch (error: unknown) {
        throw new WalletSignTransactionError("sign transaction error", error);
      }
    } catch (error: unknown) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        return (await wallet.signAllTransactions(transactions)) || transactions;
      } catch (error: unknown) {
        throw new WalletSignTransactionError(
          "sign all transactions error",
          error
        );
      }
    } catch (error: unknown) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this.#wallet;
      if (!wallet) throw new WalletNotConnectedError();

      try {
        const { signature } = await wallet.signMessage(message);
        return signature;
      } catch (error: unknown) {
        throw new WalletSignMessageError("sign message error", error);
      }
    } catch (error: unknown) {
      this.emit("error", error as WalletError);
      throw error;
    }
  }

  private _disconnected = () => {
    const wallet = this.#wallet;
    if (wallet) {
      wallet.off("disconnect", this._disconnected);
      wallet.off("accountChanged", this._accountChanged);

      this.#wallet = null;
      this.#publicKey = null;

      this.emit("error", new WalletDisconnectedError());
      this.emit("disconnect");
    }
  };

  private _accountChanged = (newPublicKey: PublicKey) => {
    const publicKey = this.#publicKey;
    if (!publicKey) return;

    try {
      newPublicKey = new PublicKey(newPublicKey.toBytes());
    } catch (error: unknown) {
      this.emit("error", new WalletPublicKeyError("publickey error", error));
      return;
    }

    if (publicKey.equals(newPublicKey)) return;

    this.#publicKey = newPublicKey;
    this.emit("connect", newPublicKey);
  };
}
