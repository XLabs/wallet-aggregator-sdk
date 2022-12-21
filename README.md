# Wallet Aggregator SDK

A library to transparently interact with multiple blockchains

`pnpm` is used to manage the project. To install, simply clone the repo and run:

```bash
$ pnpm install
```

For more information, check each package README:

| Package | Description |
| - | - |
| [wallet-aggregator-core](./packages/wallets/core/README.md) | Base package. Provides the Wallet abstractions. |
| [wallet-aggregator-evm](./packages/wallets/evm/README.md) | Wallet implementation for EVM chains |
| [wallet-aggregator-algorand](./packages/wallets/algorand/README.md) | Wallet implementation for algorand |
| [wallet-aggregator-solana](./packages/wallets/solana/README.md) | Wallet implementation for solana |
| [wallet-aggregator-react](./packages/react/README.md) | React Context component & hooks to interact with the wallets |
