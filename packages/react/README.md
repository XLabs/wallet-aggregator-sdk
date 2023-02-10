## Wallet Aggregator - React

A library to help integrate the sdk to a react project.

### Usage

The library supplies a `WaletContextProvider` which will hold information related to the available wallets and selected wallets, as well as the [hooks](#hooks) needed to access and configure. While the context holds a "main" or "default" wallet which belongs to a single chain, it allows to keep track of wallets from multiple chains at the same time.

Wrap the application in the `WalletContextProvider` component. The provider expects a prop `wallets` which is either a map of `Wallet` arrays indexed by chain id or a function which builds such map.

Using a map:

```tsx
import { CHAIN_ID_ALGORAND, CHAIN_ID_ETH, CHAIN_ID_SOME_CHAIN } from "@xlabs/wallet-aggregator-core";
import { MyAlgoWallet } from "@xlabs/wallet-aggregator-algorand";
import { EVMWeb3Wallet, EVMWalletConnectWallet } from "@xlabs/wallet-aggregator-algorand";
import { SomeWallet } from "@xlabs/wallet-aggregator-some-chain";
import { WalletContextProvider } from '@xlabs/wallet-aggregator-react';

type AvailableWalletsMap = Partial<Record<ChainId, Wallet[]>>;

const Main = () => {
  const wallets: AvailableWalletsMap = {
    [CHAIN_ID_ALGORAND]: [
      new MyAlgoWallet()
    ],
    [CHAIN_ID_ETH]: [
      new EVMWeb3Wallet(),
      new EVMWalletConnectWallet()
    ]
  }

  return (
    <WalletContextProvider wallets={wallets}>
      <App />
    </WalletContextProvider>
  );
};
```

Using a function:


```tsx
import { CHAIN_ID_ALGORAND, CHAIN_ID_ETH, CHAIN_ID_SOME_CHAIN } from "@xlabs/wallet-aggregator-core";
import { MyAlgoWallet } from "@xlabs/wallet-aggregator-algorand";
import { EVMWeb3Wallet, EVMWalletConnectWallet } from "@xlabs/wallet-aggregator-algorand";
import { SomeWallet } from "@xlabs/wallet-aggregator-some-chain";
import { WalletContextProvider } from '@xlabs/wallet-aggregator-react';

type AvailableWalletsMap = Partial<Record<ChainId, Wallet[]>>;

const Main = () => {
  const walletsBuilder = (): Promise<AvailableWalletsMap> => {
    const someChainParams = await fetchSomeChainParams();

    return {
      [CHAIN_ID_ALGORAND]: [
        new MyAlgoWallet()
      ],
      [CHAIN_ID_ETH]: [
        new EVMWeb3Wallet(),
        new EVMWalletConnectWallet()
      ],
      [CHAIN_ID_SOME_CHAIN]: [
        new SomeWallet(someChainParams)
      ]
    }
  }

  return (
    <WalletContextProvider wallets={walletsBuilder}>
      <App />
    </WalletContextProvider>
  );
};
```

### Hooks

A set of react hooks are supplied. These are:

```ts
// Retrieve the current wallet, returns undefined if not set
const wallet: Wallet | undefined = useWallet();

// Retrieve the wallet from a given chain, returns undefined if not set
const walletFromChain: Wallet | undefined = useWalletFromChain(chainId);
// Retrieve all available wallets for a given chain
const walletsForChain = useWalletsForChain(chainId);

// Retrieve all available Wallets
const allWallets: AvailableWalletsMap = useAvailableWallets();

// Retrieve all available chains
const chains: ChainId[] = useAvailableChains();

// Returns a function used to set the current wallet
const changeWallet = useChangeWallet();
const wallet: Wallet = new MyWallet();
changeWallet(wallet);

// Returns a function used to unset the wallet from a given chain
// If the removed wallet is the "default" or "current" wallet, it
// selects the next available wallet to be the new default
const unsetWalletFromChain = useUnsetWalletFromChain();
unsetWalletFromChain(chainId);
```
