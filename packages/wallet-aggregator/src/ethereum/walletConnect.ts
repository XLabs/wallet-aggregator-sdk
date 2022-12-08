import { TransactionRequest } from "@ethersproject/abstract-provider";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from 'ethers';
import { EthereumWallet } from "./ethereum";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

type EthProvider = ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc;

interface AddEthereumChainParameter {
    chainId: string; // A 0x-prefixed hexadecimal string
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string; // 2-6 characters long
        decimals: 18;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[]; // Currently ignored.
}

const METAMASK_CHAIN_PARAMETERS: {
    [evmChainId: number]: AddEthereumChainParameter;
  } = {
    3: {
        chainId: "0x3",
        chainName: "Ropsten",
        nativeCurrency: { name: "Ropsten Ether", symbol: "ROP", decimals: 18 },
        rpcUrls: ["https://rpc.ankr.com/eth_ropsten"],
        blockExplorerUrls: ["https://ropsten.etherscan.io"],
    },
    5: {
        chainId: "0x5",
        chainName: "Görli",
        nativeCurrency: { name: "Görli Ether", symbol: "GOR", decimals: 18 },
        rpcUrls: ["https://rpc.ankr.com/eth_goerli"],
        blockExplorerUrls: ["https://goerli.etherscan.io"],
    }
};

interface EvmRpcMap {
    [chainId: string]: string;
}

const EVM_RPC_MAP = Object.entries(METAMASK_CHAIN_PARAMETERS).reduce(
    (evmRpcMap, [evmChainId, { rpcUrls }]) => {
        if (rpcUrls.length > 0) {
            evmRpcMap[evmChainId] = rpcUrls[0];
        }
        return evmRpcMap;
    },
    {} as EvmRpcMap
);

export class EthereumWalletConnectWallet extends EthereumWallet {
    private walletConnectProvider?: WalletConnectProvider;

    constructor() {
        super();
    }

    getName(): string {
        return 'Eth Wallet Connect';
    }

    async innerConnect(): Promise<void> {
        this.walletConnectProvider = new WalletConnectProvider({
            rpc: EVM_RPC_MAP,
            storageId: "walletconnectid-evm"
        });

        await this.walletConnectProvider.enable();

        this.provider = new ethers.providers.Web3Provider(
            // @ts-ignore
            this.walletConnectProvider,
            'any'
        );

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
        });
        this.walletConnectProvider.on(
            "disconnect",
            (code: number, reason: string) => {
                this.disconnect();
            }
        );
    }

    async disconnect(): Promise<void> {
        return this.walletConnectProvider?.disconnect();
    }
}