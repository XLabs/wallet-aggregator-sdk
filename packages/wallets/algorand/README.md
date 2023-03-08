## Wallet Aggregator - Algorand

Implements the base abstractions for the [Algorand](https://www.algorand.com/) blockchain.

Wallets implemented so far:

| Wallet        | Link                      |
| ------------- | ------------------------- |
| MyAlgo Wallet | https://wallet.myalgo.com |
| Pera Wallet   | https://perawallet.app    |

### Usage

The base Algorand wallet configuration allows setting the algorand node and indexer url and credentials, as well as setting a default account. Each wallet has also its own config options.

Example:

```ts
import {
  MyAlgoWallet,
  PeraWallet,
} from "@xlabs-libs/wallet-aggregator-algorand";

const myAlgo = new MyAlgoWallet({
  node: {
    url: "https://algo.node.io",
    token: "a_token",
  },
});

const pera = new PeraWallet({
  node: {
    url: "https://algo.node.io",
    token: "a_token",
  },
  peraOptions: {
    chainId: 416002,
  },
});
```
