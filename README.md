# Wallet Aggregator SDK

A library to transparently interact with multiple blockchains

`pnpm` is used to manage the project. To install, simply clone the repo and run:

```bash
$ pnpm install
```

For more information, check each package README:

| Package | Description |
| - | - |
| [@xlabs/wallet-aggregator-core](./packages/wallets/core) | Base package. Provides the Wallet abstractions. |
| [@xlabs/wallet-aggregator-evm](./packages/wallets/evm) | Wallet implementation for EVM chains |
| [@xlabs/wallet-aggregator-algorand](./packages/wallets/algorand) | Wallet implementation for algorand |
| [@xlabs/wallet-aggregator-solana](./packages/wallets/solana) | Wallet implementation for solana |
| [@xlabs/wallet-aggregator-react](./packages/react) | React Context component & hooks to interact with the wallets |
