## Wallet Aggregator - Algorand

Implements the base abstractions for the [Algorand](https://www.algorand.com/) blockchain.

Wallets implemented so far:

| Wallet        | Link                      |
| ------------- | ------------------------- |
| MyAlgo Wallet | https://wallet.myalgo.com |
| Pera Wallet   | https://perawallet.app    |
| Defly Wallet  | https://defly.app         |
| Ledger        | https://ledger.com        |

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

### Note on Transaction signing

The Algorand wallet transaction signing interface complies with the [ARC-0001](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md). While the base cases are supported by all wallets, some of them might implement the ARC only partially (e.g: they don't support signing multisig transactions). Some features can be implemented at adapter level (i.e. in the concrete wallet classes, like skipping transaction with empty `signers` in the ledger HW wallet), but do not expect all functionalities to be there.
