## Wallet Aggregator - Aptos

Implements the base abstractions for the Aptos blockchain.

The package leverages `@manahippo/aptos-wallet-adapter`, which already provides an abstraction over the wallets in the aptos ecosystem. The `AptosWallet` class functions as a wrapper over it.

### Usage

```ts
import {
  MartianWalletAdapter,
  NightlyWalletAdapter,
} from "@manahippo/aptos-wallet-adapter";
import { AptosWallet } from "@xlabs-libs/wallet-aggregator-aptos";

const martian = new AptosWallet(new MartianWalletAdapter());

const aptosWallets: AptosWallet[] = [
  new MartianWalletAdapter(),
  new NightlyWalletAdapter(),
].map((adapter) => new AptosWallet(adapter));
```
