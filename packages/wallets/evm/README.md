## Wallet Aggregator - EVM

Implements the base abstractions for EVM-compatible blockchains, using [wagmi](https://github.com/wagmi-dev/wagmi) under the hood to handle connection implementations.

Wallets implemented so far:

| Wallet                        | Link                            |
| ----------------------------- | ------------------------------- |
| Injected wallets (e.g: Brave) |                                 |
| Metamask                      | https://metamask.io             |
| WalletConnect                 | https://walletconnect.com       |
| Bitget Wallet                 | https://web3.bitget.com         |
| Coinbase Wallet               | https://www.coinbase.com/wallet |
| Ledger Connect                | https://www.ledger.com          |

### Usage

The base EVMWallet configuration allows for the following parameters:

- `chains`: an array of chain information objects. While the information is the same as in the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085}, the structure is slightly different. Defaults to all chains.
- `preferredChain`: an EVM chain id (e.g. 5 for Görli, 43113 for Avalanche Fuji Testnet, etc.). When connecting, the wallet will try to switch to this chain if the provider's network's chain id differs.
- `autoSwitch`: indicates whether the wallet should attempt to switch the network back to the `preferredChain` upon detecting a `chainChanged` event (if set).
- `confirmations`: Amount of confirmations/blocks to wait a transaction for

Additionally, each specific wallet has its own specific options.

```ts
import {
  MetamaskWallet,
  WalletConnectWallet,
  BitgetWallet,
  CoinbaseWallet,
  LedgerWallet,
  InjectedWallet,
} from "@xlabs-libs/wallet-aggregator-evm";

const injected = new InjectedWallet();
const metamask = new MetamaskWallet({
  preferredChain: 5,
  autoSwitch: true,
});
const walletConnect = new WalletConnectWallet({
  preferredChain: 43113,
});
const bitgetWallet = new BitgetWallet({
  options: {
    appName: "My App",
  },
});
const coinbase = new CoinbaseWallet({
  options: {
    reloadOnDisconnect: false,
    appName: "My App",
  },
});
const ledger = new LedgerWallet();
```
