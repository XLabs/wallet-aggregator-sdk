import { CoinbaseWalletConnector } from "@wagmi/core/connectors/coinbaseWallet";
import { EVMWallet, EVMWalletConfig, EVMWalletType } from "./evm";

/** Coinbase Wallet SDK Options */
export interface CoinbaseWalletSDKOptions {
  /** Application name */
  appName: string;
  /** @optional Application logo image URL; favicon is used if unspecified */
  appLogoUrl?: string | null;
  /** @optional Use dark theme */
  darkMode?: boolean;
  /** @optional Coinbase Wallet link server URL; for most, leave it unspecified */
  linkAPIUrl?: string;
  /** @optional whether wallet link provider should override the isMetaMask property. */
  overrideIsMetaMask?: boolean;
  /** @optional whether wallet link provider should override the isCoinbaseWallet property. */
  overrideIsCoinbaseWallet?: boolean;
  /** @optional whether coinbase wallet provider should override the isCoinbaseBrowser property. */
  overrideIsCoinbaseBrowser?: boolean;
  /** @optional whether or not onboarding overlay popup should be displayed */
  headlessMode?: boolean;
  /** @optional whether or not to reload dapp automatically after disconnect, defaults to true */
  reloadOnDisconnect?: boolean;
  /** Fallback Ethereum JSON RPC URL */
  jsonRpcUrl?: string;
  /** Fallback Ethereum Chain ID */
  chainId?: number;
}

export interface CoinbaseWalletConfig
  extends EVMWalletConfig<CoinbaseWalletSDKOptions> {
  /** Coinbase Wallet SDK Options */
  options: CoinbaseWalletSDKOptions;
}

export class CoinbaseWallet extends EVMWallet<
  CoinbaseWalletConnector,
  CoinbaseWalletSDKOptions
> {
  constructor(config: CoinbaseWalletConfig) {
    super(config);
  }

  protected createConnector(): CoinbaseWalletConnector {
    return new CoinbaseWalletConnector({
      chains: this.chains,
      options: this.connectorOptions,
    });
  }

  getName(): string {
    return "Coinbase Wallet";
  }

  getUrl(): string {
    return "https://www.coinbase.com/wallet";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjEwMDAiIHZpZXdCb3g9IjAgMCAxMDAwIDEwMDAiIGZpbGw9Im5vbmUiPgo8Y2lyY2xlIGN4PSI1MDAiIGN5PSI1MDAiIHI9IjUwMCIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MCA1MDBDMTUwIDY5My4zIDMwNi43IDg1MCA1MDAgODUwQzY5My4zIDg1MCA4NTAgNjkzLjMgODUwIDUwMEM4NTAgMzA2LjcgNjkzLjMgMTUwIDUwMCAxNTBDMzA2LjcgMTUwIDE1MCAzMDYuNyAxNTAgNTAwWk00MTAuNTU2IDM4Ny4yMjJDMzk3LjY2OSAzODcuMjIyIDM4Ny4yMjIgMzk3LjY2OSAzODcuMjIyIDQxMC41NTZWNTg5LjQ0NEMzODcuMjIyIDYwMi4zMzEgMzk3LjY2OSA2MTIuNzc4IDQxMC41NTYgNjEyLjc3OEg1ODkuNDQ0QzYwMi4zMzEgNjEyLjc3OCA2MTIuNzc4IDYwMi4zMzEgNjEyLjc3OCA1ODkuNDQ0VjQxMC41NTZDNjEyLjc3OCAzOTcuNjY5IDYwMi4zMzEgMzg3LjIyMiA1ODkuNDQ0IDM4Ny4yMjJINDEwLjU1NloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==";
  }

  static getWalletType(): EVMWalletType {
    return EVMWalletType.Coinbase;
  }
}
