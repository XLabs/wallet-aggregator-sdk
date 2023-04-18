import { Connection } from "@mysten/sui.js";
import {
  Wallet as StandardWallet,
  Wallets,
  getWallets as getSuiWallets,
} from "@mysten/wallet-standard";
import { SuiWallet } from "./sui";

const WALLET_DETECT_TIMEOUT = 250;

interface GetWalletsOptions {
  timeout?: number;
  connection?: Connection;
}

const supportsSui = (wallet: StandardWallet): boolean => {
  const { features } = wallet;

  return Object.entries(features).some(([featureName]) =>
    featureName.startsWith("sui:")
  );
};

export const getWallets = async (
  options: GetWalletsOptions = {}
): Promise<SuiWallet[]> => {
  const { timeout = WALLET_DETECT_TIMEOUT, connection } = options;
  const detector: Wallets = getSuiWallets();

  const wallets: StandardWallet[] = [...detector.get()];
  return new Promise((resolve) => {
    let removeListener: (() => void) | undefined = undefined;

    const createResolutionTimeout = () =>
      setTimeout(() => {
        if (removeListener) removeListener();
        resolve(
          wallets.filter(supportsSui).map((w) => new SuiWallet(w, connection))
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
