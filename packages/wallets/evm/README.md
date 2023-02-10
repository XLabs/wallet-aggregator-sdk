## Wallet Aggregator - EVM

Implements the base abstractions for EVM-compatible blockchains.

Wallets implemented so far:

| Wallet | Link |
| - | - |
| Metamask | https://metamask.io |
| WalletConnect | https://walletconnect.com |
| Coinbase Wallet | https://www.coinbase.com/wallet |
| Ledger Connect | https://www.ledger.com |

### Usage

The base EVMWallet configuration allows for the following parameters:

 * `chainParameters`: a map of chain parameters as defined in [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085), used when the provider can't connect to a given chain.
 * `preferredChain`: an EVM chain id (e.g. 5 for Görli, 43113 for Avalanche Fuji Testnet, etc.). When connecting, the wallet will try to switch to this chain if the provider's network's chain id differs.
 * `autoSwitch`: indicates whether the wallet should attempt to switch the network back to the `preferredChain` upon detecting a `chainChanged` event (if set).

```ts
import {
    EVMWeb3Wallet,
    EVMWalletConnectWallet,
    CoinbaseWallet,
    LedgerWallet
} from "@xlabs-libs/wallet-aggregator-evm";

const metamask = new EVMWeb3Wallet({
    preferredChain: 5,
    autoSwitch: true
});
const walletConnect = new EVMWalletConnectWallet({
    preferredChain: 43113
});
const coinbase = new CoinbaseWallet({
    options: {
        reloadOnDisconnect: false,
        appName: 'My App'
    }
});
const ledger = new LedgerWallet();
```
