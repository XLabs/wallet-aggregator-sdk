import { PeraWalletConnect } from "@perawallet/connect";
import { Address, NotSupported } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from "algosdk";
import { AlgorandWallet } from "./algorand";
import {
  AlgorandWalletParams,
  SignerTransaction,
  SignTransactionResult,
} from "./types";

type PeraSignerTransaction = Omit<SignerTransaction, "txn"> & {
  txn: algosdk.Transaction;
};

type AlgorandChainIDs = 416001 | 416002 | 416003 | 4160;

interface PeraWalletConnectOptions {
  /** Whether it should show an informative message to the user */
  shouldShowSignTxnToast?: boolean;
  /** Algorand chain id to use */
  chainId?: AlgorandChainIDs;
}

/** Pera Wallet constructor params */
export interface PeraWalletParams extends AlgorandWalletParams {
  peraOptions?: PeraWalletConnectOptions;
}

export class PeraWallet extends AlgorandWallet {
  private readonly client: PeraWalletConnect;

  constructor(config: PeraWalletParams = {}) {
    super(config);
    this.client = new PeraWalletConnect({ ...config?.peraOptions });
  }

  getName(): string {
    return "Pera Wallet";
  }

  getUrl(): string {
    return "https://perawallet.app/";
  }

  async innerConnect(): Promise<Address[]> {
    const accounts = await this.client
      .reconnectSession()
      .then(async (accounts: string[]) =>
        accounts.length > 0 ? accounts : this.client.connect()
      )
      .catch(() => this.client.connect());
    this.client.connector?.on("disconnect", () => this.disconnect());
    return accounts;
  }

  async innerDisconnect(): Promise<void> {
    this.client.connector?.off("disconnect");
    await this.client.disconnect();
  }

  signMessage(): Promise<Uint8Array> {
    throw new NotSupported();
  }

  async signTransaction(
    tx: SignerTransaction | SignerTransaction[]
  ): Promise<SignTransactionResult> {
    const toSign: PeraSignerTransaction[][] = this.prepareTxs(
      Array.isArray(tx) ? tx : [tx]
    );

    const result = await this.client.signTransaction(toSign);
    return this.completeMissingSignatures(toSign, result);
  }

  private completeMissingSignatures(
    toSign: PeraSignerTransaction[][],
    signatures: Uint8Array[]
  ): SignTransactionResult {
    // The ARC-0001 standard states that some transactions may not be signed by the wallet
    // instead returning null as a signature. However, pera skip these null signatures
    // from the returned signatures list. So, in order to keep it consistent we fill them in
    // by checking for each tx if it needs a signature or not
    const signed = [];
    let i = 0;
    for (const group of toSign) {
      for (const tx of group) {
        signed.push(
          tx.signers && tx.signers.length === 0
            ? null
            : Buffer.from(signatures[i++]).toString("base64")
        );
      }
    }

    return signed;
  }

  private prepareTxs(txs: SignerTransaction[]): PeraSignerTransaction[][] {
    const groups: PeraSignerTransaction[][] = [];

    let prev: algosdk.Transaction | undefined;
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const decoded: algosdk.Transaction = algosdk.decodeUnsignedTransaction(
        Buffer.from(tx.txn, "base64")
      );

      if (groups.length === 0) {
        groups.push([{ ...tx, txn: decoded }]);
      } else {
        if (
          prev &&
          prev.group &&
          decoded.group &&
          prev.group.equals(decoded.group)
        ) {
          // same group
          groups[groups.length - 1].push({ ...tx, txn: decoded });
        } else {
          // different group
          groups.push([{ ...tx, txn: decoded }]);
        }
      }

      prev = decoded;
    }

