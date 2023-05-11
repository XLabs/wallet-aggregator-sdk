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

  async connect(): Promise<string[]> {
    const accounts = await super.connect();

    // hacky fix: when no preferred chain is set, the provider will not configure an http/rpc endpoint
    // only when changing the network, it'll detect it through the networkChanged event and configure
    // it accordingly
    if (this.network?.chainId) {
      // @eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const innerProvider = (await this.connector.getProvider()) as any;
      // @eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      innerProvider.http = innerProvider.setHttpProvider(this.network.chainId);
    }

    return accounts;
  }
}
