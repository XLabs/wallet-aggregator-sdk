import { hexlify, hexStripZeros } from "@ethersproject/bytes";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from 'ethers';
import { EVMWallet, EVMWalletConfig } from "./evm";
import { buildRpcMap, EvmRpcMap, EVM_RPC_MAP as DEFAULT_EVM_RPC_MAP } from "./parameters";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

export class EVMWalletConnectWallet extends EVMWallet {
    private readonly STORAGE_KEY: string = 'wallet-aggregator-sdk-wallet-connect';
    private walletConnectProvider?: WalletConnectProvider;
    private rpcMap: EvmRpcMap;

    constructor(config: EVMWalletConfig = {}) {
        super(config);
        this.rpcMap = buildRpcMap(this.chainParameters)
    }

    getName(): string {
        return 'Eth Wallet Connect';
    }

    getUrl(): string {
        return 'https://walletconnect.com';
    }

    async innerConnect(): Promise<string[]> {
        this.walletConnectProvider = new WalletConnectProvider({
            rpc: this.rpcMap,
            chainId: this.preferredChain,
            storageId: this.STORAGE_KEY
        });

        await this.walletConnectProvider.enable();

        this.provider = new ethers.providers.Web3Provider(
            // @ts-ignore
            this.walletConnectProvider,
            'any'
        );

        this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => this.onAccountsChanged(accounts));

        this.walletConnectProvider.on("chainChanged", (chainId: number) => {
            // HACK: clear the block-cache when switching chains by creating a new CacheSubprovider
            // Otherwise ethers may not resolve transaction receipts/waits
            const index = this.walletConnectProvider!._providers.findIndex(
                (subprovider: any) => subprovider instanceof CacheSubprovider
            );
            if (index >= 0) {
                const subprovider = this.walletConnectProvider!._providers[index];
                this.walletConnectProvider!.removeProvider(subprovider);
                this.walletConnectProvider!.addProvider(
                    new CacheSubprovider(),
                    index
                );
                // also reset the latest block
                this.walletConnectProvider!._blockTracker._resetCurrentBlock();
            }
            this.onChainChanged(chainId);
        });

        this.walletConnectProvider.on("disconnect", () => this.disconnect());

        return [ await this.provider.getSigner().getAddress() ]
    }

    async switchChain(evmChainId: number): Promise<void> {
        if (
            DEFAULT_EVM_RPC_MAP[evmChainId] === undefined
        ) {
            // WalletConnect requires a rpc url for this chain
            // Force user to switch connect type
            await this.disconnect();
            throw new Error(`No WalletConnect configuration found for chain ${hexStripZeros(hexlify(evmChainId))}`);
        }

        return super.switchChain(evmChainId);
    }

    async innerDisconnect(): Promise<void> {
        await this.walletConnectProvider?.disconnect();
        this.walletConnectProvider?.removeAllListeners();
        this.walletConnectProvider = undefined;
    }

    getIcon(): string {
        // https://github.com/WalletConnect/walletconnect-assets/blob/c6e9d7ca2e81d4094e83849f560a024962a7987a/Logo/Blue%20(Default)/Logo.svg
        return 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIHdpZHRoPSI0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxjbGlwUGF0aCBpZD0iYSI+PHBhdGggZD0ibTAgMGg0MDB2NDAwaC00MDB6Ii8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjYSkiPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgZmlsbD0iIzMzOTZmZiIgcj0iMTk5LjUiIHN0cm9rZT0iIzY2YjFmZiIvPjxwYXRoIGQ9Im0xMjIuNTE5IDE0OC45NjVjNDIuNzkxLTQxLjcyOSAxMTIuMTcxLTQxLjcyOSAxNTQuOTYyIDBsNS4xNSA1LjAyMmMyLjE0IDIuMDg2IDIuMTQgNS40NjkgMCA3LjU1NWwtMTcuNjE3IDE3LjE4Yy0xLjA3IDEuMDQzLTIuODA0IDEuMDQzLTMuODc0IDBsLTcuMDg3LTYuOTExYy0yOS44NTMtMjkuMTExLTc4LjI1My0yOS4xMTEtMTA4LjEwNiAwbC03LjU5IDcuNDAxYy0xLjA3IDEuMDQzLTIuODA0IDEuMDQzLTMuODc0IDBsLTE3LjYxNy0xNy4xOGMtMi4xNC0yLjA4Ni0yLjE0LTUuNDY5IDAtNy41NTV6bTE5MS4zOTcgMzUuNTI5IDE1LjY3OSAxNS4yOWMyLjE0IDIuMDg2IDIuMTQgNS40NjkgMCA3LjU1NWwtNzAuNyA2OC45NDRjLTIuMTM5IDIuMDg3LTUuNjA4IDIuMDg3LTcuNzQ4IDBsLTUwLjE3OC00OC45MzFjLS41MzUtLjUyMi0xLjQwMi0uNTIyLTEuOTM3IDBsLTUwLjE3OCA0OC45MzFjLTIuMTM5IDIuMDg3LTUuNjA4IDIuMDg3LTcuNzQ4IDBsLTcwLjcwMTUtNjguOTQ1Yy0yLjEzOTYtMi4wODYtMi4xMzk2LTUuNDY5IDAtNy41NTVsMTUuNjc5NS0xNS4yOWMyLjEzOTYtMi4wODYgNS42MDg1LTIuMDg2IDcuNzQ4MSAwbDUwLjE3ODkgNDguOTMyYy41MzUuNTIyIDEuNDAyLjUyMiAxLjkzNyAwbDUwLjE3Ny00OC45MzJjMi4xMzktMi4wODcgNS42MDgtMi4wODcgNy43NDggMGw1MC4xNzkgNDguOTMyYy41MzUuNTIyIDEuNDAyLjUyMiAxLjkzNyAwbDUwLjE3OS00OC45MzFjMi4xMzktMi4wODcgNS42MDgtMi4wODcgNy43NDggMHoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+';
    }
}
