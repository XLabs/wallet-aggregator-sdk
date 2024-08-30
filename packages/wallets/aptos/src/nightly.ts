import {
  AptosWalletErrorResult,
  NetworkName,
  PluginProvider,
} from "@aptos-labs/wallet-adapter-core";
import type {
  AccountInfo,
  AdapterPlugin,
  Network,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  WalletName,
} from "@aptos-labs/wallet-adapter-core";
import { TxnBuilderTypes, Types } from "aptos";
import { AptosPublicKey } from "./aptos_public_key";
interface AptosNightly {
  publicKey: AptosPublicKey;
  onAccountChange: (pubKey?: string) => void;
  connect(
    onDisconnect?: () => void,
    eagerConnect?: boolean
  ): Promise<AptosPublicKey>;
  disconnect(): Promise<void>;
  signTransaction: (
    transaction: TxnBuilderTypes.TransactionPayload | Types.TransactionPayload,
    submit: boolean
  ) => Promise<Uint8Array | Types.PendingTransaction>;
  signAllTransactions: (
    transaction: TxnBuilderTypes.TransactionPayload[]
  ) => Promise<Uint8Array[]>;
  signMessage(msg: string): Promise<Uint8Array>;
  network(): Promise<{ api: string; chainId: number; network: string }>;
}
interface NightlyWindow extends Window {
  nightly?: {
    aptos: AptosNightly;
  };
}

// CHANGE AptosWindow
interface AptosWindow extends Window {
  aptos?: PluginProvider; // CHANGE aptos key (has to be lowercase exact match and same as the wallet's name prop)
}

declare const window: NightlyWindow; // CHANGE AptosWindow

export const NightlyWalletName = "Nightly" as WalletName<"Nightly">; // CHANGE AptosWalletName, CHANGE "Aptos"

