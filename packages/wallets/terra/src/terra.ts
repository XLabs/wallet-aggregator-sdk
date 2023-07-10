import { ExtensionOptions } from "@terra-money/terra.js";
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
} from "@terra-money/wallet-provider";
import {
  ChainId,
  CHAIN_ID_TERRA,
  CHAIN_ID_TERRA2,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
  BaseFeatures,
} from "@xlabs-libs/wallet-aggregator-core";
import { Observable, Subscription } from "rxjs";
import { map, timeout } from "rxjs/operators";

interface TerraWalletInfo {
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
): Promise<TerraWallet[]> => {
  const networks = await getChainOptions();

  const controllerOptions: WalletControllerOptions = { ...networks };

  const controller = new WalletController(controllerOptions);

  // filter out ignored types and map to TerraWallet object
  const toTerraWallet = (
    objs: Connection[] | Installation[],
    installed: boolean
  ) => {
    return objs
      .map((obj) => ({ ...obj, installed }))
      .filter(
        (walletInfo: TerraWalletInfo) => !ignoredTypes.includes(walletInfo.type)
      )
      .map(
        (walletInfo: TerraWalletInfo) =>
          new TerraWallet({
            controller,
            walletInfo,
          })
      );
  };

  // since the observables provided by the controller do not complete, we use a timeout
  // utility operator to wait until there's a certain delay between each emission
  // then we take the last value (tracked through a variable in the scope, since the lastValue from the timeout
  // `with` setting was always yielding undefined) and map it to the TerraWallet arrat
  const waitObservable = <T extends Connection[] | Installation[]>(
    observable: Observable<T>,
    isInstalled: boolean
  ): Promise<TerraWallet[]> => {
    return new Promise((resolve) => {
      let value: TerraWallet[] = [];
      observable
        .pipe(
          timeout({
            each: delayBetweenEach,
          }),
          map((arr) => {
            return toTerraWallet(arr, isInstalled);
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

export interface TerraWalletConfig {
  controller: WalletController;
  walletInfo: TerraWalletInfo;
}

type UnsignedTerraMessage = Uint8Array | Buffer;

const TERRA_CHAINS = ["columbus-5", "bombay-12"];
const TERRA2_CHAINS = ["phoenix-1", "pisco-1"];

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

export class TerraWallet extends Wallet<
  ChainId,
  void,
  ExtensionOptions,
  ExtensionOptions,
  ExtensionOptions,
  TxResult,
  ExtensionOptions,
  TxResult,
  UnsignedTerraMessage,
  SignBytesResult,
  NetworkInfo
> {
  private readonly controller: WalletController;
  private readonly walletInfo: TerraWalletInfo;
  private state: WalletStates;
  private stateSubscription?: Subscription;

  constructor({ controller, walletInfo }: TerraWalletConfig) {
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

  getChainId(): ChainId {
    const chainId = this.state.network.chainID;

    if (TERRA_CHAINS.includes(chainId)) return CHAIN_ID_TERRA;
    else if (TERRA2_CHAINS.includes(chainId)) return CHAIN_ID_TERRA2;
    else throw new Error(`Unknown terra chain ${chainId}`);
  }

  signTransaction(tx: ExtensionOptions): Promise<ExtensionOptions> {
    if (!this.isConnected()) throw new Error("Not Connected");
    return Promise.resolve(tx);
  }

  async sendTransaction(
    tx: ExtensionOptions
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
    tx: ExtensionOptions
  ): Promise<SendTransactionResult<TxResult>> {
    return this.sendTransaction(tx);
  }

  signMessage(msg: UnsignedTerraMessage): Promise<SignBytesResult> {
    if (!this.isConnected()) throw new Error("Not Connected");

    const toSign = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
    return this.controller.signBytes(toSign);
  }

  getName(): string {
    return this.walletInfo.name;
  }

  getUrl(): string {
    return this.walletInfo.url || "https://terra.money";
  }

  getAddress(): string | undefined {
    if (!this.isConnected()) return undefined;
    return this.getAddresses()[0];
  }

  getAddresses(): string[] {
    return this.state.status === WalletStatus.WALLET_CONNECTED
      ? this.state.wallets.map((w) => w.terraAddress)
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

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }
}
