import { isWalletAdapterCompatibleStandardWallet } from "@solana/wallet-adapter-base";
import { StandardWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base";
import { Connection } from "@solana/web3.js";
import { getWallets } from "@wallet-standard/app";
import { SolanaWallet } from "./solana";

/**
 * Detect wallets that are compatible with the standard wallet interface
 *
 * @returns A list of SolanaWallet instances
 */
export function getSolanaStandardWallets(
  connection: Connection
): SolanaWallet[] {
  // from https://github.com/solana-labs/wallet-standard/blob/c68c26604e0b9624e924292e243df44c742d1c00/packages/wallet-adapter/react/src/useStandardWalletAdapters.ts#L78
  return getWallets()
    .get()
    .filter(isWalletAdapterCompatibleStandardWallet)
    .map(
      (wallet) =>
        new SolanaWallet(new StandardWalletAdapter({ wallet }), connection)
    );
}
