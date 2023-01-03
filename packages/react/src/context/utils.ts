import {
    BackpackWalletAdapter, CloverWalletAdapter,
    Coin98WalletAdapter, ExodusWalletAdapter, NightlyWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter,
    TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { AlgorandWallet, AlgorandWalletConfig } from "wallet-aggregator-algorand";
import { ChainId, CHAINS, isEVMChain } from "wallet-aggregator-core";
import { EVMWalletConnectWallet, EVMWeb3Wallet } from "wallet-aggregator-evm";
import { AddEthereumChainParameterMap } from "wallet-aggregator-evm/dist/types/parameters";
import { SolanaAdapter, SolanaWallet } from "wallet-aggregator-solana";
import { AvailableWalletsMap } from "./WalletContext";


interface InitWalletsConfig {
    solana?: {
        host?: string;
    },
    algorand?: AlgorandWalletConfig,
    evm?: {
        chainParameters?: AddEthereumChainParameterMap
    }
}

export const initWallets = (config?: InitWalletsConfig): AvailableWalletsMap => {
    const solanaAdapters: SolanaAdapter[] = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter(),
        new NightlyWalletAdapter(),
        new SolletWalletAdapter(),
        new SolletExtensionWalletAdapter(),
        new CloverWalletAdapter(),
        new Coin98WalletAdapter(),
        new SlopeWalletAdapter(),
        new SolongWalletAdapter(),
        new TorusWalletAdapter(),
        new ExodusWalletAdapter()
    ];

    return {
        [CHAINS['algorand']]: [new AlgorandWallet(config?.algorand)],
        [CHAINS['ethereum']]: [
            new EVMWeb3Wallet(config?.evm?.chainParameters),
            new EVMWalletConnectWallet(config?.evm?.chainParameters)
        ],
        [CHAINS['solana']]:
            solanaAdapters.map(adapter =>
                new SolanaWallet(adapter, new Connection(config?.solana?.host || clusterApiUrl("devnet"))))
    };
};

// utility function to coalesce evm chains into a single id
export function getChainId(chainId: ChainId): ChainId {
    return isEVMChain(chainId) ? CHAINS['ethereum'] : chainId;
}
