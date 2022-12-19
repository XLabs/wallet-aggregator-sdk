import { useCallback, useContext, useMemo } from "react";
import { ChainId, Wallet } from "wormhole-wallet-aggregator-core";
import { WalletContext } from "./WalletContext";


export const useWallet = (): Wallet | undefined => {
    const { defaultWallet: wallet } = useContext(WalletContext);
    return useMemo(() => wallet, [wallet]);
}

export const useWalletFromChain = (chainId: ChainId): Wallet | undefined => {
    const { wallets } = useContext(WalletContext);
    const wallet = wallets[chainId];
    return useMemo(() => wallet, [ chainId, wallet, wallets ])
}

export const useAvailableWallets = (): { [key: number]: Wallet[] } => {
    const { availableWallets } = useContext(WalletContext);
    return useMemo(() => availableWallets, [availableWallets]);
}

export const useAvailableChains = () => {
    const walletsMap = useAvailableWallets();
    return useMemo(() => Object.keys(walletsMap), [ walletsMap ])
};

export const useWalletsForChain = (chainId: ChainId) => {
    const walletsMap = useAvailableWallets();
    const wallets = walletsMap[chainId] || [];

    return useMemo(() => wallets, [ wallets, walletsMap ])
};

export const useChangeWallet = () => {
    const { changeWallet } = useContext(WalletContext);

    return useCallback((wallet: Wallet) => {
        changeWallet(wallet);
    }, [ changeWallet ]);
}

export const useUnsetWalletFromChain = () => {
    const { unsetWalletFromChain } = useContext(WalletContext);

    return useCallback((chainId: ChainId) => {
        unsetWalletFromChain(chainId);
    }, [ unsetWalletFromChain ]);
}
  