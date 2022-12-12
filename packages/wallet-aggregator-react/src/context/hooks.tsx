import { useCallback, useContext, useMemo } from "react";
import { ChainId, Wallet } from "wormhole-wallet-aggregator";
import { WalletContext } from "./WalletContext";


export const useWallet = (): Wallet | undefined => {
    const { wallet } = useContext(WalletContext);
    return useMemo(() => wallet, [wallet]);
}

export const useAvailableWallets = (): { [key: number]: Wallet[] } => {
    const { availableWallets } = useContext(WalletContext);
    return useMemo(() => availableWallets, [availableWallets]);
}

export const useAvailableChains = () => {
    const walletsMap = useAvailableWallets();
    return useMemo(() => Object.keys(walletsMap), [ walletsMap ])
};

export const useGetWalletsForChain = () => {
    const walletsMap = useAvailableWallets();

    return useCallback((chainId: ChainId) => {
        return walletsMap[chainId] || [];
    }, [ walletsMap ])
};

export const useChangeWallet = () => {
    const { changeWallet } = useContext(WalletContext);

    return useCallback((wallet: Wallet | undefined) => {
        changeWallet(wallet);
    }, [ changeWallet ]);
}
  