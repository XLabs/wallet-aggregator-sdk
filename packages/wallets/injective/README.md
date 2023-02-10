## Wallet Aggregator - Injective

Implements the base abstractions for the Injective blockchain.

### Usage

Under the hood the wallet relies on the `WalletSelector` class provided by the `@injectivelabs/wallet-ts` package, which acts as a façade with multiple strategies behind it, one for each method of connecting. So, while the generic class is `InjectiveWallet`, we inject the type of wallet we want to connect to through a constructor parameter.

For now, the only supported types are Keplr and Cosmostation.

```ts
import { ChainId as InjectiveChainId } from "@injectivelabs/ts-types";
import { getNetworkInfo, Network } from "@injectivelabs/networks";
import { InjectiveWallet } from "@xlabs-libs/wallet-aggregator-injective";

const network = InjectiveChainId.Mainnet;
const networkInfo = getNetworkInfo(Network.MainnetK8s);

const opts = {
    networkChainId: network,
    broadcasterOptions: {
        network,
        endpoints: {
            indexerApi: networkInfo.indexerApi,
            sentryGrpcApi: networkInfo.sentryGrpcApi,
            sentryHttpApi: networkInfo.sentryHttpApi,
        }
    }
}

const keplr = new InjectiveWallet({
    ...opts,
    type: InjectiveWalletType.Keplr
})
const cosmostation = new InjectiveWallet({
    ...opts,
    type: InjectiveWalletType.Cosmostation
})
```
