import { Wallet as WalletType } from "@injectivelabs/wallet-ts";
import { WalletState } from "@xlabs-libs/wallet-aggregator-core";
import { InjectiveWallet } from "./injective";
import { ConcreteWalletConfig } from "./types";

export class CosmostationWallet extends InjectiveWallet {
  constructor(config: ConcreteWalletConfig) {
    super({
      ...config,
      type: WalletType.Cosmostation,
      disabledWallets: [WalletType.WalletConnect],
    });
  }

  getName(): string {
    return "Cosmostation";
  }

  getUrl(): string {
    return "https://www.cosmostation.io/";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE2NSIgdmlld0JveD0iMCAwIDE4MCAxNjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02MC44NTQ3IDEzMi42OTlMMjYuNzM4MSA3My42MDUyQzI1LjAwOTIgNzAuNjEwNCAyNS4wMDkyIDY2LjkwNTQgMjYuNzM4MSA2My45MTA2TDYwLjg1NDcgNC44NDczM0M2Mi41ODM3IDEuODUyNDggNjUuNzk0NiAwIDY5LjI1MjYgMEgxMzcuNDg2QzE0MC45NDQgMCAxNDQuMTU1IDEuODUyNDggMTQ1Ljg4NCA0Ljg0NzMzTDE4MCA2My45NDE1TDE2My4yMzUgNzMuNjM2MUwxMzEuODY2IDE5LjM4OTNINzQuODFMNDYuMjgxOCA2OC43ODg4TDc3LjU4ODggMTIzLjAzNkw2MC44MjM4IDEzMi43M0w2MC44NTQ3IDEzMi42OTlaIiBmaWxsPSIjOUM2Q0ZGIi8+CjxwYXRoIGQ9Ik0xMTAuNzE3IDE2NC44MDlINDIuNTE0NEMzOS4wNTY1IDE2NC44MDkgMzUuODQ1NSAxNjIuOTU3IDM0LjExNjUgMTU5Ljk2MkwwIDEwMC44NjhMMTYuNzY1IDkxLjE3MzJMNDguMDcxOSAxNDUuNDJIMTA1LjA5N0wxMzMuNjI2IDk2LjAyMDZMMTAyLjMxOSA0MS43NzM4TDExOS4wODQgMzIuMDc5MUwxNTMuMiA5MS4xNzMyQzE1NC45MjkgOTQuMTY4MSAxNTQuOTI5IDk3Ljg3MyAxNTMuMiAxMDAuODY4TDExOS4wODQgMTU5Ljk2MkMxMTcuMzU1IDE2Mi45NTcgMTE0LjE0NCAxNjQuODA5IDExMC42ODYgMTY0LjgwOUgxMTAuNzE3WiIgZmlsbD0iIzA1RDJERCIvPgo8L3N2Zz4K";
  }

  getWalletState(): WalletState {
    return typeof window.cosmostation !== "undefined"
      ? WalletState.Installed
      : WalletState.NotDetected;
  }
}
