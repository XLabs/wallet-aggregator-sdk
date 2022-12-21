## Wallet Aggregator - Core

Basic Wallet abstractions to interact with blockchains with.

In order to use a wallet for a given chain through the sdk, simply import the Wallet class and extend from it:

```ts
import { Wallet } from "wallet-aggregator-core";

class MyBlockchainWallet extends Wallet {
  // code...
}
```

The blockchain IDs follow those of Wormhole. A [constants file](./src/constants.ts) is provided with said chain ids. Refer to Wormhole [documentation](https://docs.wormhole.com/wormhole/overview) if you wish to know more about the project.