    return groups;
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA4NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQ4LjU0NzEgMTQuMTA3QzUwLjU5NDIgMjIuNTg4NiA0OS45MDIyIDMwLjA0OTQgNDcuMDAxNCAzMC43NzFDNDQuMTAwNyAzMS40OTI2IDQwLjA4OTYgMjUuMjAyIDM4LjA0MjUgMTYuNzIwM0MzNS45OTUzIDguMjM4NzMgMzYuNjg3NCAwLjc3ODAyMSAzOS41ODgxIDAuMDU2Mzc0QzQyLjQ4ODkgLTAuNjY1MjczIDQ2LjQ5OTkgNS42MjU0MiA0OC41NDcxIDE0LjEwN1oiIGZpbGw9IiMxQzFDMUMiLz4KPHBhdGggZD0iTTgyLjM1MDQgMjEuMzk5MkM3Ny44MTY4IDE2LjU5NDIgNjguNzk3MiAxNy44OTY2IDYyLjIwNDUgMjQuMzA4MUM1NS42MTE4IDMwLjcxOTYgNTMuOTQyNiAzOS44MTIzIDU4LjQ3NjIgNDQuNjE3M0M2My4wMDk4IDQ5LjQyMjIgNzIuMDI5NCA0OC4xMTk5IDc4LjYyMjEgNDEuNzA4NEM4NS4yMTQ4IDM1LjI5NjkgODYuODg0IDI2LjIwNDEgODIuMzUwNCAyMS4zOTkyWiIgZmlsbD0iIzFDMUMxQyIvPgo8cGF0aCBkPSJNNDYuMjkyNiA5NC45NzQ3QzQ5LjE5MzQgOTQuMjUzIDQ5Ljc4MzUgODYuMzcwMiA0Ny42MTA3IDc3LjM2OEM0NS40Mzc5IDY4LjM2NTcgNDEuMzI1IDYxLjY1MyAzOC40MjQyIDYyLjM3NDZDMzUuNTIzNSA2My4wOTYzIDM0LjkzMzMgNzAuOTc5MSAzNy4xMDYxIDc5Ljk4MTNDMzkuMjc4OSA4OC45ODM2IDQzLjM5MTggOTUuNjk2MyA0Ni4yOTI2IDk0Ljk3NDdaIiBmaWxsPSIjMUMxQzFDIi8+CjxwYXRoIGQ9Ik0xNi43MjIzIDI1Ljc5ODJDMjUuMDkxMiAyOC4yNjYxIDMxLjIwNjQgMzIuNTk1OCAzMC4zODA5IDM1LjQ2ODdDMjkuNTU1NSAzOC4zNDE3IDIyLjEwMjEgMzguNjcgMTMuNzMzMiAzNi4yMDIxQzUuMzY0MzggMzMuNzM0MSAtMC43NTA3NzggMjkuNDA0NSAwLjA3NDYzOTIgMjYuNTMxNUMwLjkwMDA1NiAyMy42NTg2IDguMzUzNDkgMjMuMzMwMiAxNi43MjIzIDI1Ljc5ODJaIiBmaWxsPSIjMUMxQzFDIi8+CjxwYXRoIGQ9Ik03MS4wMzk4IDU4LjIzOTZDNzkuOTIyMyA2MC44NTkgODYuNDUzOSA2NS4zMTE1IDg1LjYyODUgNjguMTg0NEM4NC44MDMxIDcxLjA1NzQgNzYuOTMzMiA3MS4yNjI5IDY4LjA1MDcgNjguNjQzNUM1OS4xNjgxIDY2LjAyNCA1Mi42MzY1IDYxLjU3MTYgNTMuNDYxOSA1OC42OTg2QzU0LjI4NzMgNTUuODI1NyA2Mi4xNTcyIDU1LjYyMDEgNzEuMDM5OCA1OC4yMzk2WiIgZmlsbD0iIzFDMUMxQyIvPgo8cGF0aCBkPSJNMjYuMTM5MiA1Mi4yMTE2QzI0LjA2MzkgNTAuMDYwMyAxNy4yNTY3IDUzLjE5MTMgMTAuOTM1IDU5LjIwNUM0LjYxMzI2IDY1LjIxODcgMS4xNzA4OSA3MS44Mzc3IDMuMjQ2MjQgNzMuOTg5QzUuMzIxNTkgNzYuMTQwMyAxMi4xMjg4IDczLjAwOTMgMTguNDUwNSA2Ni45OTU2QzI0Ljc3MjIgNjAuOTgxOSAyOC4yMTQ2IDU0LjM2MjkgMjYuMTM5MiA1Mi4yMTE2WiIgZmlsbD0iIzFDMUMxQyIvPgo8L3N2Zz4K";
  }
}
