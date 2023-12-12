import {
  Wallet as StandardWallet,
  Wallets,
  getWallets as getSuiWallets,
} from "@mysten/wallet-standard";
import { SuiWallet } from "./sui";
import { SuiClientOptions } from "@mysten/sui.js/client";

const WALLET_DETECT_TIMEOUT = 250;

interface GetReadyWalletsOptions {
  /** SUI client */
  clientOptions?: SuiClientOptions;
}
interface GetWalletsOptions extends GetReadyWalletsOptions {
  timeout?: number;
}

const supportsSui = (wallet: StandardWallet): boolean => {
  const { features } = wallet;

  return Object.entries(features).some(([featureName]) =>
    featureName.startsWith("sui:")
  );
};

/**
 * Retrieve already detected wallets that support SUI
 * @param options
 * @returns An array of SuiWallet instances
 */
export const getReadyWallets = (
  options: GetReadyWalletsOptions = {}
): SuiWallet[] => {
  const wallets: Wallets = getSuiWallets();
  return wallets
    .get()
    .filter(supportsSui)
    .map((w: StandardWallet) => new SuiWallet(w, options.clientOptions));
};

/**
 * Wait for wallets to be detected until a timeout and return them
 * @param options
 * @returns An array of SuiWallet instances
 */
export const getWallets = async (
  options: GetWalletsOptions = {}
): Promise<SuiWallet[]> => {
  const { timeout = WALLET_DETECT_TIMEOUT, clientOptions } = options;
  const detector: Wallets = getSuiWallets();

  const wallets: StandardWallet[] = [...detector.get()];
  return new Promise((resolve) => {
    let removeListener: (() => void) | undefined = undefined;

    const createResolutionTimeout = () =>
      setTimeout(() => {
        if (removeListener) removeListener();
        resolve(
          wallets
            .filter(supportsSui)
            .map((w) => new SuiWallet(w, clientOptions))
        );
      }, timeout);

    let resolution = createResolutionTimeout();

    removeListener = detector.on("register", (wallet: StandardWallet) => {
      wallets.push(wallet);
      clearTimeout(resolution);
      resolution = createResolutionTimeout();
    });
  });
};
