import { CoinbaseWalletConnector } from '@wagmi/core/connectors/coinbaseWallet';
import { EVMWallet, EVMWalletConfig } from "./evm";

/** Coinbase Wallet SDK Constructor Options */
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
}

export interface CoinbaseWalletConfig extends EVMWalletConfig {
    /** Coinbase Wallet SDK Options */
    options: CoinbaseWalletSDKOptions;
}

export class CoinbaseWallet extends EVMWallet<CoinbaseWalletConnector> {
    private readonly options: CoinbaseWalletSDKOptions;

    constructor({ options, ...config }: CoinbaseWalletConfig) {
        super(config);
        this.options = options;
    }

    protected createConnector(): CoinbaseWalletConnector {
        return new CoinbaseWalletConnector({
            chains: this.chains,
            options: {
                ...this.options
            }
        });
    }

    getName(): string {
        return 'Coinbase Wallet'
    }

    getUrl(): string {
        return 'https://www.coinbase.com/wallet'
    }

    getIcon(): string {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiBmaWxsPSIjMDA1MkZGIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUyIDUxMkMxNTIgNzEwLjgyMyAzMTMuMTc3IDg3MiA1MTIgODcyQzcxMC44MjMgODcyIDg3MiA3MTAuODIzIDg3MiA1MTJDODcyIDMxMy4xNzcgNzEwLjgyMyAxNTIgNTEyIDE1MkMzMTMuMTc3IDE1MiAxNTIgMzEzLjE3NyAxNTIgNTEyWk00MjAgMzk2QzQwNi43NDUgMzk2IDM5NiA0MDYuNzQ1IDM5NiA0MjBWNjA0QzM5NiA2MTcuMjU1IDQwNi43NDUgNjI4IDQyMCA2MjhINjA0QzYxNy4yNTUgNjI4IDYyOCA2MTcuMjU1IDYyOCA2MDRWNDIwQzYyOCA0MDYuNzQ1IDYxNy4yNTUgMzk2IDYwNCAzOTZINDIwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';
    }
}