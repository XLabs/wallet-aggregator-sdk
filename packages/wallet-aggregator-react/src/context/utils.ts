import { AlgorandWallet, CHAINS, EthereumWalletConnectWallet, EthereumWeb3Wallet } from "wormhole-wallet-aggregator";
import { WalletMap } from "./WalletContext";

export {}

interface InitWalletsConfig {
} 

export const initWallets = (config?: InitWalletsConfig): WalletMap => {
    return {
        [CHAINS['algorand']]: [new AlgorandWallet()],
        [CHAINS['ethereum']]: [new EthereumWeb3Wallet(), new EthereumWalletConnectWallet()]
    }
};
