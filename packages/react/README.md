## Wallet Aggregator - React

A library to help integrate the sdk to a react project.

### Usage

The library supplies a `WaletContextProvider` which will hold information related to the available wallets and selected wallets, as well as the [hooks](#hooks) needed to access and configure. While the context holds a "main" or "default" wallet which belongs to a single chain, it is made to keep track of wallets from multiple chains at the same time.

In order to use it, wrap the application in the context component and pass the wallets which will be available for the app to use.

```tsx
import { CHAINS } from "@xlabs/wallet-aggregator-core";
import { WalletContextProvider } from '@xlabs/wallet-aggregator-react';

const Main = () => {
  const wallets = {
    [CHAINS['algorand']]: [new AlgorandWallet()],
    [CHAINS['ethereum']]: [new EthereumWeb3Wallet(), new EthereumWalletConnectWallet()],
  }

  return (
    <WalletContextProvider availableWallets={wallets}>
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

type AvailableWalletsMap = { [key: number]: Wallet[] }
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
