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

export const CHAINS_TESTNET = {
    eth: 5,
    bsc: 97,
    polygon: 80001,
    avax: 43113,
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

export const CHAIN_ID_TO_NAME: ChainIdToName = Object.entries(CHAINS).reduce(
    (obj, [name, id]) => {
        obj[id] = name;
        return obj;
    },
    {} as any
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
export const CHAIN_ID_WORMCHAIN = CHAINS["wormchain"];

const EVM_CHAINS_MAINNET: ChainId[] = [
    CHAINS['ethereum'],
    CHAINS['bsc'],
    CHAINS['avalanche'],
    CHAINS['polygon'],
    CHAINS['oasis'],
    CHAINS['aurora'],
    CHAINS['fantom'],
    CHAINS['karura'],
    CHAINS['acala'],
    CHAINS['klaytn'],
    CHAINS['celo'],
    CHAINS['moonbeam'],
    CHAINS['neon'],
    CHAINS['arbitrum'],
    CHAINS['optimism'],
    CHAINS['gnosis']
];

const EVM_CHAINS_TESTNET: number[] = [
    CHAINS_TESTNET['eth'],
    CHAINS_TESTNET['bsc'],
    CHAINS_TESTNET['polygon'],
    CHAINS_TESTNET['avax'],
    CHAINS_TESTNET['oasis'],
    CHAINS_TESTNET['aurora'],
    CHAINS_TESTNET['fantom'],
    CHAINS_TESTNET['karura'],
    CHAINS_TESTNET['acala'],
    CHAINS_TESTNET['klaytn'],
    CHAINS_TESTNET['celo'],
    CHAINS_TESTNET['neon'],
    CHAINS_TESTNET['arbitrum']
];

export function isEVMChain(chainId: ChainId): boolean {
    return EVM_CHAINS_MAINNET.includes(chainId) ||
        EVM_CHAINS_TESTNET.includes(chainId);
}
