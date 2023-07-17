import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { AlgorandWallet } from "./algorand";
import algosdk from "algosdk";
import { Address, NotSupported } from "@xlabs-libs/wallet-aggregator-core";
import {
  AlgorandWalletParams,
  AlgorandWalletType,
  SignerTransaction,
  SignTransactionResult,
} from "./types";

type DeflySignerTransaction = Omit<SignerTransaction, "txn"> & {
  txn: algosdk.Transaction;
};

type AlgorandChainIDs = 416001 | 416002 | 416003 | 4160;

interface DeflyWalletConnectOptions {
  /** Whether it should show an informative message to the user */
  shouldShowSignTxnToast?: boolean;
  /** Algorand chain id to use */
  chainId?: AlgorandChainIDs;
}

/** Defly Wallet constructor params */
export interface DeflyWalletParams extends AlgorandWalletParams {
  deflyOptions?: DeflyWalletConnectOptions;
}

export class DeflyWallet extends AlgorandWallet {
  private client: DeflyWalletConnect;

  constructor(config: DeflyWalletParams) {
    super(config);
    this.client = new DeflyWalletConnect({ ...config?.deflyOptions });
  }

  getName(): string {
    return "Defly Wallet";
  }

  getUrl(): string {
    return "https://defly.app/";
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
    const toSign: DeflySignerTransaction[][] = this.prepareTxs(
      Array.isArray(tx) ? tx : [tx]
    );

    const result = await this.client.signTransaction(toSign);
    return this.completeMissingSignatures(toSign, result);
  }

  private completeMissingSignatures(
    toSign: DeflySignerTransaction[][],
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

  private prepareTxs(txs: SignerTransaction[]): DeflySignerTransaction[][] {
    const groups: DeflySignerTransaction[][] = [];

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
    return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMyMCAzMjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyBpZD0iQXJ0Ym9hcmQxIiB0cmFuc2Zvcm09Im1hdHJpeCgwLjk4NDQwOSwwLDAsMC45OTQwNzgsMCw2Ljc5Nzg0KSI+CiAgICAgICAgPHJlY3QgeD0iMCIgeT0iLTYuODM4IiB3aWR0aD0iMzI1LjA2OCIgaGVpZ2h0PSIzMjEuOTA2IiBzdHlsZT0iZmlsbDpub25lOyIvPgogICAgICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDEuMDEyNDYsMCwwLDEuMDEyNDYsMC45ODE1NzgsMC40OTY3MDcpIj4KICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4wMTU4NCwwLDAsMS4wMDU5NiwtMTMuMTI3OSwtOS4yMjUzNCkiPgogICAgICAgICAgICAgICAgPGNpcmNsZSBjeD0iMTcwIiBjeT0iMTYwIiByPSIxNTUuMDY4Ii8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMC42ODAxNjksMCwwLDAuNjczNTU0LDQzLjc3NjEsMzQuMjY0KSI+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMzI3LjA0OSwyODAuMTkyTDE2OS41MjQsMTNMMTIsMjgwLjE5MkwxNjkuNTI0LDE4OS4wODRMMzI3LjA0OSwyODAuMTkyWiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMjk5LjU0NiwzMDdMMTY5LjUyNSwyMzguNDczTDM5LjUwNCwzMDdMMTY5LjUyNSwyNjQuNjdMMjk5LjU0NiwzMDdaIiBzdHlsZT0iZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+Cg==";
  }

  static getWalletType(): AlgorandWalletType {
    return AlgorandWalletType.Defly;
  }
}
