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

export type ChainName = keyof typeof CHAINS;

export type ChainId = typeof CHAINS[ChainName];

export function isEVMChain(chainId: ChainId): boolean {
    return (
        chainId === CHAINS['ethereum'] ||
        chainId === CHAINS['bsc'] ||
        chainId === CHAINS['avalanche'] ||
        chainId === CHAINS['polygon'] ||
        chainId === CHAINS['oasis'] ||
        chainId === CHAINS['aurora'] ||
        chainId === CHAINS['fantom'] ||
        chainId === CHAINS['karura'] ||
        chainId === CHAINS['acala'] ||
        chainId === CHAINS['klaytn'] ||
        chainId === CHAINS['celo'] ||
        chainId === CHAINS['moonbeam'] ||
        chainId === CHAINS['neon'] ||
        chainId === CHAINS['arbitrum'] ||
        chainId === CHAINS['optimism'] ||
        chainId === CHAINS['gnosis']
    );
}
