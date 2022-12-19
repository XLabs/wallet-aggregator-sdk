import {
    BackpackWalletAdapter, CloverWalletAdapter,
    Coin98WalletAdapter, ExodusWalletAdapter, NightlyWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter,
    TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { AlgorandWallet, CHAINS, EthereumWalletConnectWallet, EthereumWeb3Wallet, SolanaAdapter, SolanaWallet } from "wormhole-wallet-aggregator";
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
        [CHAINS['ethereum']]: [new EthereumWeb3Wallet(), new EthereumWalletConnectWallet()],
        [CHAINS['solana']]: solanaAdapters.map(adapter => new SolanaWallet(adapter, new Connection(config?.solanaHost || clusterApiUrl("devnet"))))
    };
};
