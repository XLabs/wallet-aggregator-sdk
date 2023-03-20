## Wallet Aggregator - Xpla

Implements the base abstractions for the [Xpla](https://xpla.io) blockchain.

### Usage

Under the hood, the XplaWallet class uses the `WalletController` class provider through `@xpla/wallet-provider`, which itself is a façade over the different types of wallets. Wallet detection might prove tricky, since the model adopted by the library is reactive (through `rxjs`), so in order to build the wallets a `getWallets` utility function is provided. The process it detects wallets through is by hooking into an observable provided by the library, and waiting a brief time until it stops emitting the available wallets; after timing out, it returns whatever wallets were detected.

```ts
import { ConnectType } from "@xpla-money/wallet-provider";
import {
  getWallets as getXplaWallets,
  XplaWallet,
} from "@xlabs-libs/wallet-aggregator-xpla";

const ignoredTypes = [ConnectType.READONLY];
const wallets: XplaWallet[] = await getXplaWallets(ignoredTypes);

const wallet = wallets[0];
await wallet.connect();
```
