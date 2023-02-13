import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChainId, CHAIN_ID_ETH, isEVMChain, Wallet } from "@xlabs-libs/wallet-aggregator-core";

export type AvailableWalletsMap = Partial<Record<ChainId, Wallet[]>>;
export type AvailableWalletsMapBuilderFn = () => Promise<AvailableWalletsMap>;
export type WalletMap = Partial<Record<ChainId, Wallet | undefined>>;

interface IWalletContext {
  wallets: WalletMap;
  defaultWallet?: Wallet | undefined;
  availableWallets: AvailableWalletsMap;
  coalesceEvmChains: boolean;
  changeWallet: (newWallet: Wallet) => void;
  unsetWalletFromChain: (chainId: ChainId) => void;
}

export const WalletContext = createContext<IWalletContext>({
  changeWallet: () => {},
  unsetWalletFromChain: () => {},
  availableWallets: {},
  wallets: {},
  coalesceEvmChains: true
});

interface IWalletContextProviderProps {
  /**
   * Either a Map indexed by chain ids with Wallet arrays as values, or a function that builds such a map
   */
  wallets: AvailableWalletsMap | AvailableWalletsMapBuilderFn;
  /**
   * Aggregate all EVM chains into a single one, indexed by the Ethereum chain id (eth). Enabled by default.
   */
  coalesceEvmChains?: boolean;
}

export const WalletContextProvider = ({ wallets: configureWallets, children, coalesceEvmChains = true }: React.PropsWithChildren<IWalletContextProviderProps>) => {
  const [ wallets, setWallets ] = useState<WalletMap>({});
  const [ availableWallets, setAvailableWallets ] = useState<AvailableWalletsMap>({});
  const [ defaultWallet, setDefaultWallet ] = useState<Wallet | undefined>();

  useEffect(() => {
    const initWallets = async () => {
      const available = typeof configureWallets === 'function'
        ? await configureWallets()
        : configureWallets;

      setAvailableWallets(available);
    }
    initWallets();
  }, [ configureWallets ])

  const changeWallet = useCallback((newWallet: Wallet) => {
    if (!newWallet) throw new Error('Invalid wallet');

    let chainId = newWallet.getChainId();
    if (coalesceEvmChains && isEVMChain(chainId)) {
      chainId = CHAIN_ID_ETH;
    }

    setDefaultWallet(newWallet);
    setWallets({
      ...wallets,
      [ chainId ]: newWallet
    });
  }, [ wallets ]);

  const unsetWalletFromChain = useCallback((chainId: ChainId) => {
    if (coalesceEvmChains && isEVMChain(chainId)) {
      chainId = CHAIN_ID_ETH;
    }

    const { [chainId]: removedWallet, ...otherWallets } = wallets;

    const newWalletMap: WalletMap = otherWallets || {};
    setWallets(newWalletMap);

    if (defaultWallet && defaultWallet.getName() === removedWallet?.getName()) {
      const potentialDefaults = Object.values(newWalletMap);
      setDefaultWallet(potentialDefaults.length ? potentialDefaults[0] : undefined);
    }
  }, [ wallets, defaultWallet ]);

  const value = useMemo(() => ({
    wallets,
    defaultWallet,
    availableWallets,
    changeWallet,
    unsetWalletFromChain,
    coalesceEvmChains
  }), [ wallets, defaultWallet, availableWallets, unsetWalletFromChain ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWalletContext = (): IWalletContext => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('No WalletContext found. Make sure you have properly set up the WalletContextProvider');
  }

  return context;
}
