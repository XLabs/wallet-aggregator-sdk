// From: https://github.com/wormhole-foundation/wormhole/blob/dev.v2/sdk/js/src/utils/consts.ts#L1
export const CHAINS = {
  unset: 0,
  solana: 1,
  ethereum: 2,
  terra: 3,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  oasis: 7,
  algorand: 8,
  aurora: 9,
  fantom: 10,
  karura: 11,
  acala: 12,
  klaytn: 13,
  celo: 14,
  near: 15,
  moonbeam: 16,
  neon: 17,
  terra2: 18,
  injective: 19,
  osmosis: 20,
  sui: 21,
  aptos: 22,
  arbitrum: 23,
  optimism: 24,
  gnosis: 25,
  pythnet: 26,
  xpla: 28,
  btc: 29,
  base: 30,
  sei: 32,
  rootstock: 33, //
  scroll: 34,
  mantle: 35,
  blast: 36,
  xlayer: 37,
  linea: 38,
  berachain: 39,
  seievm: 40,
  unichain: 44,
  worldchain: 45,
  monad: 48,
  wormchain: 3104,
  cosmoshub: 4000,
  evmos: 4001,
  kujira: 4002,
  neutron: 4003,
  celestia: 4004,
  stargaze: 4005,
  seda: 4006,
  dymension: 4007,
  provenance: 4008,
  sepolia: 10002,
  arbitrum_sepolia: 10003,
  base_sepolia: 10004,
  optimism_sepolia: 10005,
  holesky: 10006,
  polygon_sepolia: 10007,
} as const;

export type ChainName = keyof typeof CHAINS;

export type ChainId = (typeof CHAINS)[ChainName];

export type ChainIdToName = {
  -readonly [key in keyof typeof CHAINS as (typeof CHAINS)[key]]: key;
};

export const CHAIN_ID_TO_NAME: ChainIdToName = Object.entries(CHAINS).reduce(
  (obj, [name, id]) => {
    obj[id] = name; // eslint-disable-line
    return obj; // eslint-disable-line
  },
  {} as any // eslint-disable-line
) as ChainIdToName;

export const CHAIN_ID_UNSET = CHAINS["unset"];
export const CHAIN_ID_SOLANA = CHAINS["solana"];
export const CHAIN_ID_ETH = CHAINS["ethereum"];
export const CHAIN_ID_TERRA = CHAINS["terra"];
export const CHAIN_ID_BSC = CHAINS["bsc"];
export const CHAIN_ID_POLYGON = CHAINS["polygon"];
export const CHAIN_ID_AVAX = CHAINS["avalanche"];
export const CHAIN_ID_OASIS = CHAINS["oasis"];
export const CHAIN_ID_ALGORAND = CHAINS["algorand"];
export const CHAIN_ID_AURORA = CHAINS["aurora"];
export const CHAIN_ID_FANTOM = CHAINS["fantom"];
export const CHAIN_ID_KARURA = CHAINS["karura"];
export const CHAIN_ID_ACALA = CHAINS["acala"];
export const CHAIN_ID_KLAYTN = CHAINS["klaytn"];
export const CHAIN_ID_CELO = CHAINS["celo"];
export const CHAIN_ID_NEAR = CHAINS["near"];
export const CHAIN_ID_MOONBEAM = CHAINS["moonbeam"];
export const CHAIN_ID_NEON = CHAINS["neon"];
export const CHAIN_ID_TERRA2 = CHAINS["terra2"];
export const CHAIN_ID_INJECTIVE = CHAINS["injective"];
export const CHAIN_ID_OSMOSIS = CHAINS["osmosis"];
export const CHAIN_ID_SUI = CHAINS["sui"];
export const CHAIN_ID_APTOS = CHAINS["aptos"];
export const CHAIN_ID_ARBITRUM = CHAINS["arbitrum"];
export const CHAIN_ID_OPTIMISM = CHAINS["optimism"];
export const CHAIN_ID_GNOSIS = CHAINS["gnosis"];
export const CHAIN_ID_PYTHNET = CHAINS["pythnet"];
export const CHAIN_ID_XPLA = CHAINS["xpla"];
export const CHAIN_ID_BTC = CHAINS["btc"];
export const CHAIN_ID_BASE = CHAINS["base"];
export const CHAIN_ID_SEI = CHAINS["sei"];
export const CHAIN_ID_ROOTSTOCK = CHAINS["rootstock"];
export const CHAIN_ID_SCROLL = CHAINS["scroll"];
export const CHAIN_ID_MANTLE = CHAINS["mantle"];
export const CHAIN_ID_BLAST = CHAINS["blast"];
export const CHAIN_ID_XLAYER = CHAINS["xlayer"];
export const CHAIN_ID_WORLDCHAIN = CHAINS["worldchain"];
export const CHAIN_ID_LINEA = CHAINS["linea"];
export const CHAIN_ID_BERACHAIN = CHAINS["berachain"];
export const CHAIN_ID_SEIEVM = CHAINS["seievm"];
export const CHAIN_ID_WORMCHAIN = CHAINS["wormchain"];
export const CHAIN_ID_COSMOSHUB = CHAINS["cosmoshub"];
export const CHAIN_ID_EVMOS = CHAINS["evmos"];
export const CHAIN_ID_KUJIRA = CHAINS["kujira"];
export const CHAIN_ID_NEUTRON = CHAINS["neutron"];
export const CHAIN_ID_CELESTIA = CHAINS["celestia"];
export const CHAIN_ID_STARGAZE = CHAINS["stargaze"];
export const CHAIN_ID_SEDA = CHAINS["seda"];
export const CHAIN_ID_DYMENSION = CHAINS["dymension"];
export const CHAIN_ID_PROVENANCE = CHAINS["provenance"];
export const CHAIN_ID_SEPOLIA = CHAINS["sepolia"];
export const CHAIN_ID_ARBITRUM_SEPOLIA = CHAINS["arbitrum_sepolia"];
export const CHAIN_ID_BASE_SEPOLIA = CHAINS["base_sepolia"];
export const CHAIN_ID_OPTIMISM_SEPOLIA = CHAINS["optimism_sepolia"];
export const CHAIN_ID_HOLESKY = CHAINS["holesky"];
export const CHAIN_ID_POLYGON_SEPOLIA = CHAINS["polygon_sepolia"];
export const CHAIN_ID_UNICHAIN = CHAINS["unichain"];
export const CHAIN_ID_MONAD = CHAINS["monad"];

