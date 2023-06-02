import {
  BaseWalletAdapter,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
} from "@manahippo/aptos-wallet-adapter";
import {
  CHAIN_ID_APTOS,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";
import { AptosClient, Types } from "aptos";

export type AptosAdapter = BaseWalletAdapter;
export interface AptosClientConfig {
  nodeUrl: string;
  openApiConfig: any;
}
export interface AptosSubmitResult {
  hash: Types.HexEncodedBytes;
}

export type SignedAptosTransaction = Uint8Array;
export type AptosMessage = string | SignMessagePayload | Uint8Array;
export type SignedAptosMessage = string | SignMessageResponse;

const ICON_OVERRIDES: Partial<Record<string, string>> = {
  Nightly:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAxIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMSAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wLjM5MDYyNSAxMDBDMC4zOTA2MjUgNDQuNzcxNSA0NS4xNjIyIDAgMTAwLjM5MSAwQzE1NS42MTkgMCAyMDAuMzkxIDQ0Ljc3MTUgMjAwLjM5MSAxMDBDMjAwLjM5MSAxNTUuMjI4IDE1NS42MTkgMjAwIDEwMC4zOTEgMjAwQzQ1LjE2MjIgMjAwIDAuMzkwNjI1IDE1NS4yMjggMC4zOTA2MjUgMTAwWiIgZmlsbD0iIzYwNjdGOSIvPgo8cGF0aCBkPSJNMTQ2LjgzOCA0MEMxMzguMDU0IDUyLjI2MDcgMTI3LjA2MSA2MC43NjM0IDExNC4wNzIgNjYuNDQ3NEMxMDkuNTYzIDY1LjIwMjYgMTA0LjkzNiA2NC41Njg0IDEwMC4zNzkgNjQuNjE1NEM5NS44MjIzIDY0LjU2ODQgOTEuMTk1MSA2NS4yMjYxIDg2LjY4NTUgNjYuNDQ3NEM3My42OTY2IDYwLjczOTkgNjIuNzA0MiA1Mi4yODQyIDUzLjkxOTggNDBDNTEuMjY1NiA0Ni42NzA2IDQxLjA0ODMgNjkuNjg4OCA1My4zMDkxIDEwMS44NjdDNTMuMzA5MSAxMDEuODY3IDQ5LjM4NjYgMTE4LjY2MSA1Ni41OTc0IDEzMy4wODNDNTYuNTk3NCAxMzMuMDgzIDY3LjAyNiAxMjguMzYyIDc1LjMxNzMgMTM1LjAwOUM4My45ODQzIDE0Mi4wMzIgODEuMjEyOCAxNDguNzk2IDg3LjMxOTYgMTU0LjYyMUM5Mi41ODA5IDE2MCAxMDAuNDAyIDE2MCAxMDAuNDAyIDE2MEMxMDAuNDAyIDE2MCAxMDguMjI0IDE2MCAxMTMuNDg1IDE1NC42NDVDMTE5LjU5MiAxNDguODQzIDExNi44NDQgMTQyLjA3OSAxMjUuNDg4IDEzNS4wMzJDMTMzLjc1NSAxMjguMzg1IDE0NC4yMDcgMTMzLjEwNiAxNDQuMjA3IDEzMy4xMDZDMTUxLjM5NSAxMTguNjg1IDE0Ny40OTYgMTAxLjg5MSAxNDcuNDk2IDEwMS44OTFDMTU5LjcxIDY5LjY4ODggMTQ5LjUxNiA0Ni42NzA2IDE0Ni44MzggNDBaTTU5LjgzODcgOTcuNDI4MUM1My4xNjgxIDgzLjczNDYgNTEuMzM2MSA2NC45NDQyIDU1LjU0MDQgNTAuMDk5OEM2MS4xMDcxIDY0LjE5MjYgNjguNjcwMiA3MC41MTA5IDc3LjY2NjEgNzcuMTgxNEM3My44NjEgODUuMDk2OSA2Ni42OTcyIDkyLjU2NjEgNTkuODM4NyA5Ny40MjgxWk03OS4wMjg0IDEyMS41NUM3My43NjcxIDExOS4yMjUgNzIuNjYzMSAxMTQuNjQ1IDcyLjY2MzEgMTE0LjY0NUM3OS44MjcgMTEwLjEzNSA5MC4zNzMxIDExMy41ODggOTAuNzAxOSAxMjQuMjUxQzg1LjE1ODcgMTIwLjg5MyA4My4zMDMyIDEyMy40MDYgNzkuMDI4NCAxMjEuNTVaTTEwMC4zNzkgMTU5LjQxM0M5Ni42MjA5IDE1OS40MTMgOTMuNTY3NCAxNTYuNzEyIDkzLjU2NzQgMTUzLjRDOTMuNTY3NCAxNTAuMDg4IDk2LjYyMDkgMTQ3LjM4NyAxMDAuMzc5IDE0Ny4zODdDMTA0LjEzNyAxNDcuMzg3IDEwNy4xOSAxNTAuMDg4IDEwNy4xOSAxNTMuNEMxMDcuMTkgMTU2LjczNSAxMDQuMTM3IDE1OS40MTMgMTAwLjM3OSAxNTkuNDEzWk0xMjEuNzUzIDEyMS41NUMxMTcuNDc4IDEyMy40MjkgMTE1LjY0NiAxMjAuODkzIDExMC4wNzkgMTI0LjI1MUMxMTAuNDMyIDExMy41ODggMTIwLjkzMSAxMTAuMTM1IDEyOC4xMTggMTE0LjY0NUMxMjguMTE4IDExNC42MjEgMTI2Ljk5MSAxMTkuMjI1IDEyMS43NTMgMTIxLjU1Wk0xNDAuOTE5IDk3LjQyODFDMTM0LjA4NCA5Mi41NjYxIDEyNi44OTcgODUuMTIwNCAxMjMuMDY4IDc3LjE4MTRDMTMyLjA2NCA3MC41MTA5IDEzOS42NTEgNjQuMTY5MSAxNDUuMTk0IDUwLjA5OThDMTQ5LjQ0NSA2NC45NDQyIDE0Ny42MTMgODMuNzU4MSAxNDAuOTE5IDk3LjQyODFaIiBmaWxsPSIjRjdGN0Y3Ii8+Cjwvc3ZnPgo=",
  Snap: "data:image/png;base64,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",
};

/**
 * An abstraction over Aptos blockchain wallets.
 * 
 * This class works as a wrapper over the adapters provided by the `@manahippo/aptos-wallet-adapter` library. In order to use this class, simply create the adapter you wish to use and pass it as a constructor parameter:
 * 
 * ```ts
 * const martian = new AptosWallet(
    new MartianWalletAdapter()
  )
 * ```
 */
export class AptosWallet extends Wallet<
  typeof CHAIN_ID_APTOS,
  void,
  Types.TransactionPayload,
  SignedAptosTransaction,
  SignedAptosTransaction,
  AptosSubmitResult,
  Types.TransactionPayload,
  AptosSubmitResult,
  AptosMessage,
  SignedAptosMessage,
  NetworkInfo
> {
  /**
   * @param adapter The Aptos wallet adapter which will serve as the underlying connection to the wallet
   */
  constructor(
    private readonly adapter: AptosAdapter,
    private readonly clientConfig?: AptosClientConfig
  ) {
    super();
  }

  /** Retrieve the underlying Aptos adapter */
  getAdapter(): AptosAdapter {
    return this.adapter;
  }

  getName(): string {
    return this.adapter.name;
  }

  getUrl(): string {
    return this.adapter.url;
  }

  async connect(): Promise<string[]> {
    await this.adapter.connect();
    return this.getAddresses();
  }

  getNetworkInfo() {
    return this.adapter.network;
  }

  isConnected(): boolean {
    return this.adapter.connected;
  }

  disconnect(): Promise<void> {
    return this.adapter.disconnect();
  }

  getChainId() {
    return CHAIN_ID_APTOS;
  }

  getAddress(): string | undefined {
    return this.adapter.publicAccount.address?.toString();
  }

  getAddresses(): string[] {
    const address = this.getAddress();
    return address ? [address] : [];
  }

  setMainAddress(): void {
    throw new NotSupported();
  }

  getBalance(): Promise<string> {
    throw new NotSupported();
  }

  signTransaction(
    tx: Types.TransactionPayload
  ): Promise<SignedAptosTransaction> {
    return this.adapter.signTransaction(tx);
  }

  async sendTransaction(
    tx: SignedAptosTransaction
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    if (!this.clientConfig) throw new Error("No aptos client config provided");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const client = new AptosClient(
      this.clientConfig.nodeUrl,
      this.clientConfig.openApiConfig
    );
    const result = await client.submitTransaction(tx);

    return {
      id: result.hash,
      data: { hash: result.hash },
    };
  }

  async signAndSendTransaction(
    tx: Types.TransactionPayload
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    const result = await this.adapter.signAndSubmitTransaction(tx);

    return {
      id: result.hash,
      data: result,
    };
  }

  signMessage(msg: AptosMessage): Promise<SignedAptosMessage> {
    return this.adapter.signMessage(msg);
  }

  getIcon(): string {
    const icon = ICON_OVERRIDES[this.adapter.name];
    return icon || this.adapter.icon;
  }

  getWalletState(): WalletState {
    const state = this.adapter.readyState;
    if (!(state in WalletState)) {
      throw new Error(`Unknown wallet state ${state}`);
    }
    return WalletState[state];
  }
}
