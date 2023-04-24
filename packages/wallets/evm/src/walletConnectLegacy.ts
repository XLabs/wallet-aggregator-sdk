import { WalletConnectLegacyConnector } from "@wagmi/core/connectors/walletConnectLegacy";
import { EVMWalletConfig } from "./evm";
import { BaseWalletConnectWallet } from "./walletConnectBase";

type WalletConnectLegacyOptions = ConstructorParameters<
  typeof WalletConnectLegacyConnector
>[0]["options"];

export type WalletConnectLegacyWalletConfig =
  EVMWalletConfig<WalletConnectLegacyOptions>;

export class WalletConnectLegacyWallet extends BaseWalletConnectWallet<
  WalletConnectLegacyConnector,
  WalletConnectLegacyOptions
> {
  constructor(config: WalletConnectLegacyWalletConfig = {}) {
    super(config);
  }

  protected createConnector(): WalletConnectLegacyConnector {
    const options = Object.assign(
      {
        storageId: "wallet-aggregator-sdk-evm-walletconnect-legacy",
      },
      this.connectorOptions
    );

    return new WalletConnectLegacyConnector({
      chains: this.chains,
      options,
    });
  }
}
