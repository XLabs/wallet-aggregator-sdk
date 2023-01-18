import { ChainId, ChainName, CHAINS, CHAIN_ID_TO_NAME, Network } from "@xlabs-libs/wallet-aggregator-core";

export const CHAINS_EVM_TESTNET = {
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

const EVM_CHAINS_MAINNET: { [key in EVMChainName]: EVMChainId } = {
  ethereum: CHAINS['ethereum'],
  bsc: CHAINS['bsc'],
  avalanche: CHAINS['avalanche'],
  polygon: CHAINS['polygon'],
  oasis: CHAINS['oasis'],
  aurora: CHAINS['aurora'],
  fantom: CHAINS['fantom'],
  karura: CHAINS['karura'],
  acala: CHAINS['acala'],
  klaytn: CHAINS['klaytn'],
  celo: CHAINS['celo'],
  moonbeam: CHAINS['moonbeam'],
  neon: CHAINS['neon'],
  arbitrum: CHAINS['arbitrum'],
  optimism: CHAINS['optimism'],
  gnosis: CHAINS['gnosis']
};

const EVM_CHAINS_TESTNET = {
  ethereum: CHAINS_EVM_TESTNET['ethereum'],
  bsc: CHAINS_EVM_TESTNET['bsc'],
  avalanche: CHAINS_EVM_TESTNET['avalanche'],
  polygon: CHAINS_EVM_TESTNET['polygon'],
  oasis: CHAINS_EVM_TESTNET['oasis'],
  aurora: CHAINS_EVM_TESTNET['aurora'],
  fantom: CHAINS_EVM_TESTNET['fantom'],
  karura: CHAINS_EVM_TESTNET['karura'],
  acala: CHAINS_EVM_TESTNET['acala'],
  klaytn: CHAINS_EVM_TESTNET['klaytn'],
  celo: CHAINS_EVM_TESTNET['celo'],
  neon: CHAINS_EVM_TESTNET['neon'],
  arbitrum: CHAINS_EVM_TESTNET['arbitrum']
};

export function isEVMChain(chainId: number): boolean {
  return Object.values(EVM_CHAINS_MAINNET).includes(chainId as any) ||
      Object.values(EVM_CHAINS_TESTNET).includes(chainId as any);
}


export const EVM_TESTNET_CHAIN_ID_TO_NAME: { [key: number]: ChainName } =
  Object.entries(CHAINS_EVM_TESTNET).reduce(
    (obj, [name, id]) => {
        obj[id] = name;
        return obj;
    },
    {} as any
  );

export function evmChainIdToChainId(evmChainId: number, network: Network = "MAINNET"): ChainId {
  let chainName;

  if (network === "MAINNET") chainName = CHAIN_ID_TO_NAME[evmChainId as EVMChainId];
  if (network === "TESTNET") chainName = EVM_TESTNET_CHAIN_ID_TO_NAME[evmChainId as EVMChainId];

  if (chainName === undefined) throw new Error(`No chain found for evm chain id ${evmChainId}`)
  return CHAINS[chainName]
}

export function isTestnetEvm(chainId: number): boolean {
  return Object.values(EVM_CHAINS_TESTNET).includes(chainId as any);
}