// CHANGE AptosWallet
export class NightlyWallet implements AdapterPlugin {
  readonly name = NightlyWalletName; // CHANGE AptosWalletName (can have capitalization)
  readonly url = // CHANGE url value
    "https://chrome.google.com/webstore/detail/nightly/fiikommddbeccaoicoejoniammnalkfa";
  readonly icon =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAxIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMSAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wLjM5MDYyNSAxMDBDMC4zOTA2MjUgNDQuNzcxNSA0NS4xNjIyIDAgMTAwLjM5MSAwQzE1NS42MTkgMCAyMDAuMzkxIDQ0Ljc3MTUgMjAwLjM5MSAxMDBDMjAwLjM5MSAxNTUuMjI4IDE1NS42MTkgMjAwIDEwMC4zOTEgMjAwQzQ1LjE2MjIgMjAwIDAuMzkwNjI1IDE1NS4yMjggMC4zOTA2MjUgMTAwWiIgZmlsbD0iIzYwNjdGOSIvPgo8cGF0aCBkPSJNMTQ2LjgzOCA0MEMxMzguMDU0IDUyLjI2MDcgMTI3LjA2MSA2MC43NjM0IDExNC4wNzIgNjYuNDQ3NEMxMDkuNTYzIDY1LjIwMjYgMTA0LjkzNiA2NC41Njg0IDEwMC4zNzkgNjQuNjE1NEM5NS44MjIzIDY0LjU2ODQgOTEuMTk1MSA2NS4yMjYxIDg2LjY4NTUgNjYuNDQ3NEM3My42OTY2IDYwLjczOTkgNjIuNzA0MiA1Mi4yODQyIDUzLjkxOTggNDBDNTEuMjY1NiA0Ni42NzA2IDQxLjA0ODMgNjkuNjg4OCA1My4zMDkxIDEwMS44NjdDNTMuMzA5MSAxMDEuODY3IDQ5LjM4NjYgMTE4LjY2MSA1Ni41OTc0IDEzMy4wODNDNTYuNTk3NCAxMzMuMDgzIDY3LjAyNiAxMjguMzYyIDc1LjMxNzMgMTM1LjAwOUM4My45ODQzIDE0Mi4wMzIgODEuMjEyOCAxNDguNzk2IDg3LjMxOTYgMTU0LjYyMUM5Mi41ODA5IDE2MCAxMDAuNDAyIDE2MCAxMDAuNDAyIDE2MEMxMDAuNDAyIDE2MCAxMDguMjI0IDE2MCAxMTMuNDg1IDE1NC42NDVDMTE5LjU5MiAxNDguODQzIDExNi44NDQgMTQyLjA3OSAxMjUuNDg4IDEzNS4wMzJDMTMzLjc1NSAxMjguMzg1IDE0NC4yMDcgMTMzLjEwNiAxNDQuMjA3IDEzMy4xMDZDMTUxLjM5NSAxMTguNjg1IDE0Ny40OTYgMTAxLjg5MSAxNDcuNDk2IDEwMS44OTFDMTU5LjcxIDY5LjY4ODggMTQ5LjUxNiA0Ni42NzA2IDE0Ni44MzggNDBaTTU5LjgzODcgOTcuNDI4MUM1My4xNjgxIDgzLjczNDYgNTEuMzM2MSA2NC45NDQyIDU1LjU0MDQgNTAuMDk5OEM2MS4xMDcxIDY0LjE5MjYgNjguNjcwMiA3MC41MTA5IDc3LjY2NjEgNzcuMTgxNEM3My44NjEgODUuMDk2OSA2Ni42OTcyIDkyLjU2NjEgNTkuODM4NyA5Ny40MjgxWk03OS4wMjg0IDEyMS41NUM3My43NjcxIDExOS4yMjUgNzIuNjYzMSAxMTQuNjQ1IDcyLjY2MzEgMTE0LjY0NUM3OS44MjcgMTEwLjEzNSA5MC4zNzMxIDExMy41ODggOTAuNzAxOSAxMjQuMjUxQzg1LjE1ODcgMTIwLjg5MyA4My4zMDMyIDEyMy40MDYgNzkuMDI4NCAxMjEuNTVaTTEwMC4zNzkgMTU5LjQxM0M5Ni42MjA5IDE1OS40MTMgOTMuNTY3NCAxNTYuNzEyIDkzLjU2NzQgMTUzLjRDOTMuNTY3NCAxNTAuMDg4IDk2LjYyMDkgMTQ3LjM4NyAxMDAuMzc5IDE0Ny4zODdDMTA0LjEzNyAxNDcuMzg3IDEwNy4xOSAxNTAuMDg4IDEwNy4xOSAxNTMuNEMxMDcuMTkgMTU2LjczNSAxMDQuMTM3IDE1OS40MTMgMTAwLjM3OSAxNTkuNDEzWk0xMjEuNzUzIDEyMS41NUMxMTcuNDc4IDEyMy40MjkgMTE1LjY0NiAxMjAuODkzIDExMC4wNzkgMTI0LjI1MUMxMTAuNDMyIDExMy41ODggMTIwLjkzMSAxMTAuMTM1IDEyOC4xMTggMTE0LjY0NUMxMjguMTE4IDExNC42MjEgMTI2Ljk5MSAxMTkuMjI1IDEyMS43NTMgMTIxLjU1Wk0xNDAuOTE5IDk3LjQyODFDMTM0LjA4NCA5Mi41NjYxIDEyNi44OTcgODUuMTIwNCAxMjMuMDY4IDc3LjE4MTRDMTMyLjA2NCA3MC41MTA5IDEzOS42NTEgNjQuMTY5MSAxNDUuMTk0IDUwLjA5OThDMTQ5LjQ0NSA2NC45NDQyIDE0Ny42MTMgODMuNzU4MSAxNDAuOTE5IDk3LjQyODFaIiBmaWxsPSIjRjdGN0Y3Ii8+Cjwvc3ZnPgo=";

  // An optional property for wallets which may have different wallet name with window property name.
  // such as window.aptosWallet and wallet name is Aptos.
  // If your wallet name prop is different than the window property name use the window property name here and comment out line 37

  readonly providerName = "nightly";

