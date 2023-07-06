import { ChainId, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import { useCallback, useMemo } from "react";
import { AvailableWalletsMap, useWalletContext } from "./WalletContext";

/**
 * @param chainId A chain id, or undefined
 * @returns If the chain id is not undefined, it will return the selected wallet for that specific chain, or undefined if not set. Otherwise, it will retrieve the last configured wallet, regardless of its chain.
 */
export const useWallet = <W extends Wallet = Wallet>(
  chainId: ChainId | undefined
): W | undefined => {
  const { wallets, coalesceChainId, defaultWallet } = useWalletContext();

  let wallet: Wallet | undefined;
  if (chainId !== undefined && chainId !== null) {
    wallet = wallets[coalesceChainId(chainId)];
  } else {
    wallet = defaultWallet;
  }

  return useMemo(() => wallet as W, [wallet]);
};

/**
 * Retrieve the available wallets configured for the context
 */
export const useAvailableWallets = (): AvailableWalletsMap => {
  const { availableWallets } = useWalletContext();
  return useMemo(() => availableWallets, [availableWallets]);
};

/**
 * Retrieve a list of chain ids, computed from the available wallets configured for the context
 */
export const useAvailableChains = (): ChainId[] => {
  const walletsMap = useAvailableWallets();
  return useMemo(
    () => Object.keys(walletsMap).map((id) => +id as ChainId),
    [walletsMap]
  );
};

/**
 * Retrieve the list of available wallets for a specific chain, computed from the available wallets configured for the context
 * @param chainId A chain id
 * @returns A non-empty array of Wallet objects, or an empty array if no entry has been found for that chain id
 */
export const useWalletsForChain = (chainId?: ChainId): Wallet[] => {
  const { coalesceChainId } = useWalletContext();
  const walletsMap = useAvailableWallets();

  let wallets: Wallet[] = [];

  if (chainId !== undefined && chainId !== null) {
    chainId = coalesceChainId(chainId);
    wallets = walletsMap[chainId] || [];
  }

  return useMemo(() => wallets, [wallets, walletsMap]);
};

/**
 * Retrieve the list of available wallets for a specific chain, computed from the available wallets configured for the context
 * @param chainId A chain id
 * @returns An object with a wallets property and isDetectingWallets, where isDetectingWallets switch between true and false
 * and wallets is a non-empty array of Wallet objects, or an empty array if no entry has been found for that chain id
 */
export const useWalletsForChainWithStatus = (
  chainId?: ChainId
): { wallets: Wallet[]; isDetectingWallets: boolean } => {
  const wallets = useWalletsForChain(chainId);
  const { isDetectingWallets } = useWalletContext();
  return useMemo(
    () => ({ wallets, isDetectingWallets }),
    [wallets, isDetectingWallets]
  );
};

/**
 * Returns a function that takes a `Wallet` as an argument and selects it as the current wallet for its chain (as indicated by the wallet's `getChainId`) and replacing the previous, should there be one. The selected wallet can then be retrieved through the useWallet and useWalletFromChain hooks
 *
 * The returned function does not attempt to connect the selected wallet, nor disconnect the replaced wallet.
 */
export const useChangeWallet = () => {
  const { changeWallet } = useWalletContext();

  return useCallback(
    (wallet: Wallet) => {
      changeWallet(wallet);
    },
    [changeWallet]
  );
};

/**
 * Returns a function that takes a `ChainId` as an argument and removes the current wallet for that chain.
 *
 * The returned function does not attempt to disconnect the current wallet before removing it
 */
export const useUnsetWalletFromChain = () => {
  const { unsetWalletFromChain } = useWalletContext();

  return useCallback(
    (chainId: ChainId) => {
      unsetWalletFromChain(chainId);
    },
    [unsetWalletFromChain]
  );
};
