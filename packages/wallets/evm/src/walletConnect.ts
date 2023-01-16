import { hexlify, hexStripZeros } from "@ethersproject/bytes";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from 'ethers';
import { EVMWallet, EVMWalletConfig } from "./evm";
import { buildRpcMap, EvmRpcMap, EVM_RPC_MAP as DEFAULT_EVM_RPC_MAP } from "./parameters";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

export class EVMWalletConnectWallet extends EVMWallet {
    private walletConnectProvider?: WalletConnectProvider;
    private rpcMap: EvmRpcMap;

    constructor(config: EVMWalletConfig = {}) {
        super(config);
        this.rpcMap = buildRpcMap(this.chainParameters)
    }

    getName(): string {
        return 'Eth Wallet Connect';
    }

    async innerConnect(): Promise<string[]> {
        this.walletConnectProvider = new WalletConnectProvider({
            rpc: this.rpcMap,
            chainId: this.preferredChain
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
        return 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxLjY4MiAxLjY4Mikgc2NhbGUoMS43ODk3KSI+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJNMCAwaDE2djE2SDB6Ii8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjYSkiPjxwYXRoIGQ9Ik0xMi43MjUgNC45MjdjLTIuNTk0LTIuNTg4LTYuODU2LTIuNTg4LTkuNDUgMGwtLjM0NC4zNDVhLjMzNC4zMzQgMCAwIDAgMCAuNDcxbDEuMDc0IDEuMDczYS4xNjcuMTY3IDAgMCAwIC4yMzYgMGwuNDYzLS40NjJjMS44MDktMS44MDYgNC43ODMtMS44MDYgNi41OTIgMGwuNDMyLjQzMWEuMTY3LjE2NyAwIDAgMCAuMjM2IDBsMS4wNzUtMS4wNzJhLjMzLjMzIDAgMCAwIDAtLjQ3MmwtLjMxNC0uMzE0Wk0xNS45MDIgOC4xbC0uOTU2LS45NTVhLjMzNi4zMzYgMCAwIDAtLjQ3MiAwbC0zLjA2IDMuMDU1YS4wODUuMDg1IDAgMCAxLS4xMTggMGwtMy4wNi0zLjA1NWEuMzM2LjMzNiAwIDAgMC0uNDcyIDBMNC43MDQgMTAuMmEuMDg1LjA4NSAwIDAgMS0uMTE4IDBsLTMuMDYtMy4wNTVhLjMzNi4zMzYgMCAwIDAtLjQ3MiAwTC4wOTggOC4xYS4zMy4zMyAwIDAgMCAwIC40NzJsNC4zMSA0LjMwNGMuMTMxLjEzLjM0My4xMy40NzMgMGwzLjA2LTMuMDU1YS4wODUuMDg1IDAgMCAxIC4xMTggMGwzLjA2IDMuMDU1Yy4xMy4xMy4zNDIuMTMuNDcyIDBsNC4zMTEtNC4zMDRhLjMzLjMzIDAgMCAwIDAtLjQ3MloiIHN0eWxlPSJmaWxsOiMzYjk5ZmM7ZmlsbC1ydWxlOm5vbnplcm8iLz48L2c+PC9nPjwvc3ZnPg==';
    }
}
