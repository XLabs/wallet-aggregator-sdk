## Wallet Aggregator - React Init

A utility package to bootstrap the react context with all available wallets

### Usage

```tsx
import { CHAINS } from "wallet-aggregator-core";
import { WalletContextProvider } from 'wallet-aggregator-react';
import { initWallets } from 'wallet-aggregator-react-init';

const Main = () => {
  const wallets = initWallets();

  return (
    <WalletContextProvider availableWallets={wallets}>
      <App />
    </WalletContextProvider>
  );
};
```
