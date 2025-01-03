import { AccountAuthenticator, Network } from "@aptos-labs/ts-sdk";

import {
  WalletName,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletCore,
  AnyAptosWallet,
  AnyRawTransaction,
  InputTransactionData,
  Wallet as IAptosWallet,
  DappConfig,
} from "@aptos-labs/wallet-adapter-core";

import { BitgetWallet } from "@bitget-wallet/aptos-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { FewchaWallet } from "fewcha-plugin-wallet-adapter";
import { PetraWallet } from "petra-plugin-wallet-adapter";
// FIXME: These wallets are not working
// import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
// import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
// import { TrustWallet } from "@trustwallet/aptos-wallet-adapter";

import {
  BaseFeatures,
  CHAIN_ID_APTOS,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";

import type { Types as AptosLegacyTypes } from "aptos";

export interface AptosSubmitResult {
  hash: AptosLegacyTypes.HexEncodedBytes;
}

export type AptosMessage = string | SignMessagePayload | Uint8Array;
export type SignedAptosMessage = string | SignMessageResponse;

type AdapterIcon = {
  icon: AnyAptosWallet["icon"];
  name?: WalletName;
};

const NIGHTLY_WALLET: AdapterIcon = {
  icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAxIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMSAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wLjM5MDYyNSAxMDBDMC4zOTA2MjUgNDQuNzcxNSA0NS4xNjIyIDAgMTAwLjM5MSAwQzE1NS42MTkgMCAyMDAuMzkxIDQ0Ljc3MTUgMjAwLjM5MSAxMDBDMjAwLjM5MSAxNTUuMjI4IDE1NS42MTkgMjAwIDEwMC4zOTEgMjAwQzQ1LjE2MjIgMjAwIDAuMzkwNjI1IDE1NS4yMjggMC4zOTA2MjUgMTAwWiIgZmlsbD0iIzYwNjdGOSIvPgo8cGF0aCBkPSJNMTQ2LjgzOCA0MEMxMzguMDU0IDUyLjI2MDcgMTI3LjA2MSA2MC43NjM0IDExNC4wNzIgNjYuNDQ3NEMxMDkuNTYzIDY1LjIwMjYgMTA0LjkzNiA2NC41Njg0IDEwMC4zNzkgNjQuNjE1NEM5NS44MjIzIDY0LjU2ODQgOTEuMTk1MSA2NS4yMjYxIDg2LjY4NTUgNjYuNDQ3NEM3My42OTY2IDYwLjczOTkgNjIuNzA0MiA1Mi4yODQyIDUzLjkxOTggNDBDNTEuMjY1NiA0Ni42NzA2IDQxLjA0ODMgNjkuNjg4OCA1My4zMDkxIDEwMS44NjdDNTMuMzA5MSAxMDEuODY3IDQ5LjM4NjYgMTE4LjY2MSA1Ni41OTc0IDEzMy4wODNDNTYuNTk3NCAxMzMuMDgzIDY3LjAyNiAxMjguMzYyIDc1LjMxNzMgMTM1LjAwOUM4My45ODQzIDE0Mi4wMzIgODEuMjEyOCAxNDguNzk2IDg3LjMxOTYgMTU0LjYyMUM5Mi41ODA5IDE2MCAxMDAuNDAyIDE2MCAxMDAuNDAyIDE2MEMxMDAuNDAyIDE2MCAxMDguMjI0IDE2MCAxMTMuNDg1IDE1NC42NDVDMTE5LjU5MiAxNDguODQzIDExNi44NDQgMTQyLjA3OSAxMjUuNDg4IDEzNS4wMzJDMTMzLjc1NSAxMjguMzg1IDE0NC4yMDcgMTMzLjEwNiAxNDQuMjA3IDEzMy4xMDZDMTUxLjM5NSAxMTguNjg1IDE0Ny40OTYgMTAxLjg5MSAxNDcuNDk2IDEwMS44OTFDMTU5LjcxIDY5LjY4ODggMTQ5LjUxNiA0Ni42NzA2IDE0Ni44MzggNDBaTTU5LjgzODcgOTcuNDI4MUM1My4xNjgxIDgzLjczNDYgNTEuMzM2MSA2NC45NDQyIDU1LjU0MDQgNTAuMDk5OEM2MS4xMDcxIDY0LjE5MjYgNjguNjcwMiA3MC41MTA5IDc3LjY2NjEgNzcuMTgxNEM3My44NjEgODUuMDk2OSA2Ni42OTcyIDkyLjU2NjEgNTkuODM4NyA5Ny40MjgxWk03OS4wMjg0IDEyMS41NUM3My43NjcxIDExOS4yMjUgNzIuNjYzMSAxMTQuNjQ1IDcyLjY2MzEgMTE0LjY0NUM3OS44MjcgMTEwLjEzNSA5MC4zNzMxIDExMy41ODggOTAuNzAxOSAxMjQuMjUxQzg1LjE1ODcgMTIwLjg5MyA4My4zMDMyIDEyMy40MDYgNzkuMDI4NCAxMjEuNTVaTTEwMC4zNzkgMTU5LjQxM0M5Ni42MjA5IDE1OS40MTMgOTMuNTY3NCAxNTYuNzEyIDkzLjU2NzQgMTUzLjRDOTMuNTY3NCAxNTAuMDg4IDk2LjYyMDkgMTQ3LjM4NyAxMDAuMzc5IDE0Ny4zODdDMTA0LjEzNyAxNDcuMzg3IDEwNy4xOSAxNTAuMDg4IDEwNy4xOSAxNTMuNEMxMDcuMTkgMTU2LjczNSAxMDQuMTM3IDE1OS40MTMgMTAwLjM3OSAxNTkuNDEzWk0xMjEuNzUzIDEyMS41NUMxMTcuNDc4IDEyMy40MjkgMTE1LjY0NiAxMjAuODkzIDExMC4wNzkgMTI0LjI1MUMxMTAuNDMyIDExMy41ODggMTIwLjkzMSAxMTAuMTM1IDEyOC4xMTggMTE0LjY0NUMxMjguMTE4IDExNC42MjEgMTI2Ljk5MSAxMTkuMjI1IDEyMS43NTMgMTIxLjU1Wk0xNDAuOTE5IDk3LjQyODFDMTM0LjA4NCA5Mi41NjYxIDEyNi44OTcgODUuMTIwNCAxMjMuMDY4IDc3LjE4MTRDMTMyLjA2NCA3MC41MTA5IDEzOS42NTEgNjQuMTY5MSAxNDUuMTk0IDUwLjA5OThDMTQ5LjQ0NSA2NC45NDQyIDE0Ny42MTMgODMuNzU4MSAxNDAuOTE5IDk3LjQyODFaIiBmaWxsPSIjRjdGN0Y3Ii8+Cjwvc3ZnPgo=",
};

const SNAP_WALLET: AdapterIcon = {
  icon: "data:image/png;base64,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",
};

const BITGET_WALLET: AdapterIcon = {
  icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8yMDM1XzExMDYpIj4KPHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IiM1NEZGRjUiLz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZl8yMDM1XzExMDYpIj4KPHBhdGggZD0iTTEzLjQ4MDYgMTk4LjYwNUMtMjkuMzI3NiAzMTkuMDQzIDE5OS42NjEgMjg1LjAyNyAzMTkuNTA3IDI1Mi45NjRDNDQyLjE2NSAyMTIuMjU5IDM1Ny4zODYgMzIuODI2OSAyNjkuNDE1IDI4Ljg1NThDMTgxLjQ0MyAyNC44ODQ3IDI4MC4zMjIgMTExLjgyNCAyMDUuNTk1IDEzNi42NTZDMTMwLjg2OCAxNjEuNDg3IDY2Ljk5MDcgNDguMDU4MyAxMy40ODA2IDE5OC42MDVaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIxX2ZfMjAzNV8xMTA2KSI+CjxwYXRoIGQ9Ik04NS41MTE4IC00NS44MjI1QzYzLjA1NjIgLTEwNy4xNzYgLTE2LjkxODkgLTIzLjk5NTMgLTU0LjA5OTUgMjUuMjY0M0MtODkuNTY1MiA3OC44NDc5IDMuMDA5MzcgMTI1LjE1MiAzOS4zMjA4IDEwMC4wMzdDNzUuNjMyMyA3NC45MjI3IDcuNzc0NDggNzAuMDM2MyAyOS4zNzA4IDM3LjM3ODVDNTAuOTY3MSA0LjcyMDc2IDExMy41ODEgMzAuODY5NSA4NS41MTE4IC00NS44MjI1WiIgZmlsbD0iIzAwRkZGMCIgZmlsbC1vcGFjaXR5PSIwLjY3Ii8+CjwvZz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjJfZl8yMDM1XzExMDYpIj4KPHBhdGggZD0iTTk2LjQ3OTYgMjI1LjQyNEM2NS44NTAyIDEyMi4zNjMgLTY2LjA4MTggMTc2LjYzNyAtMTI4LjIxOSAyMTYuNjU3Qy0xODcuOTkgMjY0LjA0MiAtNDYuMDcxMSA0MDAuMzQ4IDEyLjg3MjUgMzkzLjM3NkM3MS44MTYxIDM4Ni40MDMgLTM0LjQxMTggMzI3LjA2NSAxLjk4NzAyIDI5OC4xN0MzOC4zODU4IDI2OS4yNzYgMTM0Ljc2NiAzNTQuMjQ5IDk2LjQ3OTYgMjI1LjQyNFoiIGZpbGw9IiM5RDgxRkYiLz4KPC9nPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyM19mXzIwMzVfMTEwNikiPgo8cGF0aCBkPSJNMjgyLjEyIC0xMDcuMzUzQzIxNi4wNDcgLTE4Ni4wMzEgMTIxLjQ2MyAtMTIwLjk3IDgyLjQyOTYgLTc4LjYwNDdDNDguMjczOSAtMzAuNjQ0NiAyMjQuMjc1IDU3LjIzMTIgMjczLjEyMSA0Mi4xNzE0QzMyMS45NjggMjcuMTExNSAyMDYuNTEyIC00LjA1MDM4IDIyNy4yOTcgLTMzLjI4NzlDMjQ4LjA4MiAtNjIuNTI1NSAzNjQuNzEyIC05LjAwNTY2IDI4Mi4xMiAtMTA3LjM1M1oiIGZpbGw9IiM0RDk0RkYiLz4KPC9nPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTkzLjE4OSAxNTIuODM2SDEzNi42NzRMODcuMjA4NiAxMDMuMDUxTDEzNy4zMSA1My4yNjYzTDE1MC45NTUgNDBIMTA1LjgxOUw0OC4zMzU5IDk3Ljc3NzNDNDUuNDM0OSAxMDAuNjg5IDQ1LjQ0OTggMTA1LjQwMiA0OC4zNjU2IDEwOC4yOTlMOTMuMTg5IDE1Mi44MzZaTTExOS4zMyAxMDMuMTY4SDExOC45OTVMMTE5LjMyNiAxMDMuMTY0TDExOS4zMyAxMDMuMTY4Wk0xMTkuMzMgMTAzLjE2OEwxNjguNzkxIDE1Mi45NDlMMTE4LjY5IDIwMi43MzRMMTA1LjA0NSAyMTZIMTUwLjE4TDIwNy42NjQgMTU4LjIyNkMyMTAuNTY1IDE1NS4zMTQgMjEwLjU1IDE1MC42MDIgMjA3LjYzNCAxNDcuNzA1TDE2Mi44MTEgMTAzLjE2OEgxMTkuMzNaIiBmaWxsPSJibGFjayIvPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfMjAzNV8xMTA2IiB4PSItOTAuMjQxMSIgeT0iLTY5LjczNjkiIHdpZHRoPSI1NjkuNTU4IiBoZWlnaHQ9IjQ1MS40MzEiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNDkuMjMwOCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzIwMzVfMTEwNiIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMV9mXzIwMzVfMTEwNiIgeD0iLTE2MC41MTEiIHk9Ii0xNjUuOTg3IiB3aWR0aD0iMzUxLjU5NiIgaGVpZ2h0PSIzNzEuNTA3IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQ5LjIzMDgiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8yMDM1XzExMDYiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjJfZl8yMDM1XzExMDYiIHg9Ii0yNDEuMDc4IiB5PSI2Ny42NDIiIHdpZHRoPSI0NDQuODUxIiBoZWlnaHQ9IjQyNC40NTIiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCYWNrZ3JvdW5kSW1hZ2VGaXgiIHJlc3VsdD0ic2hhcGUiLz4KPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNDkuMjMwOCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzIwMzVfMTEwNiIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyM19mXzIwMzVfMTEwNiIgeD0iLTIwLjM5NjgiIHk9Ii0yNDIuNzU4IiB3aWR0aD0iNDMwLjE5MSIgaGVpZ2h0PSIzODUuMTA1IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjQ5LjIzMDgiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8yMDM1XzExMDYiLz4KPC9maWx0ZXI+CjxjbGlwUGF0aCBpZD0iY2xpcDBfMjAzNV8xMTA2Ij4KPHJlY3Qgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==",
  name: "Bitget Wallet" as WalletName<"Bitget Wallet">,
};

const OVERRIDES: Record<string, Partial<AnyAptosWallet>> = {
  nightly: NIGHTLY_WALLET,
  snap: SNAP_WALLET,
  bitkeep: BITGET_WALLET,
  bitget: BITGET_WALLET,
};

/**
 * Attempt to get an override for the given adapter.
 *
 * @param adapter Aptos adapter to get the override for or default to itself
 * @returns the current adapter or the override if it exists
 */
const getOverride = (adapter: AnyAptosWallet): Partial<AnyAptosWallet> =>
  OVERRIDES[adapter.name.toLocaleLowerCase()] || adapter;

/**
 * Looks for a property in the overrides and returns it if it exists, otherwise returns the property from the adapter.
 *
 * @param propertyName property name to look for
 * @param overrides overrides to inspect for the property
 * @param adapter adapter to default to if the property is not found in the overrides
 * @returns the property value from the overrides if it exists, otherwise the property value from the adapter
 */
const getPropertyByName = <T>(
  propertyName: keyof AnyAptosWallet,
  overrides: Partial<AnyAptosWallet>,
  adapter: AnyAptosWallet
): T => (overrides[propertyName] || adapter[propertyName]) as T;

/**
 * Looks for a property value if overrides exist return it otherwise defaults to adapter value.
 * @param propertyName property name to look for
 * @param adapter adapter to default to if the property is not found in the overrides
 * @returns the property value
 */
const getWalletOverride = <T>(
  propertyName: keyof AnyAptosWallet,
  adapter: AnyAptosWallet
): T => getPropertyByName<T>(propertyName, getOverride(adapter), adapter);

type SendTransactionInput = {
  transaction: AnyRawTransaction;
  senderAuthenticator: AccountAuthenticator;
};

export class AptosWallet extends Wallet<
  typeof CHAIN_ID_APTOS,
  void,
  AnyRawTransaction,
  AccountAuthenticator,
  SendTransactionInput,
  AptosSubmitResult,
  InputTransactionData,
  AptosSubmitResult,
  AptosMessage,
  SignedAptosMessage,
  NetworkInfo
> {
  private address: string | undefined;
  private network: NetworkInfo | undefined;
  /**
   * @param selectedAptosWallet The Aptos wallet adapter which will serve as the underlying connection to the wallet
   * @param walletCore WalletCore class obtained via walletCoreFactory static function
   */
  constructor(
    private readonly selectedAptosWallet: AnyAptosWallet,
    private readonly walletCore: WalletCore
  ) {
    super();
  }

  /**
   * @param config WalletCore configuration
   * @param withNonStandard Add nonstandard wallets to the wallet core, these includes the following wallets:
   * - BitgetWallet
   * - MartianWallet
   * - MSafeWalletAdapter
   * - OKXWallet
   * - PontemWallet
   * - TrustWallet
   * - FewchaWallet
   * - PetraWallet
   * @param newWalletsToAdd Add new wallets to the wallet core
   * @returns {WalletCore} WalletCore instance
   */
  static walletCoreFactory(
    config: DappConfig = { network: "mainnet" as Network },
    withNonStandard = true,
    newWalletsToAdd: IAptosWallet[] = []
  ): WalletCore {
    const nonStandardWallets: IAptosWallet[] = [
      // We are forcing PetraWallet to avoid the NotDetected issue
      new PetraWallet(),
      // ---------------------------------------------------------
      new BitgetWallet(),
      new MartianWallet(),
      new PontemWallet(),
      // FIXME: These wallets are not working!!
      new FewchaWallet() as IAptosWallet,
      // new OKXWallet(),
      // new MSafeWalletAdapter(),
      // new TrustWallet() as IAptosWallet,
    ];

    return new WalletCore(
      withNonStandard
        ? [...nonStandardWallets, ...newWalletsToAdd]
        : newWalletsToAdd,
      // FIXME: T Wallet is not working and is removed from available wallets.
      [
        "Nightly",
        "Continue with Google",
        "Continue with Apple" as any,
        "Mizu Wallet",
        "Pontem Wallet",
      ],
      config,
      true
    );
  }

  getName(): string {
    return getWalletOverride("name", this.selectedAptosWallet);
  }

  getUrl(): string {
    return this.selectedAptosWallet.url;
  }

  async connect(): Promise<string[]> {
    await this.walletCore.connect(this.selectedAptosWallet.name);

    // Set address
    this.address = this.walletCore.account?.address;
    this.walletCore.on("accountChange", async (accountInfo) => {
      this.address = accountInfo?.address;
    });

    // Set network
    this.network = this.walletCore.network || undefined;
    this.walletCore.on("networkChange", async (network) => {
      this.network = network || undefined;
    });

    return this.getAddresses();
  }

  getNetworkInfo() {
    return this.network;
  }

  isConnected(): boolean {
    return this.walletCore.isConnected();
  }

  disconnect(): Promise<void> {
    this.walletCore.off("accountChange");
    this.walletCore.off("networkChange");
    return this.walletCore.disconnect();
  }

  getChainId() {
    return CHAIN_ID_APTOS;
  }

  getAddress(): string | undefined {
    return this.address;
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

  async signTransaction(tx: AnyRawTransaction): Promise<AccountAuthenticator> {
    return this.walletCore.signTransaction(tx);
  }

  async sendTransaction(
    txInput: SendTransactionInput
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    const result = await this.walletCore.submitTransaction({
      transaction: txInput.transaction,
      senderAuthenticator: txInput.senderAuthenticator,
    });

    return {
      id: result.hash,
      data: { hash: result.hash },
    };
  }

  async signAndSendTransaction(
    tx: InputTransactionData
  ): Promise<SendTransactionResult<AptosSubmitResult>> {
    const result = await this.walletCore.signAndSubmitTransaction(tx);
    return {
      id: result.hash,
      data: result,
    };
  }

  async signMessage(msg: SignMessagePayload): Promise<SignedAptosMessage> {
    return this.walletCore.signMessage(msg);
  }

  getIcon(): string {
    return getWalletOverride("icon", this.selectedAptosWallet);
  }

  getWalletState(): WalletState {
    const state = this.selectedAptosWallet.readyState;
    return WalletState[state || WalletState.NotDetected];
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_APTOS;
  }
}
