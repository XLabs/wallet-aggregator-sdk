## Wallet Aggregator - Aptos

Implements the base abstractions for the Aptos blockchain.

### Usage

```ts
import { AptosWallet } from "@xlabs-libs/wallet-aggregator-aptos";

const walletCore = AptosWallet.walletCoreFactory([], aptosWalletConfig, true);
const aptosWallets = walletCore.wallets.map(
  (wallet) => new AptosWallet(wallet, walletCore)
);
```
