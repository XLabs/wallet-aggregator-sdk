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
    wormchain: 3104,
} as const;

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

export type ChainName = keyof typeof CHAINS;

export type ChainId = typeof CHAINS[ChainName];

export type ChainIdToName = {
    -readonly [key in keyof typeof CHAINS as typeof CHAINS[key]]: key;
};

const invertChainIdMap = (map: { [key: string]: number }) => Object.entries(map).reduce(
    (obj, [name, id]) => {
        obj[id] = name;
        return obj;
    },
    {} as any
)

export const CHAIN_ID_TO_NAME: ChainIdToName = invertChainIdMap(CHAINS) as ChainIdToName;

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
export const CHAIN_ID_WORMCHAIN = CHAINS["wormchain"];

export type Network = "MAINNET" | "TESTNET" | "DEVNET";

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


export const EVM_TESTNET_CHAIN_ID_TO_NAME: { [key: number]: ChainName } = invertChainIdMap(CHAINS_EVM_TESTNET);

export function evmChainIdToChainId(evmChainId: number): ChainId {
    const chainName = CHAIN_ID_TO_NAME[evmChainId as EVMChainId] || EVM_TESTNET_CHAIN_ID_TO_NAME[evmChainId]
    if (chainName === undefined) throw new Error(`No chain found for evm chain id ${evmChainId}`)
    return CHAINS[chainName]
}
