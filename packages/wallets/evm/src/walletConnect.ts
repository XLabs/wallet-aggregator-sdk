import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from 'ethers';
import { EvmRpcMap, EVM_RPC_MAP as DEFAULT_EVM_RPC_MAP } from "./parameters";
import { EVMWallet } from "./evm";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

export class EVMWalletConnectWallet extends EVMWallet {
    private walletConnectProvider?: WalletConnectProvider;

    constructor(private readonly rpcMap: EvmRpcMap = DEFAULT_EVM_RPC_MAP) {
        super();
    }

    getName(): string {
        return 'Eth Wallet Connect';
    }

    async innerConnect(): Promise<void> {
        this.walletConnectProvider = new WalletConnectProvider({
            rpc: this.rpcMap,
            storageId: "walletconnectid-evm"
        });

        await this.walletConnectProvider.enable();

        this.provider = new ethers.providers.Web3Provider(
            // @ts-ignore
            this.walletConnectProvider,
            'any'
        );

        this.walletConnectProvider.on('accountsChanged', () => this.onAccountsChanged());

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

        this.walletConnectProvider.on(
            "disconnect",
            () => {
                this.emit('disconnect');
            }
        );
    }

    async switchChain(evmChainId: number): Promise<void> {
        if (
            DEFAULT_EVM_RPC_MAP[evmChainId] === undefined
        ) {
            // WalletConnect requires a rpc url for this chain
            // Force user to switch connect type
            return this.disconnect();
        }

        return super.switchChain(evmChainId);
    }

    async innerDisconnect(): Promise<void> {
        await this.walletConnectProvider?.disconnect();
        this.walletConnectProvider?.removeAllListeners();
        this.walletConnectProvider = undefined;
    }
}