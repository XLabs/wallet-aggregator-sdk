import { createContext, useMemo, useState } from "react";
import { ChainId, Wallet } from "wormhole-wallet-aggregator";

export type WalletMap = { [key: number]: Wallet[] }

interface IWalletContext {
  wallet?: Wallet;
  availableWallets: WalletMap;
  changeWallet: (newWallet: Wallet | undefined) => void;
}

export const WalletContext = createContext<IWalletContext>({
  changeWallet: () => {},
  availableWallets: {}
});

interface IWalletContextProviderProps {
  availableWallets: WalletMap;
}

export const WalletContextProvider = ({ availableWallets, children }: React.PropsWithChildren<IWalletContextProviderProps>) => {
  const [ wallet, setWallet ] = useState<Wallet | undefined>();

  const changeWallet = (newWallet: Wallet | undefined) => {
    setWallet(newWallet);
  }

  const value = useMemo(() => ({
    wallet,
    availableWallets,
    changeWallet,
  }), [ wallet, availableWallets ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
