import { TxResponse } from "@injectivelabs/sdk-ts";
import { ChainId as InjectiveChainId } from "@injectivelabs/ts-types";
import { MsgBroadcaster, Wallet as WalletType, WalletStrategy } from "@injectivelabs/wallet-ts";
import { ChainId, CHAIN_ID_INJECTIVE, SendTransactionResult, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import { BroadcasterOptions, InjectiveNetworkInfo, InjectiveTransaction, InjectiveWalletConfig } from "./types";

/**
 * An abstraction over Injective blockchain wallets.
 */
export abstract class InjectiveWallet extends Wallet<
  InjectiveTransaction,
  InjectiveTransaction,
  TxResponse,
  InjectiveNetworkInfo
> {
  private strategy?: WalletStrategy;
  private address?: string;
  private addresses: string[] = [];
  private readonly networkChainId: InjectiveChainId;
  private readonly type: WalletType;
  private readonly disabledWallets: WalletType[];
  private readonly broadcasterOptions: BroadcasterOptions;

  constructor({ networkChainId, type, broadcasterOptions, disabledWallets }: InjectiveWalletConfig) {
    super()
    this.networkChainId = networkChainId;
    this.broadcasterOptions = broadcasterOptions;
    this.disabledWallets = disabledWallets || [];
    this.type = type;
  }

  /** Returns the underlying wallet strategy façade */
  getWalletStrategy(): WalletStrategy | undefined {
    return this.strategy;
  }

  async connect(): Promise<string[]> {
    this.strategy = new WalletStrategy({
      chainId: this.networkChainId,
      disabledWallets: this.disabledWallets,
      wallet: this.type
    });

    this.addresses = await this.strategy.getAddresses();
    if (this.addresses.length === 0) {
      throw new Error(`No addresses found for wallet of type ${this.type}`);
    }

    this.address = this.addresses[0];

    return this.addresses;
  }

  getNetworkInfo(): InjectiveNetworkInfo | undefined {
    return { id: this.networkChainId };
  }

  isConnected(): boolean {
    return !!this.strategy;
  }

  async disconnect(): Promise<void> {
    await this.strategy?.disconnectWallet();
    this.addresses = [];
    this.address = undefined;
    this.strategy = undefined;
  }

  async signTransaction(tx: InjectiveTransaction): Promise<InjectiveTransaction> {
    if (!this.strategy) throw new Error('Not connected');
    return tx;
  }

  async sendTransaction(tx: InjectiveTransaction): Promise<SendTransactionResult<TxResponse>> {
    if (!this.strategy) throw new Error('Not connected');

    const broadcaster = new MsgBroadcaster({
      walletStrategy: this.strategy,
      ...this.broadcasterOptions
    });

    const result = await broadcaster.broadcast(tx);

    return {
      id: result.txHash,
      data: result
    }
  }

  getChainId(): ChainId {
    return CHAIN_ID_INJECTIVE;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getAddresses(): string[] {
    return this.addresses;
  }

  setMainAddress(address: string): void {
    if (!this.addresses.includes(address)) {
      throw new Error('Unknown address')
    }
    this.address = address;
  }

  getBalance(): Promise<string> {
    throw new Error('Not supported');
  }

  signMessage(msg: any): Promise<any> {
    if (!this.strategy) throw new Error('Not connected');
    return this.strategy.signEip712TypedData(msg, this.address!);
  }
}
