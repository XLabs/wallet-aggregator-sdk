import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, Wallet } from "@xlabs-libs/wallet-aggregator-core";

export type AvailableWalletsMap = Partial<Record<ChainId, Wallet[]>>;
export type AvailableWalletsMapBuilderFn = () => Promise<AvailableWalletsMap>;
export type WalletMap = { [key: number]: Wallet | undefined }

interface IWalletContext {
  wallets: WalletMap;
  defaultWallet?: Wallet | undefined;
  availableWallets: AvailableWalletsMap;
  changeWallet: (newWallet: Wallet) => void;
  unsetWalletFromChain: (chainId: ChainId) => void;
}

export const WalletContext = createContext<IWalletContext>({
  changeWallet: () => {},
  unsetWalletFromChain: () => {},
  availableWallets: {},
  wallets: {}
});

interface IWalletContextProviderProps {
  wallets: AvailableWalletsMap | AvailableWalletsMapBuilderFn;
}

export const WalletContextProvider = ({ wallets: configureWallets, children }: React.PropsWithChildren<IWalletContextProviderProps>) => {
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

    setDefaultWallet(newWallet);
    setWallets({
      ...wallets,
      [ newWallet.getChainId() ]: newWallet
    });
  }, [ wallets ]);

  const unsetWalletFromChain = useCallback((chainId: ChainId) => {
    const { [chainId]: removedWallet, ...otherWallets } = wallets;
    setWallets(otherWallets);

    if (defaultWallet && defaultWallet.getName() === removedWallet?.getName()) {
      const potentialDefaults = Object.values(otherWallets);
      setDefaultWallet(potentialDefaults.length ? potentialDefaults[0] : undefined);
    }
  }, [ wallets, defaultWallet ]);

  const value = useMemo(() => ({
    wallets,
    defaultWallet,
    availableWallets,
    changeWallet,
    unsetWalletFromChain
  }), [ wallets, defaultWallet, availableWallets, unsetWalletFromChain ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
