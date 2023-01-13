import { WalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, Transaction, TransactionSignature } from "@solana/web3.js";
import { ChainId, CHAINS, SendTransactionResult, Wallet, WalletState } from "wallet-aggregator-core";

export interface SolanaAdapter extends WalletAdapter {
  signTransaction<T extends Transaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction>(
      transactions: T[]
  ): Promise<T[]>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}


export class SolanaWallet extends Wallet {
  constructor(
    private readonly adapter: SolanaAdapter,
    private readonly connection: Connection
  ) {
    super();
  }

  getAdapter(): SolanaAdapter {
    return this.adapter;
  }

  getName(): string {
    return this.adapter.name;
  }

  async connect(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.adapter.on('connect', () => {
        this.adapter.off('connect');
        this.adapter.off('error');

        resolve(this.getAddresses());
        this.emit('connect');
      });

      this.adapter.on('error', () => {
        this.adapter.off('connect');
        this.adapter.off('error');
        reject();
      });

      this.adapter.connect();
    });
  }

  async disconnect(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.adapter.on('disconnect', () => {
        this.adapter.off('disconnect');
        this.adapter.off('error');
        resolve(undefined);
      });

      this.adapter.on('error', () => {
        this.adapter.off('disconnect');
        this.adapter.off('error');
        reject();
      });

      this.adapter.disconnect();
    });

    this.emit('disconnect');
  }

  getChainId(): ChainId {
    return CHAINS['solana'];
  }

  getAddress(): string | undefined {
    return this.adapter.publicKey?.toString();
  }

  getAddresses(): string[] {
    const address = this.getAddress()
    return address ? [ address ] : []
  }

  setMainAddress(address: string): void {
    throw new Error('Not supported')
  }

  getBalance(): Promise<string> {
    throw new Error("Not supported")
  }

  signTransaction(tx: any): Promise<any> {
    if (!this.adapter.signTransaction || !this.adapter.signAllTransactions) throw new Error('Not supported');
    return Array.isArray(tx) ? this.adapter.signAllTransactions(tx) : this.adapter.signTransaction(tx)
  }

  async sendTransaction(tx: any): Promise<SendTransactionResult> {
    const result = await this.adapter.sendTransaction(tx, this.connection);
    return {
      id: result
    }
  }

  signMessage(msg: Uint8Array): Promise<any> {
    if (!this.adapter.signMessage) throw new Error('Not supported');
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
