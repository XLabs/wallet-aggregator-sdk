import { ChainId, CHAINS, Network } from "@xlabs-libs/wallet-aggregator-core";

export const EVM_CHAINS = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  avalanche: 43114,
  oasis: 42262,
  aurora: 1313161554,
  fantom: 250,
  karura: 686,
  acala: 787,
  klaytn: 8217,
  celo: 42220,
  neon: 245022934,
  arbitrum: 42161,
  moonbeam: 1284,
  optimism: 10,
  gnosis: 100,
  base: 8453,
  scroll: 534352,
  blast: 81457,
  xlayer: 196,
  mantle: 5000,
  worldchain: 480,
  unichain: 130,
} as const;

export const EVM_CHAINS_TESTNET = {
  ethereum: 17000,
  bsc: 97,
  polygon: 80001,
  avalanche: 43113,
  oasis: 42261,
  aurora: 1313161555,
  fantom: 4002,
  karura: 596,
  acala: 597,
  klaytn: 1001,
  celo: 44787,
  neon: 245022926,
  arbitrum: 421613,
  optimism: 420,
  moonbeam: 1287,
  base: 84531,
  scroll: 534351,
  blast: 168587773,
  xlayer: 195,
  mantle: 5001,
  worldchain: 4801,
  unichain: 1301,
  monad: 10143,
} as const;

export type EVMChainName =
  | "ethereum"
  | "bsc"
  | "polygon"
  | "avalanche"
  | "oasis"
  | "aurora"
  | "fantom"
  | "karura"
  | "acala"
  | "klaytn"
  | "celo"
  | "moonbeam"
  | "neon"
  | "arbitrum"
  | "optimism"
  | "gnosis"
  | "base"
  | "scroll"
  | "blast"
  | "xlayer"
  | "mantle"
  | "worldchain"
  | "unichain"
  | "monad";

type Indexable = string | number | symbol;

const invertMap = <K extends Indexable, V extends Indexable>(
  map: Record<K, V>
) =>
  Object.entries(map).reduce((obj, [name, id]) => {
    return Object.assign(obj, { [id as Indexable]: name });
  }, {} as Record<V, K>);

// TODO: remove "monad" when mainnet is launched
export type MainnnetEVMChainName = Exclude<EVMChainName, "monad">;

export const EVM_CHAIN_ID_TO_NAME: Record<number, MainnnetEVMChainName> =
  invertMap<MainnnetEVMChainName, number>(EVM_CHAINS);
export const EVM_TESTNET_CHAIN_ID_TO_NAME: Record<number, EVMChainName> =
  invertMap(EVM_CHAINS_TESTNET);

export function evmChainIdToChainId(
  evmChainId: number,
  network: Network = "MAINNET"
): ChainId {
  let chainName;

  if (network === "MAINNET") chainName = EVM_CHAIN_ID_TO_NAME[evmChainId];
  if (network === "TESTNET")
    chainName = EVM_TESTNET_CHAIN_ID_TO_NAME[evmChainId];

  if (chainName === undefined)
    throw new Error(`No chain found for evm chain id ${evmChainId}`);
  return CHAINS[chainName];
}

export function isTestnetEvm(chainId: number): boolean {
  const ids = Object.values(EVM_CHAINS_TESTNET) as number[];
  return ids.includes(chainId);
}
