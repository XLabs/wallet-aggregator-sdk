import { AlgorandWallet } from "./algorand";
import Transport from "@ledgerhq/hw-transport";
import WebUSBTransport from "@ledgerhq/hw-transport-webusb";
import WebHIDTransport from "@ledgerhq/hw-transport-webhid";
import WebBLETransport from "@ledgerhq/hw-transport-web-ble";
import Algorand from "@ledgerhq/hw-app-algorand";
import { NotSupported, WalletState } from "@xlabs-libs/wallet-aggregator-core";
import algosdk from "algosdk";
import {
  AlgorandWalletParams,
  SignerTransaction,
  SignTransactionResult,
} from "./types";

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

const TRANSPORT_BUILDERS: { [k in TransportType]: () => Promise<Transport> } = {
  [TransportType.WebUSB]: () => WebUSBTransport.create(),
  [TransportType.WebHID]: () => WebHIDTransport.create(),
  [TransportType.Bluetooth]: () => WebBLETransport.create(),
};

export interface LedgerAccount {
  address: string;
  index: number;
}

export class AlgorandLedgerWallet extends AlgorandWallet {
  private readonly path: string;
  private app?: Algorand;

  constructor({
    path = DEFAULT_PATH,
    ...params
  }: AlgorandLedgerWalletParams = {}) {
    super(params);
    this.path = path;
  }

  protected async innerConnect(): Promise<string[]> {
    const transport = await this.getTransport();
    if (!transport) throw new Error("No transport available");

    this.app = new Algorand(transport);
    const account = await this.app.getAddress(this.path);
    return [account.address];
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

    if (!transport)
      throw new Error("Failed to connect to available transports");

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
    return !!(
      navigator &&
      navigator.usb &&
      typeof navigator.usb.getDevices === "function"
    );
  }
  private isBluetoothSupported(): boolean {
    return !!(navigator && navigator.bluetooth);
  }

  protected async innerDisconnect(): Promise<void> {
    await this.app?.transport.close();
    this.app = undefined;
  }

  async signTransaction(
    tx: SignerTransaction | SignerTransaction[]
  ): Promise<SignTransactionResult> {
    if (!this.app || !this.account) throw new Error("Not connected");

    const txs = Array.isArray(tx) ? tx : [tx];

    const signed = [];
    for (const t of txs) {
      // ARC-0001 states that if signers array is empty, the tx should not be signed
      if (t.signers && t.signers.length === 0) {
        // if stxn is present use that as the signature
        signed.push(t.stxn ? t.stxn : null);
        continue;
      }

      const bytes = Buffer.from(t.txn, "base64");
      const { signature } = await this.app.sign(
        this.path,
        bytes.toString("hex")
      );
      if (!signature)
        throw new Error("Failed to sign transaction, received empty signature");

      const decodedTx = algosdk.decodeUnsignedTransaction(bytes);
      const signedTx: algosdk.EncodedSignedTransaction = {
        txn: decodedTx.get_obj_for_encoding(),
        sig: signature,
      };

      if (algosdk.encodeAddress(decodedTx.from.publicKey) !== this.account) {
        signedTx.sgnr = Buffer.from(
          algosdk.decodeAddress(this.account).publicKey
        );
      }

      signed.push(Buffer.from(algosdk.encodeObj(signedTx)).toString("base64"));
    }

    return signed;
  }

  signMessage(): Promise<Uint8Array> {
    throw new NotSupported();
  }

  getName(): string {
    return "Ledger";
  }

  getUrl(): string {
    return "https://www.ledger.com/";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSItMy40NSAtMy40MDIgMTUzLjkgMTM0LjgwNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpieD0iaHR0cHM6Ly9ib3h5LXN2Zy5jb20iPgogIDxyZWN0IHN0eWxlPSJmaWxsOiByZ2IoMCwgMCwgMCk7IiB3aWR0aD0iMTUzLjkiIGhlaWdodD0iMTM0LjgwNSIgcng9IjUiIHJ5PSI1IiB4PSItMy40NSIgeT0iLTMuNDAyIi8+CiAgPHBhdGggZD0iTSAwLjAxOSA5MS42NTUgTCAwLjAxOSAxMjggTCA1NS4zMTIgMTI4IEwgNTUuMzEyIDExOS45NCBMIDguMDc1IDExOS45NCBMIDguMDc1IDkxLjY1NSBMIDAuMDE5IDkxLjY1NSBaIE0gMTM4Ljk2MiA5MS42NTUgTCAxMzguOTYyIDExOS45NCBMIDkxLjcyNiAxMTkuOTQgTCA5MS43MjYgMTI3Ljk5OCBMIDE0Ny4wMTkgMTI3Ljk5OCBMIDE0Ny4wMTkgOTEuNjU1IEwgMTM4Ljk2MiA5MS42NTUgWiBNIDU1LjM5MSAzNi4zNDUgTCA1NS4zOTEgOTEuNjUzIEwgOTEuNzI2IDkxLjY1MyBMIDkxLjcyNiA4NC4zODQgTCA2My40NDggODQuMzg0IEwgNjMuNDQ4IDM2LjM0NSBMIDU1LjM5MSAzNi4zNDUgWiBNIDAuMDE5IDAgTCAwLjAxOSAzNi4zNDUgTCA4LjA3NSAzNi4zNDUgTCA4LjA3NSA4LjA1OCBMIDU1LjMxMiA4LjA1OCBMIDU1LjMxMiAwIEwgMC4wMTkgMCBaIE0gOTEuNzI2IDAgTCA5MS43MjYgOC4wNTggTCAxMzguOTYyIDguMDU4IEwgMTM4Ljk2MiAzNi4zNDUgTCAxNDcuMDE5IDM2LjM0NSBMIDE0Ny4wMTkgMCBMIDkxLjcyNiAwIFoiIHN0eWxlPSJmaWxsOiByZ2IoMjU1LCAyNTUsIDI1NSk7IiBieDpvcmlnaW49IjAuNjEwMjA0IDAuNSIvPgo8L3N2Zz4=";
  }

  getWalletState(): WalletState {
    return this.getAvailableTransportTypes().length > 0
      ? WalletState.Loadable
      : WalletState.Unsupported;
  }
}
