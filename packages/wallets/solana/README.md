## Wallet Aggregator - Solana

Implements the base abstractions for the Solana blockchain.

This package leverages on the existing abstractions provided by the Solana wallet adapter wallet [packages](https://github.com/solana-labs/wallet-adapter/tree/master/packages/wallets). In order to use this wallet simply create an instance of it providing an `Adapter` as defined in the [@solana/wallet-adapter-base](https://github.com/solana-labs/wallet-adapter/tree/master/packages/core/base) package:

```ts
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { SolanaWallet } from "@xlabs/wallet-aggregator-solana";

const adapter = new SolflareWalletAdapter();
const wallet = new SolanaWallet(adapter);
```
