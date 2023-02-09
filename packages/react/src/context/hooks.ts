import { useCallback, useContext, useMemo } from "react";
import { ChainId, CHAIN_ID_ETH, isEVMChain, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import { AvailableWalletsMap, WalletContext } from "./WalletContext";


export const useWallet = <W extends Wallet = Wallet>(): W | undefined => {
    const { defaultWallet: wallet } = useContext(WalletContext);
    return useMemo(() => wallet as W, [wallet]);
}

export const useWalletFromChain = <W extends Wallet = Wallet>(chainId: ChainId): W | undefined => {
    const { wallets, coalesceEvmChains } = useContext(WalletContext);

    if (coalesceEvmChains && isEVMChain(chainId)) {
        chainId = CHAIN_ID_ETH;
    }

    const wallet = wallets[chainId];
    return useMemo(() => wallet as W, [ chainId, wallet, wallets ]);
}

export const useAvailableWallets = (): AvailableWalletsMap => {
    const { availableWallets } = useContext(WalletContext);
    return useMemo(() => availableWallets, [availableWallets]);
}

export const useAvailableChains = (): ChainId[] => {
    const walletsMap = useAvailableWallets();
    return useMemo(() => Object.keys(walletsMap).map(id => +id as ChainId), [ walletsMap ])
};

export const useWalletsForChain = (chainId?: ChainId): Wallet[] => {
    const walletsMap = useAvailableWallets();

    let wallets: Wallet[] = []

    if (chainId) {
        wallets = walletsMap[chainId] || [];
    }

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
  