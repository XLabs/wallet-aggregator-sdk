import { AlgorandWallet, AlgorandWalletParams, EncodedSignedTransaction, UnsignedTransaction } from "./algorand";
import Transport from "@ledgerhq/hw-transport";
import WebUSBTransport from "@ledgerhq/hw-transport-webusb";
import WebHIDTransport from "@ledgerhq/hw-transport-webhid";
import WebBLETransport from "@ledgerhq/hw-transport-web-ble";
import Algorand from "@ledgerhq/hw-app-algorand";
import { NotSupported, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from "algosdk";

export enum TransportType {
  WebUSB = "WebUSB",
  WebHID = "WebHID",
  Bluetooth = "Bluetooth",
}

interface AlgorandLedgerWalletParams extends AlgorandWalletParams {
  /** Account derivation path. Defaults to zero account and index */
  path?: string;
}

const DEFAULT_PATH = "44'/283'/0'/0/0";

const TRANSPORT_BUILDERS: { [ k in TransportType ]: () => Promise<Transport> } = {
  [TransportType.WebUSB]: () => WebUSBTransport.create(),
  [TransportType.WebHID]: () => WebHIDTransport.create(),
  [TransportType.Bluetooth]: () => WebBLETransport.create(),
}

export interface LedgerAccount {
  address: string;
  index: number;
}

export class AlgorandLedgerWallet extends AlgorandWallet {
  private readonly path: string;
  private app?: Algorand;

  constructor({ path = DEFAULT_PATH, ...params }: AlgorandLedgerWalletParams = {}) {
    super(params);
    this.path = path;
  }

  protected async innerConnect(): Promise<string[]> {
    const transport = await this.getTransport();
    if (!transport) throw new Error("No transport available");

    this.app = new Algorand(transport);
    const account = await this.app.getAddress(this.path);
    return [ account.address ];
  }

  /** Retrieve the first n accounts */
  async getAvailableAccounts(n: number): Promise<LedgerAccount[]> {
    if (!this.app) throw new Error("Not connected");
    if (n <= 0) return [];

    const accounts: LedgerAccount[] = [];
    for (let i = 0; i < n; i++) {
      const address = await this.app.getAddress(this.getBipPath(i));
      accounts.push({ address: address.address, index: i });
    }

    return accounts;
  }

  private getBipPath(index: number): string {
    if (index < 0 || index > 255) throw new Error("Invalid account index");
    return `44'/283'/${index}'/0/0`;
  }

  private async getTransport(): Promise<Transport | undefined> {
    const types = this.getAvailableTransportTypes();
    if (types.length === 0) return undefined;

    let transport;
    for (const type of types) {
      try {
        transport = await TRANSPORT_BUILDERS[type]();
        if (transport) break;
      } catch (e) {
        console.warn(`Failed to connect to transport ${type}`, e);
      }
    }

    if (!transport) throw new Error("Failed to connect to available transports");

    return transport;
  }

  private getAvailableTransportTypes(): TransportType[] {
    const types = [];
    if (this.isWebHIDSupported()) types.push(TransportType.WebHID);
    if (this.isWebUSBSupported()) types.push(TransportType.WebUSB);
    if (this.isBluetoothSupported()) types.push(TransportType.Bluetooth);
    return types;
  }

  private isWebHIDSupported(): boolean {
    return !!(window.navigator && window.navigator.hid);
  }
  private isWebUSBSupported(): boolean {
    return !!(navigator && navigator.usb && typeof navigator.usb.getDevices === "function");
  }
  private isBluetoothSupported(): boolean {
    return !!(navigator && navigator.bluetooth);
  }

  protected async innerDisconnect(): Promise<void> {
    this.app?.transport.close();
    this.app = undefined;
  }

  async signTransaction(tx: UnsignedTransaction): Promise<EncodedSignedTransaction>;
  async signTransaction(tx: UnsignedTransaction[]): Promise<EncodedSignedTransaction[]>;
  async signTransaction(tx: UnsignedTransaction | UnsignedTransaction[]): Promise<EncodedSignedTransaction | EncodedSignedTransaction[]> {
    if (!this.app) throw new Error("Not connected");

    const txs = Array.isArray(tx) ? tx : [ tx ];

    const signed = [];
    for (const t of txs) {
      const bytes = Buffer.from(t instanceof Uint8Array ? t : t.toByte());
      const { signature } = await this.app.sign(this.path, bytes.toString("hex"));
      if (!signature) throw new Error("Failed to sign transaction, received empty signature");

      const decodedTx = algosdk.decodeUnsignedTransaction(bytes);
      const signedTx: algosdk.EncodedSignedTransaction = {
        txn: decodedTx.get_obj_for_encoding(),
        sig: signature,
      }

      if (algosdk.encodeAddress(decodedTx.from.publicKey) !== this.account) {
        signedTx.sgnr = Buffer.from(algosdk.decodeAddress(this.account!).publicKey);
      }

      signed.push(algosdk.encodeObj(signedTx));
    }

    return Array.isArray(tx) ? signed : signed[0];
  }

  signMessage(msg: Uint8Array): Promise<Uint8Array> {
    throw new NotSupported();
  }

  getName(): string {
    return 'Ledger';
  }

  getUrl(): string {
    return 'https://www.ledger.com/';
  }

  getIcon(): string {
    return 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA3NjguOTEgNjY5LjM1IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA3NjguOTEgNjY5LjM1OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik0wLDQ3OS4yOXYxOTAuMDZoMjg5LjIyVjYyNy4ySDQyLjE0VjQ3OS4yOUgweiBNNzI2Ljc3LDQ3OS4yOVY2MjcuMkg0NzkuNjl2NDIuMTRoMjg5LjIyVjQ3OS4yOUg3MjYuNzd6IE0yODkuNjQsMTkwLjA2Cgl2Mjg5LjIyaDE5MC4wNXYtMzguMDFIMzMxLjc4VjE5MC4wNkgyODkuNjR6IE0wLDB2MTkwLjA2aDQyLjE0VjQyLjE0aDI0Ny4wOFYwSDB6IE00NzkuNjksMHY0Mi4xNGgyNDcuMDh2MTQ3LjkyaDQyLjE0VjBINDc5LjY5eiIKCS8+Cjwvc3ZnPgo=';
  }

  getWalletState(): WalletState {
    return this.getAvailableTransportTypes().length > 0 ? WalletState.Loadable : WalletState.Unsupported;
  }
}