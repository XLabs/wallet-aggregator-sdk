import {
  CHAIN_ID_EVMOS,
  ChainId,
  CHAINS,
  Network,
} from "@xlabs-libs/wallet-aggregator-core";

export const COSMOS_CHAINS = {
  wormchain: "wormchain",
  osmosis: "osmosis-1",
  evmos: "evmos_9001-2",
  cosmoshub: "cosmoshub-4",
  kujira: "kaiyo-1",
} as const;

export const COSMOS_CHAINS_TESTNET = {
  wormchain: "wormchain-testnet-0",
  osmosis: "osmo-test-5",
  evmos: "evmos_9000-4",
  cosmoshub: "theta-testnet-001",
  kujira: "harpoon-4",
} as const;

export type CosmosChainName =
  | "wormchain"
  | "osmosis"
  | "evmos"
  | "cosmoshub"
  | "kujira";

type Indexable = string | number | symbol;

const invertMap = <K extends Indexable, V extends Indexable>(
  map: Record<K, V>
) =>
  Object.entries(map).reduce((obj, [name, id]) => {
    return Object.assign(obj, { [id as Indexable]: name });
  }, {} as Record<V, K>);

export const COSMOS_CHAIN_ID_TO_NAME: Record<string, CosmosChainName> =
  invertMap<CosmosChainName, string>(COSMOS_CHAINS);
export const COSMOS_TESTNET_CHAIN_ID_TO_NAME: Record<string, CosmosChainName> =
  invertMap(COSMOS_CHAINS_TESTNET);

export function cosmosChainIdToChainId(
  cosmosChainId: string,
  network: Network = "MAINNET"
): ChainId {
  let chainName;

  if (network === "MAINNET") chainName = COSMOS_CHAIN_ID_TO_NAME[cosmosChainId];
  if (network === "TESTNET")
    chainName = COSMOS_TESTNET_CHAIN_ID_TO_NAME[cosmosChainId];

  if (chainName === undefined)
    throw new Error(`No chain found for cosmos chain id ${cosmosChainId}`);
  return CHAINS[chainName];
}

export function isTestnetCosmos(chainId: string): boolean {
  const ids = Object.values(COSMOS_CHAINS_TESTNET) as string[];
  return ids.includes(chainId);
}

export const ETHERMINT_CHAINS: ChainId[] = [CHAIN_ID_EVMOS];
