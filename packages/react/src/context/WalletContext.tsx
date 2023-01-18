import React, { createContext, useMemo, useState } from "react";
import { ChainId, Wallet } from "@xlabs-libs/wallet-aggregator-core";

export type AvailableWalletsMap = { [key: number]: Wallet[] }
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
  availableWallets: AvailableWalletsMap;
}

export const WalletContextProvider = ({ availableWallets, children }: React.PropsWithChildren<IWalletContextProviderProps>) => {
  const [ wallets, setWallets ] = useState<WalletMap>({});
  const [ defaultWallet, setDefaultWallet ] = useState<Wallet | undefined>();

  const changeWallet = (newWallet: Wallet) => {
    if (!newWallet) throw new Error('Invalid wallet');

    setDefaultWallet(newWallet);
    setWallets({
      ...wallets,
      [ newWallet.getChainId() ]: newWallet
    });
  }

  const unsetWalletFromChain = (chainId: ChainId) => {
    const { [chainId]: removedWallet, ...otherWallets } = wallets;
    setWallets(otherWallets);

    if (defaultWallet && defaultWallet.getName() === removedWallet?.getName()) {
      const potentialDefaults = Object.values(otherWallets);
      setDefaultWallet(potentialDefaults.length ? potentialDefaults[0] : undefined);
    }
  }

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
