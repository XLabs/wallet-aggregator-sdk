## Wallet Aggregator - NEAR

Implements the base abstractions for the [Near](https://near.org/) blockchain.

### Usage

Under the hood the wallet uses the `WalletSelector` from `@near-wallet-selector/core`, through the `@near-wallet-selector/modal-ui`. Upon calling `connect`, the wallet will create a modal and prompt the user to login through it.

```ts
import { NearWallet } from "@xlabs-libs/wallet-aggregator-near";
import { setupDefaultWallets } from "@near-wallet-selector/default-wallets";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import "@near-wallet-selector/modal-ui/styles.css";

const contractId = 'contract.dapp.near';

const config = {
    networkId: "mainnet",
    keyStore: nearKeyStore,
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.mainnet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    headers: {},
}

new NearWallet({
    config,
    contractId,
    modules: [
        ...(await setupDefaultWallets()),
        setupMyNearWallet(),
        setupNightly(),
        setupMeteorWallet(),
    ]
})
```
