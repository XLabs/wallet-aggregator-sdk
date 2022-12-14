import { createContext, useMemo, useState } from "react";
import { ChainId, Wallet } from "wormhole-wallet-aggregator";

export type AvailableWalletsMap = { [key: number]: Wallet[] }
export type WalletMap = { [key: number]: Wallet }

const DEFAULT_CHAIN: number = -1;

interface IWalletContext {
  wallets: WalletMap;
  defaultWallet?: Wallet | undefined;
  availableWallets: AvailableWalletsMap;
  changeWallet: (newWallet: Wallet | undefined) => void;
}

export const WalletContext = createContext<IWalletContext>({
  changeWallet: () => {},
  availableWallets: {},
  wallets: {}
});

interface IWalletContextProviderProps {
  availableWallets: AvailableWalletsMap;
}

export const WalletContextProvider = ({ availableWallets, children }: React.PropsWithChildren<IWalletContextProviderProps>) => {
  const [ wallets, setWallets ] = useState<WalletMap>({});
  const [ defaultWallet, setDefaultWallet ] = useState<Wallet | undefined>();

  const changeWallet = (newWallet?: Wallet) => {
    setDefaultWallet(newWallet);

    if (!newWallet) return;

    setWallets({
      ...wallets,
      [ newWallet.getChainId() ]: newWallet
    });
  }

  const value = useMemo(() => ({
    wallets,
    defaultWallet,
    availableWallets,
    changeWallet,
  }), [ wallets, defaultWallet, availableWallets ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
