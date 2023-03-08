import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { AlgorandWallet, AlgorandWalletParams, EncodedSignedTransaction, UnsignedTransaction } from "./algorand";
import algosdk from "algosdk";
import { Address, NotSupported } from "@xlabs-libs/wallet-aggregator-core";

interface SignerTransaction {
    txn: algosdk.Transaction;
}

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
    const accounts =
      await this.client.reconnectSession()
        .then(async (accounts: string[]) => accounts.length > 0 ? accounts : this.client.connect())
        .catch(() => this.client.connect());
    this.client.connector?.on('disconnect', () => this.disconnect());
    return accounts;
  }

  async innerDisconnect(): Promise<void> {
    this.client.connector?.off('disconnect');
    await this.client.disconnect();
  }

  signMessage(): Promise<Uint8Array> {
    throw new NotSupported();
  }

  async signTransaction(tx: UnsignedTransaction): Promise<EncodedSignedTransaction>;
  async signTransaction(tx: UnsignedTransaction[]): Promise<EncodedSignedTransaction[]>;
  async signTransaction(tx: UnsignedTransaction | UnsignedTransaction[]): Promise<EncodedSignedTransaction | EncodedSignedTransaction[]> {
    const toSign: SignerTransaction[][] = this.prepareTxs(
      Array.isArray(tx) ? tx : [ tx ]
    );

    const signed = await this.client.signTransaction(toSign);

    return Array.isArray(tx) ? signed : signed[0];
  }

  private prepareTxs(txs: UnsignedTransaction[]): SignerTransaction[][] {
    const groups: SignerTransaction[][] = [];

    let prev: algosdk.Transaction | undefined;
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const decoded: algosdk.Transaction = tx instanceof Uint8Array ? algosdk.decodeUnsignedTransaction(tx) : tx;

      if (groups.length === 0) {
        groups.push([ { txn: decoded } ]);
      } else {
        if (prev && prev.group && decoded.group && prev.group.equals(decoded.group)) {
          // same group
          groups[groups.length - 1].push({ txn: decoded })
        } else {
          // different group
          groups.push([ { txn: decoded } ])
        }
      }

      prev = decoded;
    }

    return groups;
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDM0MCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zMjcuMDQ5IDI4MC4xOTJMMTY5LjUyNCAxM0wxMiAyODAuMTkyTDE2OS41MjQgMTg5LjA4NEwzMjcuMDQ5IDI4MC4xOTJaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMjk5LjU0NiAzMDdMMTY5LjUyNSAyMzguNDczTDM5LjUwMzkgMzA3TDE2OS41MjUgMjY0LjY3TDI5OS41NDYgMzA3WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="
  }
}