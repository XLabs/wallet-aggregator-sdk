import { EVMWallet, EVMWalletConfig } from "./evm";
import { CoinbaseWalletSDK, CoinbaseWalletProvider } from "@coinbase/wallet-sdk";
import { EVM_CHAINS } from "./constants";
import { ethers } from "ethers";

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
    options: CoinbaseWalletSDKOptions;
    rpcUrl: string;
}

export class CoinbaseWallet extends EVMWallet {
    private readonly wallet: CoinbaseWalletSDK;
    private readonly rpcUrl: string;
    private coinbaseProvider?: CoinbaseWalletProvider;

    constructor({ options, rpcUrl, ...config }: CoinbaseWalletConfig) {
        super(config);
        this.rpcUrl = rpcUrl;
        this.wallet = new CoinbaseWalletSDK({ ...options });
    }

    protected innerConnect(): Promise<string[]> {
        this.coinbaseProvider = this.wallet.makeWeb3Provider(
            this.rpcUrl,
            this.preferredChain || EVM_CHAINS['ethereum']
        );

        this.provider = new ethers.providers.Web3Provider(
            this.coinbaseProvider as any,
            'any'
        );

        this.coinbaseProvider.on('accountsChanged', (accounts: string[]) => this.onAccountsChanged(accounts));
        this.coinbaseProvider.on('chainChanged', (chainId: number) => this.onChainChanged(chainId));

        return this.provider.send('eth_requestAccounts', [])
    }

    async innerDisconnect(): Promise<void> {
        await this.coinbaseProvider?.removeAllListeners();
        await this.coinbaseProvider?.disconnect();
        await this.wallet.disconnect();
        this.coinbaseProvider = undefined;
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