  provider: AptosNightly | undefined =
    typeof window !== "undefined" ? window.nightly?.aptos : undefined; // CHANGE window.aptos
  /**
   * An optional property for wallets that supports mobile app.
   * By providing the `deeplinkProvider` prop, the adapter will redirect the user
   * from a mobile web browser to the wallet's mobile app on `connect`.
   *
   * `url` param is given by the provider and represents the current website url the user is on.
   */

  // deeplinkProvider(data: { url: string }): string {
  //   return `aptos://explore?url=${data.url}`;
  // }

  async connect(): Promise<AccountInfo> {
    try {
      const accountInfo = await this.provider?.connect();
      if (!accountInfo) throw `${NightlyWalletName} Address Info Error`;
      return {
        address: accountInfo.address(),
        publicKey: accountInfo.asString(),
      };
    } catch (error: any) {
      throw error;
    }
  }

  async account(): Promise<AccountInfo> {
    const response = await this.provider?.publicKey;
    if (!response) throw `${NightlyWalletName} Account Error`;
    return {
      address: response.address(),
      publicKey: response.asString(),
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.provider?.disconnect();
    } catch (error: any) {
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const response = await this.provider?.signTransaction(transaction, true);
      if (response) throw `${NightlyWalletName} signAndSubmitTransaction Error`;

      return { hash: (response as unknown as Uint8Array).toString() };
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  // async signAndSubmitBCSTransaction(
  //   transaction: TxnBuilderTypes.TransactionPayload,
  //   options?: any
  // ): Promise<{ hash: Types.HexEncodedBytes }> {
  //   try {
  //     const response = await this.provider?.signTransaction(
  //       transaction,
  //       true
  //       // options
  //     );
  //     if ((response as AptosWalletErrorResult).code) {
  //       throw new Error((response as AptosWalletErrorResult).message);
  //     }
  //     return response as { hash: Types.HexEncodedBytes };
  //   } catch (error: any) {
  //     const errMsg = error.message;
  //     throw errMsg;
  //   }
  // }

  async signMessage(message: SignMessagePayload): Promise<SignMessageResponse> {
    try {
      if (typeof message !== "object" || !message.nonce) {
        `${NightlyWalletName} Invalid signMessage Payload`;
      }
      // TODO: use nonce and prefix
      const response = await this.provider?.signMessage(message.message);
      if (response) {
        return {
          fullMessage: message.message,
          signature: response.toString(),
          message: message.message,
          nonce: message.nonce,
          prefix: "APTOS",
        };
      } else {
        throw `${NightlyWalletName} Sign Message failed`;
      }
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async network(): Promise<NetworkInfo> {
    try {
      const response = await this.provider?.network();
      if (!response) throw `${NightlyWalletName} Network Error`;
      return {
        name: response.network.toLocaleLowerCase() as Network,
      };
    } catch (error: any) {
      throw error;
    }
  }
  // TODO: implement this
  async onNetworkChange(callback: any): Promise<void> {
    try {
      throw "Not implemented";
    } catch (error: any) {
      const errMsg = error.message;
      throw errMsg;
    }
  }

  async onAccountChange(callback: any): Promise<void> {
    try {
      const handleAccountChange = async (
        newAccount: AccountInfo
      ): Promise<void> => {
        if (newAccount?.publicKey) {
          callback({
            publicKey: newAccount.publicKey,
            address: newAccount.address,
          });
        } else {
          const response = await this.connect();
          callback({
            address: response?.address,
            publicKey: response?.publicKey,
          });
        }
      };
      if (this.provider) {
        this.provider.onAccountChange = (pubKey) => {
          if (!pubKey) throw `${NightlyWalletName} onAccountChange Error`;
          const publicKey = AptosPublicKey.fromBase58(pubKey);
          handleAccountChange({
            address: publicKey.address(),
            publicKey: publicKey.asString(),
          });
        };
      } else {
        throw `${NightlyWalletName} onAccountChange Error`;
      }
    } catch (error: any) {
      console.log(error);
      const errMsg = error.message;
      throw errMsg;
    }
  }
}
