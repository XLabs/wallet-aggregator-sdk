import { InjectedConnector } from "@wagmi/core/connectors/injected";
import { Chain } from "@wagmi/core/chains";
import { getAddress } from "ethers/lib/utils.js";

import type {
  OKXWalletProvider,
  InjectedConnectorOptions,
  Address,
} from "./types";

export class OKXWalletConnector extends InjectedConnector {
  readonly id = "okxwallet";

  constructor({
    chains,
    options: options_,
  }: {
    chains?: Chain[];
    options?: InjectedConnectorOptions;
  } = {}) {
    const options = {
      name: "OKX Wallet",
      getProvider() {
        function getReady(okxwallet?: OKXWalletProvider) {
          const ok = !!okxwallet?.isOKExWallet && !!okxwallet?.isOkxWallet;
          if (!ok) return;
          return okxwallet;
        }

        if (typeof window === "undefined") return;
        return getReady(window.okxwallet);
      },
      ...options_,
    };
    super({ chains, options });
  }

  async connect({ chainId }: { chainId?: number } = {}): Promise<{
    account: `0x${string}`;
    chain: {
        id: number;
        unsupported: boolean;
    };
    provider: OKXWalletProvider;
}> {
      const provider = await this.getProvider();
      if (!provider) throw new Error("not found");

      if (provider.on) {
        provider.on("accountsChanged", this.onAccountsChanged);
        provider.on("chainChanged", this.onChainChanged);
        provider.on("disconnect", this.onDisconnect);
      }

      this.emit("message", { type: "connecting" });

      let account: Address | null = null;
      if (!account) {
        const accounts: Array<string> = await provider.request({
          method: "eth_requestAccounts",
        });
        account = getAddress(accounts[0]);
      }

      let id = await this.getChainId();
      let unsupported = this.isChainUnsupported(id);
      if (chainId && id !== chainId) {
        const chain = await this.switchChain(chainId);
        id = chain.id;
        unsupported = this.isChainUnsupported(id);
      }

      return { account, chain: { id, unsupported }, provider };
  }
}
