## Wallet Aggregator - React Init

A utility package to bootstrap the react context with all available wallets

### Usage

```tsx
import { CHAINS } from "@xlabs/wallet-aggregator-core";
import { WalletContextProvider } from '@xlabs/wallet-aggregator-react';
import { initWallets } from '@xlabs/wallet-aggregator-react-init';

const Main = () => {
  const wallets = initWallets();

  return (
    <WalletContextProvider availableWallets={wallets}>
      <App />
    </WalletContextProvider>
  );
};
```
