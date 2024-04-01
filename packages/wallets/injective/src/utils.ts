import {
  ExplorerTransaction,
  IndexerRestExplorerApi,
} from "@injectivelabs/sdk-ts";
import {
  getNetworkEndpoints,
  Network as NetworkInj,
} from "@injectivelabs/networks";
import { Network } from "@xlabs-libs/wallet-aggregator-core";

export const getTx = async (
  hash: string,
  network: Network = "MAINNET"
): Promise<ExplorerTransaction> => {
  const currentNetwork =
    network === "MAINNET" ? NetworkInj.Mainnet : NetworkInj.Testnet;
  const endpoints = getNetworkEndpoints(currentNetwork);
  const indexerRestExplorerApi = new IndexerRestExplorerApi(
    `${endpoints.explorer}/api/explorer/v1`
  );

  const transaction = await indexerRestExplorerApi.fetchTransaction(hash);

  return transaction;
};
