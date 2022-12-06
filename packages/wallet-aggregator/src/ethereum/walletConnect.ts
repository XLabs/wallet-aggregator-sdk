import { TransactionRequest } from "@ethersproject/abstract-provider";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from 'ethers';
import { EthereumWallet } from "./ethereum";

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
    private provider?: ethers.providers.Web3Provider;  

    constructor() {
        super();
    }

    async connect(): Promise<void> {
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

        // this.walletConnectProvider.on("chainChanged", (chainId: number) => {
        //     setChainId(chainId);
        //     // HACK: clear the block-cache when switching chains by creating a new CacheSubprovider
        //     // Otherwise ethers may not resolve transaction receipts/waits
        //     const index = this.walletConnectProvider!._providers.findIndex(
        //         (subprovider: any) => subprovider instanceof CacheSubprovider
        //     );
        //     if (index >= 0) {
        //         const subprovider = this.walletConnectProvider!._providers[index];
        //         this.walletConnectProvider!.removeProvider(subprovider);
        //         this.walletConnectProvider!.addProvider(
        //             new CacheSubprovider(),
        //             index
        //         );
        //         // also reset the latest block
        //         this.walletConnectProvider!._blockTracker._resetCurrentBlock();
        //     }
        // });
        // this.walletConnectProvider.on(
        //     "accountsChanged",
        //     (accounts: string[]) => {
        //     try {
        //         const signer = provider.getSigner();
        //         setSigner(signer);
        //         signer
        //         .getAddress()
        //         .then((address) => {
        //             setSignerAddress(address);
        //         })
        //         .catch(() => {
        //             setProviderError(
        //             "An error occurred while getting the signer address"
        //             );
        //         });
        //     } catch (error) {
        //         console.error(error);
        //     }
        //     }
        // );
        this.walletConnectProvider.on(
            "disconnect",
            (code: number, reason: string) => {
                this.disconnect();
            }
        );

        await this.provider.getSigner().getAddress();
    }

    async disconnect(): Promise<void> {
    }

    async getPublicKey(): Promise<string> {
        if (!this.provider) throw new Error('Not connected');

        return this.provider.getSigner().getAddress();
    }

    async createTransaction(params: object): Promise<object> {
        return params;
    }

    async signTransaction(tx: TransactionRequest): Promise<any> {
        if (!this.provider) throw new Error('Not connected');
        // return this.provider.getSigner().signTransaction(tx);
        return tx;
    }

    async sendTransaction(tx: TransactionRequest): Promise<any> {
        if (!this.provider) throw new Error('Not connected');
        return this.provider.getSigner().sendTransaction(tx);
    }

    async signMessage(msg: Uint8Array): Promise<any> {
        if (!this.provider) throw new Error('Not connected');
        return this.provider.getSigner().signMessage(msg);
    }

    getSigner(): ethers.Signer {
        if (!this.provider) throw new Error('Not connected');
        return this.provider.getSigner();
    }
}