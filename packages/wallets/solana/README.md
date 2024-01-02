## Wallet Aggregator - Solana

Implements the base abstractions for the Solana blockchain.

The package leverages on `@solana/wallet-adapter-base`, which already provides an abstraction over wallets from the solana ecosystem. The `SolanaWallet` class functions as a wrapper over it.

### Usage

```ts
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import {
  getSolanaStandardWallets,
  SolanaWallet,
} from "@xlabs-libs/wallet-aggregator-solana";

const cluster = "mainnet";
const url = clusterApiUrl("mainnet-beta");

const connection = new Connection(url);

const martian = new SolanaWallet(new PhantomWalletAdapter(), connection);

// get those wallets that support the wallet standard
const standardWallets = getSolanaStandardWallets(connection);

// create wallets using the adapters
const adapterWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
].map((adapter) => new SolanaWallet(adapter, connection));

const solanaWallets: SolanaWallet[] = [...standardWallets, ...adapters];
```
