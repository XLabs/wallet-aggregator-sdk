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
