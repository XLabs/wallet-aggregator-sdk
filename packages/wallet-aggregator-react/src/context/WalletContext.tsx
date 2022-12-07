import { createContext, useMemo, useState } from "react";
import { Wallet } from "wormhole-wallet-aggregator";

interface IWalletContext {
  wallet?: Wallet;
  changeWallet: (newWallet: Wallet) => void;
}

export const WalletContext = createContext<IWalletContext>({
  changeWallet: () => {}
});

export const WalletContextProvider = ({ children }: React.PropsWithChildren) => {
  const [ wallet, setWallet ] = useState<Wallet | undefined>();

  const changeWallet = (newWallet: Wallet) => {
    setWallet(newWallet);
  }

  const value = useMemo(() => ({
    wallet,
    changeWallet,
  }), [ wallet ])

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
