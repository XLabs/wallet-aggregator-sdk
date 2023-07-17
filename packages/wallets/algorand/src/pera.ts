import { PeraWalletConnect } from "@perawallet/connect";
import { Address, NotSupported } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from "algosdk";
import { AlgorandWallet } from "./algorand";
import {
  AlgorandWalletParams,
  AlgorandWalletType,
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
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOS42IiBmaWxsPSIjRkZFRTU1Ii8+CjxwYXRoIGQ9Ik0yNi4wODE1IDExLjg1MDVDMjYuODI2IDE0LjkzNTEgMjYuNTc0NCAxNy42NDg0IDI1LjUxOTQgMTcuOTEwOUMyNC40NjQ0IDE4LjE3MzMgMjMuMDA1NyAxNS44ODU1IDIyLjI2MTIgMTIuODAwOUMyMS41MTY3IDkuNzE2MjYgMjEuNzY4NCA3LjAwMjkyIDIyLjgyMzMgNi43NDA0N0MyMy44NzgzIDYuNDc4MDIgMjUuMzM3IDguNzY1ODQgMjYuMDgxNSAxMS44NTA1WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTM4LjM3NTIgMTQuNTAyNUMzNi43MjY0IDEyLjc1NSAzMy40NDYxIDEzLjIyODcgMzEuMDQ4NSAxNS41NjA0QzI4LjY1MDkgMTcuODkyMiAyOC4wNDM4IDIxLjE5OSAyOS42OTI2IDIyLjk0NjVDMzEuMzQxNCAyNC42OTQgMzQuNjIxNyAyNC4yMjA0IDM3LjAxOTMgMjEuODg4NkMzOS40MTY5IDE5LjU1NjkgNDAuMDI0IDE2LjI1IDM4LjM3NTIgMTQuNTAyNVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yNS4yNjE2IDQxLjI2MDdDMjYuMzE2NiA0MC45OTgyIDI2LjUzMTIgMzguMTMxNCAyNS43NDEgMzQuODU3NEMyNC45NTA4IDMxLjU4MzQgMjMuNDU1IDI5LjE0MjEgMjIuNCAyOS40MDQ2QzIxLjM0NTEgMjkuNjY3IDIxLjEzMDQgMzIuNTMzOSAyMS45MjA2IDM1LjgwNzhDMjIuNzEwOSAzOS4wODE4IDI0LjIwNjcgNDEuNTIzMSAyNS4yNjE2IDQxLjI2MDdaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTQuNTA3NCAxNi4xMDIzQzE3LjU1MSAxNi45OTk5IDE5Ljc3NSAxOC41NzQ1IDE5LjQ3NDggMTkuNjE5NEMxOS4xNzQ2IDIwLjY2NDIgMTYuNDYzOSAyMC43ODM2IDEzLjQyMDMgMTkuODg2MUMxMC4zNzY3IDE4Ljk4ODUgOC4xNTI3NCAxNy40MTM5IDguNDUyOTMgMTYuMzY5QzguNzUzMTIgMTUuMzI0MiAxMS40NjM4IDE1LjIwNDggMTQuNTA3NCAxNi4xMDIzWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTM0LjI2MTcgMjcuOTAwN0MzNy40OTIyIDI4Ljg1MzQgMzkuODY3NiAzMC40NzI2IDM5LjU2NzQgMzEuNTE3NUMzOS4yNjcyIDMyLjU2MjMgMzYuNDA1MSAzMi42MzcxIDMzLjE3NDcgMzEuNjg0NEMyOS45NDQyIDMwLjczMTggMjcuNTY4OCAyOS4xMTI1IDI3Ljg2OSAyOC4wNjc3QzI4LjE2OTIgMjcuMDIyOCAzMS4wMzEzIDI2Ljk0ODEgMzQuMjYxNyAyNy45MDA3WiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTE3LjkzMjIgMjUuNzA4NEMxNy4xNzc0IDI0LjkyNiAxNC43MDE4IDI2LjA2NDggMTIuNDAyNyAyOC4yNTE4QzEwLjEwMzUgMzAuNDM4OSA4Ljg1MTYxIDMyLjg0NjEgOS42MDYzOCAzMy42Mjg1QzEwLjM2MTIgMzQuNDEwOSAxMi44MzY4IDMzLjI3MjIgMTUuMTM1OSAzMS4wODUxQzE3LjQzNSAyOC44OTgxIDE4LjY4NjkgMjYuNDkwOCAxNy45MzIyIDI1LjcwODRaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K";
  }

  static getWalletType(): AlgorandWalletType {
    return AlgorandWalletType.Pera;
  }
}
