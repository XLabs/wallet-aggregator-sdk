import {
  ChainId,
  CHAIN_ID_XPLA,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";
import {
  Connection,
  ConnectType,
  getChainOptions,
  Installation,
  NetworkInfo,
  SignBytesResult,
  TxResult,
  WalletController,
  WalletControllerOptions,
  WalletStates,
  WalletStatus,
} from "@xpla/wallet-provider";
import { CreateTxOptions } from "@xpla/xpla.js";
import { Observable, Subscription } from "rxjs";
import { map, timeout } from "rxjs/operators";

interface XplaWalletInfo {
  type: ConnectType;
  name: string;
  icon: string;
  installed: boolean;
  identifier?: string;
  url?: string;
}

export const getWallets = async (
  ignoredTypes: ConnectType[] = [],
  delayBetweenEach = 500
): Promise<XplaWallet[]> => {
  const networks = await getChainOptions();

  const controllerOptions: WalletControllerOptions = { ...networks };

  const controller = new WalletController(controllerOptions);

  // filter out ignored types and map to XplaWallet object
  const toXplaWallet = (
    objs: Connection[] | Installation[],
    installed: boolean
  ) => {
    return objs
      .map((obj) => ({ ...obj, installed }))
      .filter(
        (walletInfo: XplaWalletInfo) => !ignoredTypes.includes(walletInfo.type)
      )
      .map(
        (walletInfo: XplaWalletInfo) =>
          new XplaWallet({
            controller,
            walletInfo,
          })
      );
  };

  // since the observables provided by the controller do not complete, we use a timeout
  // utility operator to wait until there's a certain delay between each emission
  // then we take the last value (tracked through a variable in the scope, since the lastValue from the timeout
  // `with` setting was always yielding undefined) and map it to the XplaWallet arrat
  const waitObservable = <T extends Connection[] | Installation[]>(
    observable: Observable<T>,
    isInstalled: boolean
  ): Promise<XplaWallet[]> => {
    return new Promise((resolve) => {
      let value: XplaWallet[] = [];
      observable
        .pipe(
          timeout({
            each: delayBetweenEach,
          }),
          map((arr) => {
            return toXplaWallet(arr, isInstalled);
          })
        )
        .subscribe({
          next: (val) => {
            value = val;
          },
          error: () => {
            resolve(value);
          },
          complete: () => resolve(value),
        });
    });
  };

  const connections = await waitObservable(
    controller.availableConnections(),
    true
  );
  const installations = await waitObservable(
    controller.availableInstallations(),
    false
  );

  return connections.concat(installations);
};

export interface XplaWalletConfig {
  controller: WalletController;
  walletInfo: XplaWalletInfo;
}

type UnsignedXplaMessage = Uint8Array | Buffer;

const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const waitFor = (fn: () => boolean) => {
  return new Promise((resolve, reject) => {
    const loop = async () => {
      while (!fn()) {
        await sleep(500);
      }
    };

    loop().then(resolve).catch(reject);
  });
};

export class XplaWallet extends Wallet<
  typeof CHAIN_ID_XPLA,
  void,
  CreateTxOptions,
  CreateTxOptions,
  CreateTxOptions,
  TxResult,
  CreateTxOptions,
  TxResult,
  UnsignedXplaMessage,
  SignBytesResult,
  NetworkInfo
> {
  private readonly controller: WalletController;
  private readonly walletInfo: XplaWalletInfo;
  private state: WalletStates;
  private stateSubscription?: Subscription;

  constructor({ controller, walletInfo }: XplaWalletConfig) {
    super();
    this.controller = controller;
    this.walletInfo = walletInfo;
    this.state = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: this.controller.options.defaultNetwork,
    };
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

  disconnect(): Promise<void> {
    this.controller.disconnect();
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = undefined;
    this.state = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: this.controller.options.defaultNetwork,
    };

    return Promise.resolve();
  }

  getChainId() {
    return CHAIN_ID_XPLA;
  }

  signTransaction(tx: CreateTxOptions): Promise<CreateTxOptions> {
    if (!this.isConnected()) throw new Error("Not Connected");
    return Promise.resolve(tx);
  }

  async sendTransaction(
    tx: CreateTxOptions
  ): Promise<SendTransactionResult<TxResult>> {
    if (!this.isConnected()) throw new Error("Not Connected");
    const result = await this.controller.post(tx);

    if (!result.success) {
      throw new Error(`Transaction ${result.result.txhash} failed`);
    }

    return {
      id: result.result.txhash,
      data: result,
    };
  }

  signAndSendTransaction(
    tx: CreateTxOptions
  ): Promise<SendTransactionResult<TxResult>> {
    return this.sendTransaction(tx);
  }

  signMessage(msg: UnsignedXplaMessage): Promise<SignBytesResult> {
    if (!this.isConnected()) throw new Error("Not Connected");

    const toSign = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
    return this.controller.signBytes(toSign);
  }

  getName(): string {
    return this.walletInfo.name;
  }

  getUrl(): string {
    return this.walletInfo.url || "https://xpla.io";
  }

  getAddress(): string | undefined {
    if (!this.isConnected()) return undefined;
    return this.getAddresses()[0];
  }

  getAddresses(): string[] {
    return this.state.status === WalletStatus.WALLET_CONNECTED
      ? this.state.wallets.map((w) => w.xplaAddress)
      : [];
  }

  setMainAddress(): void {
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
    return this.walletInfo.installed
      ? WalletState.Installed
      : WalletState.NotDetected;
  }
}
