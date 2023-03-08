## Wallet Aggregator - Core

Basic Wallet abstractions to interact with blockchains.

In order to implement a wallet for a given chain through the sdk, simply import the `Wallet` class and extend from it. The abstraction defines a set of generic arguments to define the types the methods it will expect and interact with (e.g. a transaction request type, a message to sign, the result of submitting a tx to network, etc).

The `Wallet` class implements the `EventEmitter` interface, letting the client subscribe to the following events:

| Event            | Description                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `connect`        | Signals the wallet has succesfully connected                                               |
| `disconnect`     | Signals the wallet has succesfully disconnected                                            |
| `networkChanged` | Signals whether a change in the network was detected. Useful for working with EVM wallets. |

New events can be added by extending the `WalletEvents` class.

Example:

```ts
import { Wallet, WalletEvents } from "@xlabs/wallet-aggregator-core";

// define types
type MyUnsignedTransactionType = // ...
// ...
interface MyEventsType extends WalletEvents {
  // ...
}

class MyBlockchainWallet extends Wallet<
  MyUnsignedTransactionType,
  MySignedTransactionType,
  MySignedTransactionType,
  MySubmitTransactionResultType,
  MyNetworkInfoType,
  MyMessageType,
  MyMessageResultType,
  MyEventsType
> {
  // code...
}
```

The blockchain IDs follow those of Wormhole. A [constants file](./src/constants.ts) is provided with said chain ids.

Refer to the Wormhole [documentation](https://docs.wormhole.com/wormhole/overview) if you wish to know more about the project.
