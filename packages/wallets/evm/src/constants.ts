import { ChainId, ChainName, CHAINS, CHAIN_ID_TO_NAME, Network } from "@xlabs-libs/wallet-aggregator-core";

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
  gnosis: 100
} as Record<EVMChainName, number>;

export const EVM_CHAINS_TESTNET = {
  ethereum: 5,
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
  arbitrum: 421613
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
  | "gnosis";

export type EVMChainId = typeof CHAINS[EVMChainName]

export function isEVMChain(chainId: number): boolean {
  return Object.values(EVM_CHAINS).includes(chainId as any) ||
      Object.values(EVM_CHAINS_TESTNET).includes(chainId as any);
}

const invertMap = (map: Record<string, number>) =>
  Object.entries(map).reduce(
    (obj, [name, id]) => {
        obj[id] = name;
        return obj;
    },
    {} as any
  );

export const EVM_CHAIN_ID_TO_NAME: { [key: number]: ChainName } = invertMap(EVM_CHAINS);
export const EVM_TESTNET_CHAIN_ID_TO_NAME: { [key: number]: ChainName } = invertMap(EVM_CHAINS_TESTNET);

export function evmChainIdToChainId(evmChainId: number, network: Network = "MAINNET"): ChainId {
  let chainName;

  if (network === "MAINNET") chainName = EVM_CHAIN_ID_TO_NAME[evmChainId as EVMChainId];
  if (network === "TESTNET") chainName = EVM_TESTNET_CHAIN_ID_TO_NAME[evmChainId as EVMChainId];

  if (chainName === undefined) throw new Error(`No chain found for evm chain id ${evmChainId}`)
  return CHAINS[chainName]
}

export function isTestnetEvm(chainId: number): boolean {
  return Object.values(EVM_CHAINS_TESTNET).includes(chainId as any);
}
