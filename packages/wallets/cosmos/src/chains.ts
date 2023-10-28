import { ChainInfo } from "./types";

export type ChainMap = Record<string, ChainInfo>;

/**
 * Sources:
 *  - https://github.com/cosmology-tech/chain-registry/blob/main/packages/chain-registry/src/chains.ts
 *  - https://github.com/cosmos/chain-registry/blob/master/testnets
 */
export const COSMOS_CHAIN_INFOS: ChainMap = {
  "osmo-test-5": {
    chainName: "Osmosis Testnet",
    chainId: "osmo-test-5",
    bech32Config: {
      bech32PrefixAccAddr: "osmo",
      bech32PrefixAccPub: "osmopub",
      bech32PrefixValAddr: "osmovaloper",
      bech32PrefixValPub: "osmovaloperpub",
      bech32PrefixConsAddr: "osmovalcons",
      bech32PrefixConsPub: "osmovalconspub",
    },
    bip44: { coinType: 118 },
    currencies: [
      {
        coinDenom: "OSMO",
        coinMinimalDenom: "uosmo",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "OSMO",
        coinMinimalDenom: "uosmo",
        coinDecimals: 6,
        gasPriceStep: {
          low: 0.0025,
          average: 0.025,
          high: 0.04,
        },
      },
    ],
    rpc: "https://rpc.osmotest5.osmosis.zone",
    rest: "https://lcd.osmotest5.osmosis.zone",
    stakeCurrency: {
      coinDenom: "OSMO",
      coinMinimalDenom: "uosmo",
      coinDecimals: 6,
    },
  },
  "harpoon-4": {
    chainName: "Kujira Testnet",
    chainId: "harpoon-4",
    bech32Config: {
      bech32PrefixAccAddr: "kujira",
      bech32PrefixAccPub: "kujirapub",
      bech32PrefixValAddr: "kujiravaloper",
      bech32PrefixValPub: "kujiravaloperpub",
      bech32PrefixConsAddr: "kujiravalcons",
      bech32PrefixConsPub: "kujiravalconspub",
    },
    bip44: { coinType: 118 },
    currencies: [
      {
        coinDenom: "KUJI",
        coinMinimalDenom: "ukuji",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "KUJI",
        coinMinimalDenom: "ukuji",
        coinDecimals: 6,
      },
    ],
    rpc: "https://kujira-testnet-rpc.polkachu.com",
    rest: "https://kujira-testnet-api.polkachu.com",
    stakeCurrency: {
      coinDenom: "KUJI",
      coinMinimalDenom: "ukuji",
      coinDecimals: 6,
    },
  },
  "mocha-4": {
    chainName: "Celestia Testnet",
    chainId: "mocha-4",
    bech32Config: {
      bech32PrefixAccAddr: "celestia",
      bech32PrefixAccPub: "celestiapub",
      bech32PrefixValAddr: "celestiavaloper",
      bech32PrefixValPub: "celestiavaloperpub",
      bech32PrefixConsAddr: "celestiavalcons",
      bech32PrefixConsPub: "celestiavalconspub",
    },
    bip44: { coinType: 118 },
    currencies: [
      {
        coinDenom: "TIA",
        coinMinimalDenom: "utia",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "TIA",
        coinMinimalDenom: "utia",
        coinDecimals: 6,
      },
    ],
    rpc: "https://rpc.celestia-mocha.com",
    rest: "https://api.celestia-mocha.com",
    stakeCurrency: {
      coinDenom: "TIA",
      coinMinimalDenom: "utia",
      coinDecimals: 6,
    },
  },
  "evmos_9000-4": {
    chainName: "Evmos Testnet",
    chainId: "evmos_9000-4",
    bech32Config: {
      bech32PrefixAccAddr: "evmos",
      bech32PrefixAccPub: "evmospub",
      bech32PrefixValAddr: "evmosvaloper",
      bech32PrefixValPub: "evmosvaloperpub",
      bech32PrefixConsAddr: "evmosvalcons",
      bech32PrefixConsPub: "evmosvalconspub",
    },
    bip44: { coinType: 60 },
    currencies: [
      {
        coinDenom: "TEVMOS",
        coinMinimalDenom: "atevmos",
        coinDecimals: 18,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "TEVMOS",
        coinMinimalDenom: "atevmos",
        coinDecimals: 18,
        gasPriceStep: {
          low: 20000000000,
          average: 25000000000,
          high: 40000000000,
        },
      },
    ],
    rpc: "https://evmos-testnet-rpc.polkachu.com",
    rest: "https://evmos-testnet-api.polkachu.com",
    stakeCurrency: {
      coinDenom: "TEVMOS",
      coinMinimalDenom: "atevmos",
      coinDecimals: 18,
    },
  },
};
