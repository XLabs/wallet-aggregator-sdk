export {};
// import { createContext, useCallback, useContext, useMemo, useState } from "react";
// import { AlgorandWallet, EthereumWalletConnectWallet, Wallet } from "wormhole-wallet-aggregator";

// type ChainId = number;

// interface IWalletContext {
//   wallet?: Wallet;
//   changeWallet: (id: ChainId) => void;
// }

// const WalletContext = createContext<IWalletContext>({
//   changeWallet: () => {}
// });

// const WalletContextProvider = ({ children }: React.PropsWithChildren) => {
//   const [ wallet, setWallet ] = useState<Wallet | undefined>();

//   const changeWallet = (id: ChainId) => {
//     if (id === 8) {
//       setWallet(new AlgorandWallet());
//     }
//     else if (id === 2) {
//       // setWallet(new EthereumWallet());
//       setWallet(new EthereumWalletConnectWallet())
//     }
//     else {
//       setWallet(undefined);
//     }
//   }

//   const value = useMemo(() => ({
//     wallet,
//     changeWallet,
//   }), [ wallet ])

//   return (
//     <WalletContext.Provider value={value}>
//       {children}
//     </WalletContext.Provider>
//   )
// }

// export const useWallet = (): Wallet => {
//   const { wallet } = useContext(WalletContext);
//   return useMemo(() => wallet, [wallet]) as Wallet;
// }


// const getAvailableChains = () => {};
// const getWalletsForChain = (chainId: number) => {};


// export const useChangeWallet = () => {
//   const { changeWallet } = useContext(WalletContext);

//   return useCallback((chainId: number) => {
//     changeWallet(chainId);    
//   }, [ changeWallet ]);

//   // return useCallback((wallet: Wallet) => {
//   //  const chainId = wallet.getChainId(); 
//   //  changeWallet(chainId);    
//   // }, [ changeWallet ]);
// }

// export default WalletContextProvider;