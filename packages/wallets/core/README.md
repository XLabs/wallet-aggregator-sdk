## Wallet Aggregator - Core

Basic Wallet abstractions to interact with blockchains.

In order to implement a wallet for a given chain through the sdk, simply import the Wallet class and extend from it:

```ts
import { Wallet } from "@xlabs/wallet-aggregator-core";

class MyBlockchainWallet extends Wallet {
  // code...
}
```

The blockchain IDs follow those of Wormhole. A [constants file](./src/constants.ts) is provided with said chain ids.

Refer to the Wormhole [documentation](https://docs.wormhole.com/wormhole/overview) if you wish to know more about the project.
