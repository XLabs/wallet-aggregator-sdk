import { useCallback, useContext, useMemo } from "react";
import { AlgorandWallet, ChainId, CHAINS, EthereumWalletConnectWallet, EthereumWeb3Wallet, Wallet } from "wormhole-wallet-aggregator";
import { WalletContext } from "./WalletContext";


export const useWallet = (): Wallet => {
    const { wallet } = useContext(WalletContext);
    return useMemo(() => wallet, [wallet]) as Wallet;
}

export const useAvailableWallets = (): { [key: number]: Wallet[] } => {
    return useMemo(() => ({
        [CHAINS['algorand']]: [ new AlgorandWallet() ],
        [CHAINS['ethereum']]: [ new EthereumWeb3Wallet(), new EthereumWalletConnectWallet() ]
    }), []);
}

export const useAvailableChains = () => {
    const walletsMap = useAvailableWallets();
    return useMemo(() => Object.keys(walletsMap), [ walletsMap ])
};

export const useGetWalletsForChain = () => {
    const walletsMap = useAvailableWallets();
    // return useMemo(() => available[chainId] || [], [ chainId ])
    return useCallback((chainId: ChainId) => {
        return walletsMap[chainId] || [];
    }, [ walletsMap ])
};

export const useChangeWallet = () => {
    const { changeWallet } = useContext(WalletContext);

    return useCallback((wallet: Wallet) => {
        changeWallet(wallet);
    }, [ changeWallet ]);
}
  