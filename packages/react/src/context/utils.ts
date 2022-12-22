import {
    BackpackWalletAdapter, CloverWalletAdapter,
    Coin98WalletAdapter, ExodusWalletAdapter, NightlyWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter,
    TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { AlgorandWallet } from "wallet-aggregator-algorand";
import { ChainId, CHAINS, isEVMChain } from "wallet-aggregator-core";
import { EVMWalletConnectWallet, EVMWeb3Wallet } from "wallet-aggregator-evm";
import { SolanaAdapter, SolanaWallet } from "wallet-aggregator-solana";
import { AvailableWalletsMap } from "./WalletContext";


interface InitWalletsConfig {
    solanaHost?: string;
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
        [CHAINS['algorand']]: [new AlgorandWallet()],
        [CHAINS['ethereum']]: [new EVMWeb3Wallet(), new EVMWalletConnectWallet()],
        [CHAINS['solana']]: solanaAdapters.map(adapter => new SolanaWallet(adapter, new Connection(config?.solanaHost || clusterApiUrl("devnet"))))
    };
};

// utility function to coalesce evm chains into a single id
export function getChainId(chainId: ChainId): ChainId {
    return isEVMChain(chainId) ? CHAINS['ethereum'] : chainId;
}
