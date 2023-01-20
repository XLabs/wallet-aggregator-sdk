import { DirectSignResponse } from "@cosmjs/proto-signing";
import { TxRaw } from '@injectivelabs/chain-api/cosmos/tx/v1beta1/tx_pb';
import { TxResponse } from "@injectivelabs/sdk-ts";
import { ChainId as InjectiveChainId } from "@injectivelabs/ts-types";
import { Wallet as WalletType, WalletStrategy } from "@injectivelabs/wallet-ts";
import { ChainId, CHAIN_ID_INJECTIVE, SendTransactionResult, Wallet } from "@xlabs-libs/wallet-aggregator-core";

export interface InjectiveWalletConfig {
  networkChainId: InjectiveChainId;
  type?: WalletType;
  disabledWallets?: WalletType[];
}

interface InjectiveCosmosTransaction {
  txRaw: TxRaw;
  accountNumber: number;
  chainId: string;
  address: string;
}

export class InjectiveWallet extends Wallet<
  InjectiveCosmosTransaction,
  DirectSignResponse,
  TxResponse
> {
  private strategy?: WalletStrategy;
  private address?: string;
  private addresses: string[] = [];
  private readonly networkChainId: InjectiveChainId;
  private readonly type?: WalletType;
  private readonly disabledWallets: WalletType[] = [];

  constructor({ networkChainId, disabledWallets, type }: InjectiveWalletConfig) {
    super()
    this.networkChainId = networkChainId;
    this.disabledWallets = disabledWallets || [];
    this.type = type;
  }

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

  async disconnect(): Promise<void> {
    await this.strategy?.disconnectWallet();
    this.addresses = [];
    this.address = undefined;
    this.strategy = undefined;
  }

  async signTransaction(tx: InjectiveCosmosTransaction): Promise<DirectSignResponse> {
    if (!this.strategy) throw new Error('Not connected');
    return this.strategy.signCosmosTransaction(tx);
  }

  async sendTransaction(tx: DirectSignResponse): Promise<SendTransactionResult<TxResponse>> {
    if (!this.strategy) throw new Error('Not connected');
    const result = await this.strategy.sendTransaction(tx, {
      chainId: this.networkChainId,
      address: this.address!
    });

    return {
      id: result.txHash,
      data: result
    }
  }

  getName(): string {
    const suffix = this.type ? ` (${this.type})` : '';
    return `Injective${suffix}`
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

  getIcon(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xNDguNDk3IDE2OS4xMzVDMTUwLjk4MSAxNjYuMDEzIDE1My42MTMgMTYzLjAwOSAxNTYuMjQ1IDE2MC4wMDVDMTU2LjM2MyAxNTkuODU2IDE1Ni42MyAxNTkuODI2IDE1Ni43NDggMTU5LjY3N0MxNTYuOTg1IDE1OS4zOCAxNTcuMzcgMTU5LjIwMSAxNTcuNjA2IDE1OC45MDNMMTU3Ljg0MyAxNTguNjA2QzE1OS42NzggMTU2LjkxIDE2MS42MyAxNTUuMDY0IDE2My44ODEgMTUzLjQ1NkMxNzEuODQ1IDE0Ny40MSAxODAuMTEgMTQyLjgxNyAxODguODI1IDEzOS43OTVDMjE2Ljc3OCAxMjkuOTgxIDI0Ny44OTQgMTM2LjAyOSAyNzIuMjk1IDE1OS4wNjVDMzA2LjM2NiAxOTEuMDAyIDMwMy4zMTUgMjQyLjQ1MSAyNzYuMTE3IDI3Ni42NDdDMjQxLjc0OCAzMjcuNjI1IDE4Mi42ODQgMzk4Ljc0OCAyNjQuNDYzIDQ2Mi40NkMyNzkuMTY3IDQ3My45MTYgMjkwLjA3NSA0ODMuMzYxIDMzNi4zOTIgNDk2Ljc0NkMzMDYuMSA1MDIuMzI2IDI3OC4wMTIgNTAwLjU5IDI0Ni43NDggNDkyLjYwNUMyMjQuNjM0IDQ4MC4xMjMgMTg5Ljg2NiA0NTMuMzk3IDE3OC4wMzcgNDE3LjNDMTYwLjE1OSAzNjIuNTYyIDIwOS41MTMgMjgwLjczMiAyMzMuMzY1IDI0OS4yMTZDMjY2LjExMyAyMDUuNTk5IDIxMy4xMjQgMTU4LjM4MiAxNzQuMTEyIDIxMS4wOTVDMTUzLjcyIDIzOC41NjYgMTE4LjA0NCAzMTYuMzAzIDEzMC40NDIgMzczLjk2NUMxMzcuNjkxIDQwNi42NjQgMTQ3LjM1MyA0MzAuNDk5IDE4NS42NjMgNDYzLjI0MUMxNzguNTU5IDQ1OS4wNDkgMTcxLjY2IDQ1NC4yOTQgMTY0Ljk2OCA0NDguOTc0Qzc1Ljk1NyAzNjYuMDYgODYuMjgzOCAyMzcuODU5IDE0OC40OTcgMTY5LjEzNVoiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcikiLz4KPHBhdGggZD0iTTQ1MS41MDMgNDMwLjg2NUM0NDkuMDE5IDQzMy45ODcgNDQ2LjM4NyA0MzYuOTkxIDQ0My43NTUgNDM5Ljk5NUM0NDMuNjM3IDQ0MC4xNDQgNDQzLjM3IDQ0MC4xNzQgNDQzLjI1MiA0NDAuMzIzQzQ0My4wMTUgNDQwLjYyIDQ0Mi42MyA0NDAuNzk5IDQ0Mi4zOTQgNDQxLjA5N0w0NDIuMTU3IDQ0MS4zOTRDNDQwLjMyMiA0NDMuMDkgNDM4LjM3IDQ0NC45MzYgNDM2LjExOSA0NDYuNTQ0QzQyOC4xNTUgNDUyLjU5IDQxOS44OSA0NTcuMTgzIDQxMS4xNzUgNDYwLjIwNUMzODMuMjIyIDQ3MC4wMTkgMzUyLjEwNiA0NjMuOTcxIDMyNy43MDUgNDQwLjkzNUMyOTMuNjM0IDQwOC45OTggMjk2LjY4NSAzNTcuNTQ5IDMyMy44ODMgMzIzLjM1M0MzNTguMjUyIDI3Mi4zNzUgNDE3LjMxNiAyMDEuMjUyIDMzNS41MzcgMTM3LjU0QzMyMC44MzMgMTI2LjA4NCAzMDkuOTI1IDExNi42MzkgMjYzLjYwOCAxMDMuMjU0QzI5My45IDk3LjY3MzYgMzIxLjk4OCA5OS40MDk1IDM1My4yNTEgMTA3LjM5NUMzNzUuMzY2IDExOS44NzcgNDEwLjEzNCAxNDYuNjAzIDQyMS45NjMgMTgyLjdDNDM5Ljg0MSAyMzcuNDM4IDM5MC40ODcgMzE5LjI2OCAzNjYuNjM1IDM1MC43ODRDMzMzLjg4NyAzOTQuNDAxIDM4Ni44NzYgNDQxLjYxOCA0MjUuODg4IDM4OC45MDVDNDQ2LjI4IDM2MS40MzQgNDgxLjk1NiAyODMuNjk3IDQ2OS41NTggMjI2LjAzNUM0NjIuMzA5IDE5My4zMzYgNDUyLjY0NyAxNjkuNTAxIDQxNC4zMzcgMTM2Ljc1OUM0MjEuNDQxIDE0MC45NTEgNDI4LjM0IDE0NS43MDYgNDM1LjAzMiAxNTEuMDI2QzUyNC4wNDMgMjMzLjk0IDUxMy43MTYgMzYyLjE0MSA0NTEuNTAzIDQzMC44NjVaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXIpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSIxMDAiIHkxPSIzMDAiIHgyPSI1MDAiIHkyPSIzMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwODJGQSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMEYyRkUiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyIiB4MT0iMTAwIiB5MT0iMzAwIiB4Mj0iNTAwIiB5Mj0iMzAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMwMDgyRkEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDBGMkZFIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg=='
  }
}