export type Network = "MAINNET" | "TESTNET" | "DEVNET";

export function isChain(chain: number | string): chain is ChainId | ChainName {
  if (typeof chain === "number") {
    return chain in CHAIN_ID_TO_NAME;
  } else {
    return chain in CHAINS;
  }
}

export function toChainId(chainName: ChainName): ChainId {
  return CHAINS[chainName];
}

export function toChainName(chainId: ChainId): ChainName {
  return CHAIN_ID_TO_NAME[chainId];
}

export function coalesceChainId(chain: ChainId | ChainName): ChainId {
  return typeof chain === "number" && isChain(chain) ? chain : toChainId(chain);
}

export function coalesceChainName(chain: ChainId | ChainName): ChainName {
  return toChainName(coalesceChainId(chain));
}

export function isEVMChain(chainId: ChainId): boolean {
  return (
    chainId === CHAIN_ID_ETH ||
    chainId === CHAIN_ID_BSC ||
    chainId === CHAIN_ID_AVAX ||
    chainId === CHAIN_ID_POLYGON ||
    chainId === CHAIN_ID_OASIS ||
    chainId === CHAIN_ID_AURORA ||
    chainId === CHAIN_ID_FANTOM ||
    chainId === CHAIN_ID_KARURA ||
    chainId === CHAIN_ID_ACALA ||
    chainId === CHAIN_ID_KLAYTN ||
    chainId === CHAIN_ID_CELO ||
    chainId === CHAIN_ID_MOONBEAM ||
    chainId === CHAIN_ID_NEON ||
    chainId === CHAIN_ID_ARBITRUM ||
    chainId === CHAIN_ID_OPTIMISM ||
    chainId === CHAIN_ID_GNOSIS ||
    chainId === CHAIN_ID_BASE ||
    chainId === CHAIN_ID_SCROLL ||
    chainId === CHAIN_ID_WORLDCHAIN ||
    chainId === CHAIN_ID_BLAST ||
    chainId === CHAIN_ID_XLAYER ||
    chainId === CHAIN_ID_MANTLE ||
    chainId === CHAIN_ID_UNICHAIN ||
    chainId === CHAIN_ID_MONAD
  );
}

export function isCosmWasmChain(chainId: ChainId): boolean {
  return (
    chainId === CHAIN_ID_TERRA ||
    chainId === CHAIN_ID_TERRA2 ||
    chainId === CHAIN_ID_INJECTIVE ||
    chainId === CHAIN_ID_XPLA ||
    chainId === CHAIN_ID_SEI ||
    chainId === CHAIN_ID_WORMCHAIN ||
    chainId === CHAIN_ID_COSMOSHUB ||
    chainId === CHAIN_ID_EVMOS ||
    chainId === CHAIN_ID_KUJIRA
  );
}

export function isTerraChain(chainId: ChainId): boolean {
  return chainId === CHAIN_ID_TERRA || chainId === CHAIN_ID_TERRA2;
}
