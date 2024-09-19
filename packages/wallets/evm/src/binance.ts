import WalletConnectProvider from "@binance/w3w-ethereum-provider";
import { getWagmiConnector } from "@binance/w3w-wagmi-connector";
import { EVMWallet, EVMWalletConfig, EVMWalletType } from "./evm";

const BinanceWalletConnector: ReturnType<typeof getWagmiConnector> =
  getWagmiConnector();

type WalletConnectOptions = ConstructorParameters<
  typeof WalletConnectProvider
>[0];

export interface BinanceWalletConfig
  extends EVMWalletConfig<WalletConnectOptions> {
  /** Binance Wallet SDK Options */
  options: WalletConnectOptions;
}

export class BinanceWallet extends EVMWallet<
  InstanceType<typeof BinanceWalletConnector>,
  WalletConnectOptions
> {
  constructor(config: BinanceWalletConfig) {
    super(config);
  }

  protected createConnector(): InstanceType<typeof BinanceWalletConnector> {
    return new BinanceWalletConnector({
      chains: this.chains,
      options: this.connectorOptions,
    });
  }

  getName(): string {
    return "Binance Web3 Wallet";
  }

  getUrl(): string {
    return "https://www.binance.com/web3wallet";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IllvdXJfZGVzaWduIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiDQoJIHk9IjBweCIgd2lkdGg9IjEyNi42MTFweCIgaGVpZ2h0PSIxMjYuNjExcHgiIHZpZXdCb3g9IjAgMCAxMjYuNjExIDEyNi42MTEiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDEyNi42MTEgMTI2LjYxMSINCgkgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cG9seWdvbiBmaWxsPSIjRjNCQTJGIiBwb2ludHM9IjM4LjE3MSw1My4yMDMgNjIuNzU5LDI4LjYxNiA4Ny4zNiw1My4yMTYgMTAxLjY2NywzOC45MDkgNjIuNzU5LDAgMjMuODY0LDM4Ljg5NiAiLz4NCjxyZWN0IHg9IjMuNjQ0IiB5PSI1My4xODgiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MSAwLjcwNzEgLTAuNzA3MSAwLjcwNzEgNDguNzkzMyA4LjgxMDYpIiBmaWxsPSIjRjNCQTJGIiB3aWR0aD0iMjAuMjMzIiBoZWlnaHQ9IjIwLjIzNCIvPg0KPHBvbHlnb24gZmlsbD0iI0YzQkEyRiIgcG9pbnRzPSIzOC4xNzEsNzMuNDA4IDYyLjc1OSw5Ny45OTUgODcuMzU5LDczLjM5NiAxMDEuNjc0LDg3LjY5NSAxMDEuNjY3LDg3LjcwMyA2Mi43NTksMTI2LjYxMSANCgkyMy44NjMsODcuNzE2IDIzLjg0Myw4Ny42OTYgIi8+DQo8cmVjdCB4PSIxMDEuNjQiIHk9IjUzLjE4OSIgdHJhbnNmb3JtPSJtYXRyaXgoLTAuNzA3MSAwLjcwNzEgLTAuNzA3MSAtMC43MDcxIDIzNS41NDU3IDI5LjA1MDMpIiBmaWxsPSIjRjNCQTJGIiB3aWR0aD0iMjAuMjM0IiBoZWlnaHQ9IjIwLjIzMyIvPg0KPHBvbHlnb24gZmlsbD0iI0YzQkEyRiIgcG9pbnRzPSI3Ny4yNzEsNjMuMjk4IDc3LjI3Nyw2My4yOTggNjIuNzU5LDQ4Ljc4IDUyLjAzLDU5LjUwOSA1Mi4wMjksNTkuNTA5IDUwLjc5Nyw2MC43NDIgNDguMjU0LDYzLjI4NSANCgk0OC4yNTQsNjMuMjg1IDQ4LjIzNCw2My4zMDUgNDguMjU0LDYzLjMyNiA2Mi43NTksNzcuODMxIDc3LjI3Nyw2My4zMTMgNzcuMjg0LDYzLjMwNSAiLz4NCjwvc3ZnPg0K";
  }

  static getWalletType(): EVMWalletType {
    return EVMWalletType.Binance;
  }
}
