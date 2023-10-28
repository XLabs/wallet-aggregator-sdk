import { ExecuteInstruction } from "@cosmjs/cosmwasm-stargate";
import { EncodeObject } from "@cosmjs/proto-signing";
import { StdFee } from "@cosmjs/stargate";
import { WalletInfo } from "./wallets";

export type ResourceMap = Record<string, string>;

export interface CosmosWalletConfig {
  chainId?: string;
  rpcs?: ResourceMap;
  rests?: ResourceMap;
  walletInfo: WalletInfo;
}

export interface CosmosConnectOptions {
  chainId?: string;
}

export interface CosmosTransaction {
  msgs: EncodeObject[];
  fee: StdFee;
  memo: string;
}

export interface CosmosExecuteTransaction {
  instructions: ExecuteInstruction[];
  fee: StdFee;
  memo?: string;
}

export interface TxRaw {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  signatures: Uint8Array[];
}

export interface AccountResponse {
  account: {
    "@type": string;
    base_account: {
      address: string;
      pub_key?: {
        "@type": string;
        key: string;
      };
      account_number: string;
      sequence: string;
    };
    code_hash: string;
  };
}

/** The types defined from here downwards were retrieved from the keplr repo:
 * https://github.com/chainapsis/keplr-wallet/tree/af099a47421e4b75a34e87427510ea932dfc71c4/packages/types/src
 */

/**
 * The currency that is supported on the chain natively.
 */
export interface Currency {
  readonly coinDenom: string;
  readonly coinMinimalDenom: string;
  readonly coinDecimals: number;
  /**
   * This is used to fetch asset's fiat value from coingecko.
   * You can get id from https://api.coingecko.com/api/v3/coins/list.
   */
  readonly coinGeckoId?: string;
  readonly coinImageUrl?: string;
}

/**
 * The currency that is supported on the cosmwasm.
 * This should be the CW-20 that confirms the standard.
 * And, in this case, `coinMinimalDenom` must start with the type and contract address of currency such as "cw20:coral1vv6hruqu...3sfhwh:ukeplr".
 */
export interface CW20Currency extends Currency {
  readonly type: "cw20";
  readonly contractAddress: string;
}

export interface Secret20Currency extends Currency {
  readonly type: "secret20";
  readonly contractAddress: string;
  readonly viewingKey: string;
}

/**
 * IBCCurrency is the currency that is sent from the other chain via IBC.
 * This will be handled as similar to the native currency.
 * But, this has more information abounr IBC channel and paths.
 */
export interface IBCCurrency extends Currency {
  readonly paths: {
    portId: string;
    channelId: string;

    counterpartyChannelId?: string;
    counterpartyPortId?: string;
    clientChainId?: string;
  }[];
  /**
   * The chain id that the currency is from.
   * If that chain is unknown, this will be undefined.
   */
  readonly originChainId: string | undefined;
  readonly originCurrency:
    | Currency
    | CW20Currency
    | Secret20Currency
    | undefined;
}

/**
 * Any type of currency that Kepler applications can support.
 */
export type AppCurrency =
  | Currency
  | CW20Currency
  | Secret20Currency
  | IBCCurrency;

export interface FiatCurrency {
  readonly currency: string;
  readonly symbol: string;
  readonly maxDecimals: number;
  readonly locale: string;
}

export type WithGasPriceStep<T> = T & {
  /**
   * This is used to set the fee of the transaction.
   * If this field is empty, it just use the default gas price step (low: 0.01, average: 0.025, high: 0.04).
   */
  readonly gasPriceStep?: {
    readonly low: number;
    readonly average: number;
    readonly high: number;
  };
};

export type FeeCurrency = WithGasPriceStep<AppCurrency>;

export interface BIP44 {
  readonly coinType: number;
}

export interface Bech32Config {
  readonly bech32PrefixAccAddr: string;
  readonly bech32PrefixAccPub: string;
  readonly bech32PrefixValAddr: string;
  readonly bech32PrefixValPub: string;
  readonly bech32PrefixConsAddr: string;
  readonly bech32PrefixConsPub: string;
}

export interface ChainInfo {
  readonly rpc: string;
  readonly rest: string;
  readonly chainId: string;
  readonly chainName: string;
  /**
   * This indicates the type of coin that can be used for stake.
   * You can get actual currency information from Currencies.
   */
  readonly stakeCurrency: Currency;
  readonly walletUrlForStaking?: string;
  readonly bip44: {
    coinType: number;
  };
  readonly alternativeBIP44s?: BIP44[];
  readonly bech32Config: Bech32Config;

  readonly currencies: AppCurrency[];
  /**
   * This indicates which coin or token can be used for fee to send transaction.
   * You can get actual currency information from Currencies.
   */
  readonly feeCurrencies: FeeCurrency[];

  /**
   * Indicate the features supported by this chain. Ex) cosmwasm, secretwasm ...
   */
  readonly features?: string[];
}
