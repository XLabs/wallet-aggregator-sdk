## Wallet Aggregator - NEAR

Implements the base abstractions for the [Near](https://near.org/) blockchain.

### Usage

There are two methods of using this package. You may either use the `NearModalSelectorWallet` class, which under the hood the wallet uses the `@near-wallet-selector/core` and `@near-wallet-selector/modal-ui` packages. Upon calling `connect`, the wallet will create a modal and prompt the user to login through it. On the other hand, you can use the `WrappedNearWallet` which allows programatically interacting with a single wallet; a utility function `wrapWallet` is provided to help create them.

#### Using the NearModalSelectorWallet

```ts
import { NearModalSelectorWallet } from "@xlabs-libs/wallet-aggregator-near";
import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import "@near-wallet-selector/modal-ui/styles.css";

const contractId = "contract.dapp.near";

const config = {
  networkId: "mainnet",
  keyStore: nearKeyStore,
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
  headers: {},
};

const wallet = new NearModalSelectorWallet({
  config,
  contractId,
  modules: [
    ...(await setupDefaultWallets()),
    setupMyNearWallet(),
    setupNightly(),
    setupMeteorWallet(),
  ],
});

await wallet.connect();
```

#### Using the WrappedNearWallet

```ts
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import "@near-wallet-selector/modal-ui/styles.css";

const contractId = "contract.dapp.near";

const config = {
  networkId: "mainnet",
  keyStore: nearKeyStore,
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
  headers: {},
};

const meteor = await wrapWallet({
  config,
  contractId,
  factory: setupMeteorWallet(),
});
const sender = await wrapWallet({ config, contractId, factory: setupSender() });

await meteor.connect();
```
