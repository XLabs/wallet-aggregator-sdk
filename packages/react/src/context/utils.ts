import { ChainId, CHAINS, isEVMChain } from "wallet-aggregator-core";


// utility function to coalesce evm chains into a single id
export function getChainId(chainId: ChainId): ChainId {
    return isEVMChain(chainId) ? CHAINS['ethereum'] : chainId;
}
