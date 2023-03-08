import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_TERRA2,
  isEVMChain,
  isTerraChain,
  Wallet,
} from "@xlabs-libs/wallet-aggregator-core";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AvailableWalletsMap = Partial<Record<ChainId, Wallet[]>>;
export type AvailableWalletsMapBuilderFn = () => Promise<AvailableWalletsMap>;
export type WalletMap = Partial<Record<ChainId, Wallet | undefined>>;

interface IWalletContext {
  wallets: WalletMap;
  defaultWallet?: Wallet | undefined;
  availableWallets: AvailableWalletsMap;
  changeWallet: (newWallet: Wallet) => void;
  unsetWalletFromChain: (chainId: ChainId) => void;
  coalesceChainId: (chainId: ChainId) => ChainId;
}

export const WalletContext = createContext<IWalletContext>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  changeWallet: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unsetWalletFromChain: () => {},
  availableWallets: {},
  wallets: {},
  coalesceChainId: (chainId: ChainId) => chainId,
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
  /**
   * Aggregate all Terra chains into a single one, indexed by the Terra2 chain id. Enabled by default.
   */
  coalesceTerraChains?: boolean;
}

export const WalletContextProvider = ({
  wallets: configureWallets,
  children,
  coalesceEvmChains = true,
  coalesceTerraChains = true,
}: React.PropsWithChildren<IWalletContextProviderProps>) => {
  const [wallets, setWallets] = useState<WalletMap>({});
  const [availableWallets, setAvailableWallets] = useState<AvailableWalletsMap>(
    {}
  );
  const [defaultWallet, setDefaultWallet] = useState<Wallet | undefined>();

  const coalesceChainId = useCallback(
    (chainId: ChainId) => {
      if (coalesceEvmChains && isEVMChain(chainId)) {
        return CHAIN_ID_ETH;
      }

      if (coalesceTerraChains && isTerraChain(chainId)) {
        return CHAIN_ID_TERRA2;
      }

      return chainId;
    },
    [coalesceEvmChains, coalesceTerraChains]
  );

  useEffect(() => {
    const initWallets = async () => {
      const available =
        typeof configureWallets === "function"
          ? await configureWallets()
          : configureWallets;

      setAvailableWallets(available);
    };

    // TODO: maybe handle init errors by providing a flag/message to child components
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    initWallets();
  }, [configureWallets]);

  const changeWallet = useCallback(
    (newWallet: Wallet) => {
      if (!newWallet) throw new Error("Invalid wallet");

      const chainId = coalesceChainId(newWallet.getChainId());

      setDefaultWallet(newWallet);
      setWallets({
        ...wallets,
        [chainId]: newWallet,
      });
    },
    [wallets]
  );

  const unsetWalletFromChain = useCallback(
    (chainId: ChainId) => {
      chainId = coalesceChainId(chainId);

      const { [chainId]: removedWallet, ...otherWallets } = wallets;

      const newWalletMap: WalletMap = otherWallets || {};
      setWallets(newWalletMap);

      if (
        defaultWallet &&
        defaultWallet.getName() === removedWallet?.getName()
      ) {
        const potentialDefaults = Object.values(newWalletMap);
        setDefaultWallet(
          potentialDefaults.length ? potentialDefaults[0] : undefined
        );
      }
    },
    [wallets, defaultWallet]
  );

  const value = useMemo(
    () => ({
      wallets,
      defaultWallet,
      availableWallets,
      changeWallet,
      unsetWalletFromChain,
      coalesceChainId,
    }),
    [
      wallets,
      defaultWallet,
      availableWallets,
      unsetWalletFromChain,
      coalesceChainId,
    ]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWalletContext = (): IWalletContext => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error(
      "No WalletContext found. Make sure you have properly set up the WalletContextProvider"
    );
  }

  return context;
};
