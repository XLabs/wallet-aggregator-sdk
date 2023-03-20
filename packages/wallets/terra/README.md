## Wallet Aggregator - Terra

Implements the base abstractions for the [Terra](https://terra.money) blockchain.

### Usage

Under the hood, the TerraWallet class uses the `WalletController` class provider through `@terra-money/wallet-provider`, which itself is a façade over the different types of wallets. Wallet detection might prove tricky, since the model adopted by the library is reactive (through `rxjs`), so in order to build the wallets a `getWallets` utility function is provided. The process it detects wallets through is by hooking into an observable provided by the library, and waiting a brief time until it stops emitting the available wallets; after timing out, it returns whatever wallets were detected.

```ts
import { ConnectType } from "@terra-money/wallet-provider";
import {
  getWallets as getTerraWallets,
  TerraWallet,
} from "@xlabs-libs/wallet-aggregator-terra";

const ignoredTypes = [ConnectType.READONLY];
const wallets: TerraWallet[] = await getTerraWallets(ignoredTypes);

const wallet = wallets[0];
await wallet.connect();
```
