import { ChainId, CHAIN_ID_XPLA, NotSupported, SendTransactionResult, Wallet, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import { Connection, ConnectType, getChainOptions, Installation, NetworkInfo, SignBytesResult, TxResult, WalletController, WalletControllerOptions, WalletStates, WalletStatus } from "@xpla/wallet-provider";
import { CreateTxOptions } from '@xpla/xpla.js';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

interface XplaWalletInfo {
  type: ConnectType;
  name: string;
  icon: string;
  installed: boolean;
  identifier?: string;
  url?: string;
}

export const getWallets = async (ignoredTypes: ConnectType[] = []): Promise<XplaWallet[]> => {
  const networks = await getChainOptions();

  const controllerOptions: WalletControllerOptions = { ...networks };

  const controller = new WalletController(controllerOptions);

  const toXplaWallet = (objs: Connection[] | Installation[], installed: boolean) => {
    return objs
      .map(obj => ({ ...obj, installed }))
      .filter((walletInfo: XplaWalletInfo) => !ignoredTypes.includes(walletInfo.type))
      .map((walletInfo: XplaWalletInfo) => new XplaWallet({
        controller,
        walletInfo
      }));
  }

  const waitObservable = <T>(observable: Observable<T>): Promise<T> => {
    return new Promise((resolve) => {
      let value: T;

      const sub = observable.subscribe((val: T) => {
        value = val;
      });

      setTimeout(() => {
        sub.unsubscribe();
        resolve(value);
      }, 1000)
    });
  };

  // available to connect
  const connections: XplaWallet[] = await waitObservable(controller.availableConnections().pipe(
    map(arr => toXplaWallet(arr, true))
  )) || [];

  // installable
  const installations: XplaWallet[] = await waitObservable(controller.availableInstallations().pipe(
    map(arr => toXplaWallet(arr, false)),
  )) || [];

  return connections.concat(installations);
}

export interface XplaWalletConfig {
  controller?: WalletController;
  options?: WalletControllerOptions;
  walletInfo: XplaWalletInfo;
}

type UnsignedXplaMessage = Uint8Array | Buffer;

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const waitFor = (fn: () => boolean) => {
  return new Promise(async (resolve) => {
    while (!fn()) {
      await sleep(500);
    }
    resolve(undefined);
  });
};

export class XplaWallet extends Wallet<
  CreateTxOptions,
  CreateTxOptions,
  TxResult,
  NetworkInfo,
  UnsignedXplaMessage,
  SignBytesResult
> {
  private readonly controller: WalletController;
  private readonly walletInfo: XplaWalletInfo;
  private state: WalletStates;
  private stateSubscription?: Subscription;

  constructor({ controller, options, walletInfo }: XplaWalletConfig) {
    super();
    if (!controller && !options) throw new Error('Either controller or options must be provided');
    this.controller = controller ? controller : new WalletController(options!);
    this.walletInfo = walletInfo;
    this.state = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: this.controller.options.defaultNetwork
    }
  }

  async connect(): Promise<string[]> {
    this.stateSubscription = this.controller.states().subscribe((state) => {
      this.state = state;
    });

    await this.controller.connect(
      this.walletInfo.type,
      this.walletInfo.identifier
    );

    await waitFor(() => this.state.status === WalletStatus.WALLET_CONNECTED);

    return this.getAddresses();
  }

  async disconnect(): Promise<void> {
    this.controller.disconnect();
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = undefined;
    this.state = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: this.controller.options.defaultNetwork,
    };
  }

  getChainId(): ChainId {
    return CHAIN_ID_XPLA;
  }

  async signTransaction(tx: CreateTxOptions): Promise<CreateTxOptions> {
    if (!this.isConnected()) throw new Error('Not Connected');
    return tx;
  }

  async sendTransaction(tx: CreateTxOptions): Promise<SendTransactionResult<TxResult>> {
    if (!this.isConnected()) throw new Error('Not Connected');
    const result = await this.controller.post(tx);

    if (!result.success) {
      throw new Error(`Transaction ${result.result.txhash} failed`);
    }

    return {
      id: result.result.txhash,
      data: result
    }
  }

  signMessage(msg: UnsignedXplaMessage): Promise<SignBytesResult> {
    if (!this.isConnected()) throw new Error('Not Connected');

    const toSign = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
    return this.controller.signBytes(toSign);
  }

  getName(): string {
    return this.walletInfo.name;
  }

  getUrl(): string {
    return this.walletInfo.url || 'https://xpla.io';
  }

  getAddress(): string | undefined {
    if (!this.isConnected()) return undefined;
    return this.getAddresses()[0];
  }

  getAddresses(): string[] {
    return this.state.status === WalletStatus.WALLET_CONNECTED
      ? this.state.wallets.map(w => w.xplaAddress)
      : [];
  }

  setMainAddress(address: string): void {
    throw new NotSupported();
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  getIcon(): string {
    return this.walletInfo.icon;
  }

  isConnected(): boolean {
    return this.state.status === WalletStatus.WALLET_CONNECTED;
  }

  getNetworkInfo() {
    return this.controller.options.defaultNetwork;
  }

  getWalletState(): WalletState {
    return this.walletInfo.installed ? WalletState.Installed : WalletState.NotDetected;
  }
}
