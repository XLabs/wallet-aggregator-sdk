# Wallet Aggregator SDK

A library to transparently interact with multiple blockchains

`pnpm` is used to manage the project. To install, simply clone the repo and run:

#### Setup

```bash
$ pnpm install
```

#### Building

```bash
$ pnpm run build
```

### Packages

For more information, check each package README:

| Package                                                            | Description                                              |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| [@xlabs/wallet-aggregator-core](./packages/wallets/core)           | Base package. Provides the core Wallet abstractions      |
| [@xlabs/wallet-aggregator-react](./packages/react)                 | React Context component & hooks to interact with wallets |
| [@xlabs/wallet-aggregator-algorand](./packages/wallets/algorand)   | Wallet implementation for Algorand                       |
| [@xlabs/wallet-aggregator-aptos](./packages/wallets/aptos)         | Wallet implementation for Aptos                          |
| [@xlabs/wallet-aggregator-evm](./packages/wallets/evm)             | Wallet implementation for EVM chains                     |
| [@xlabs/wallet-aggregator-injective](./packages/wallets/injective) | Wallet implementation for Injective                      |
| [@xlabs/wallet-aggregator-near](./packages/wallets/near)           | Wallet implementation for Near                           |
| [@xlabs/wallet-aggregator-solana](./packages/wallets/solana)       | Wallet implementation for Solana                         |
| [@xlabs/wallet-aggregator-xpla](./packages/wallets/xpla)           | Wallet implementation for XPLA                           |
| [@xlabs/wallet-aggregator-terra](./packages/wallets/terra)         | Wallet implementation for Terra                          |
