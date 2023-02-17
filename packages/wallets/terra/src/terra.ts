import { ExtensionOptions } from "@terra-money/terra.js";
import { Connection, ConnectType, Installation, NetworkInfo, SignBytesResult, TxResult, WalletController, WalletControllerOptions, WalletStates, WalletStatus } from "@terra-money/wallet-provider";
import { ChainId, CHAIN_ID_TERRA, CHAIN_ID_TERRA2, NotSupported, SendTransactionResult, Wallet, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';


export enum Network {
  Mainnet,
  Testnet,
  Classic
}

const mainnet: NetworkInfo = {
  name: "mainnet",
  chainID: "phoenix-1",
  lcd: "https://phoenix-lcd.terra.dev",
  walletconnectID: 1,
};

const classic: NetworkInfo = {
  name: "classic",
  chainID: "columbus-5",
  lcd: "https://columbus-lcd.terra.dev",
  walletconnectID: 2,
}

const testnet: NetworkInfo = {
  name: "testnet",
  chainID: "pisco-1",
  lcd: "https://pisco-lcd.terra.dev",
  walletconnectID: 0,
};

const walletConnectChainIds: Record<number, NetworkInfo> = {
  0: testnet,
  1: mainnet,
  2: classic,
};

const getNetworkInfo = (network: Network): NetworkInfo => {
  switch (network) {
    case Network.Mainnet:
      return mainnet;
    case Network.Testnet:
      return testnet;
    case Network.Classic:
      return classic;
    default:
      throw new Error('Unknown network');
  }
}

interface TerraWalletInfo {
  type: ConnectType;
  name: string;
  icon: string;
  installed: boolean;
  identifier?: string;
  url?: string;
}

export const getWallets = async (network: Network, ignoredTypes: ConnectType[] = []): Promise<TerraWallet[]> => {
  const controllerOptions: WalletControllerOptions = {
    defaultNetwork: getNetworkInfo(network),
    walletConnectChainIds
  };

  const controller = new WalletController(controllerOptions);

  const toTerraWallet = (objs: Connection[] | Installation[], installed: boolean) => {
    return objs
      .map(obj => ({ ...obj, installed }))
      .filter((walletInfo: TerraWalletInfo) => !ignoredTypes.includes(walletInfo.type))
      .map((walletInfo: TerraWalletInfo) => new TerraWallet({
        controllerOptions,
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
      }, 500)
    });
  };

  // available to connect
  const connections: TerraWallet[] = await waitObservable(controller.availableConnections().pipe(
    map(arr => toTerraWallet(arr, true))
  )) || [];

  // installable
  const installations: TerraWallet[] = await waitObservable(controller.availableInstallations().pipe(
    map(arr => toTerraWallet(arr, false))
  )) || [];

  return connections.concat(installations);
}

export interface TerraWalletConfig {
  controllerOptions: WalletControllerOptions;
  walletInfo: TerraWalletInfo;
}

type UnsignedTerraMessage = Uint8Array | Buffer;

const TERRA_CHAINS = ['columbus-5', 'bombay-12'];
const TERRA2_CHAINS = ['phoenix-1', 'pisco-1'];

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

export class TerraWallet extends Wallet<
  ExtensionOptions,
  ExtensionOptions,
  TxResult,
  NetworkInfo,
  UnsignedTerraMessage,
  SignBytesResult
> {
  private readonly controller: WalletController;
  private readonly walletInfo: TerraWalletInfo;
  private state: WalletStates;
  private stateSubscription?: Subscription;

  constructor({ controllerOptions, walletInfo }: TerraWalletConfig) {
    super();
    this.controller = new WalletController(controllerOptions);
    this.walletInfo = walletInfo;
    this.state = {
      status: WalletStatus.WALLET_NOT_CONNECTED,
      network: controllerOptions.defaultNetwork
    }
    this.stateSubscription = this.controller.states().subscribe((state) => {
      this.state = state;
    });
  }

  async connect(): Promise<string[]> {
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
  }

  getChainId(): ChainId {
    const chainId = this.state.network.chainID;

    if (TERRA_CHAINS.includes(chainId)) return CHAIN_ID_TERRA;
    else if (TERRA2_CHAINS.includes(chainId)) return CHAIN_ID_TERRA2;
    else throw new Error(`Unknown terra chain ${chainId}`)
  }

  async signTransaction(tx: ExtensionOptions): Promise<ExtensionOptions> {
    if (!this.isConnected()) throw new Error('Not Connected');
    return tx;
  }

  async sendTransaction(tx: ExtensionOptions): Promise<SendTransactionResult<TxResult>> {
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

  signMessage(msg: UnsignedTerraMessage): Promise<SignBytesResult> {
    if (!this.isConnected()) throw new Error('Not Connected');

    const toSign = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
    return this.controller.signBytes(toSign);
  }

  getName(): string {
    return this.walletInfo.name;
  }

  getUrl(): string {
    return this.walletInfo.url || 'https://terra.money';
  }

  getAddress(): string | undefined {
    if (!this.isConnected()) return undefined;
    return this.getAddresses()[0];
  }

  getAddresses(): string[] {
    return this.state.status === WalletStatus.WALLET_CONNECTED
      ? this.state.wallets.map(w => w.terraAddress)
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
