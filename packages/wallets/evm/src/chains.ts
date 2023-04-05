import * as CHAINS from "@wagmi/core/chains";
import { Chain } from "@wagmi/core/chains";

export * from "@wagmi/core/chains";

const karuraTestnet = {
  id: 596,
  name: "Karura Testnet",
  network: "karura-testnet",
  nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://karura-dev.aca-dev.network/eth/http"] },
    public: { http: ["https://karura-dev.aca-dev.network/eth/http"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.karura-dev.aca-dev.network",
    },
  },
} as const satisfies Chain;

const acalaTestnet = {
  id: 597,
  name: "Acala Testnet",
  network: "acala-testnet",
  nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://acala-dev.aca-dev.network/eth/http"] },
    public: { http: ["https://acala-dev.aca-dev.network/eth/http"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.acala-dev.aca-dev.network",
    },
  },
} as const satisfies Chain;

const karura = {
  id: 686,
  name: "Karura",
  network: "karura",
  nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-karura.aca-api.network"] },
    public: { http: ["https://eth-rpc-karura.aca-api.network"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.karura.network" },
  },
} as const satisfies Chain;

const acala = {
  id: 787,
  name: "Acala",
  network: "acala",
  nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-acala.aca-api.network"] },
    public: { http: ["https://eth-rpc-acala.aca-api.network"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.acala.network" },
  },
} as const satisfies Chain;

export const klaytnBaobab = {
  id: 1001,
  name: "Klaytn Testnet Baobab",
  network: "klaytn-baobab",
  nativeCurrency: { name: "Klay", symbol: "KLAY", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.baobab.klaytn.net:8651"] },
    public: { http: ["https://api.baobab.klaytn.net:8651"] },
  },
  blockExplorers: {
    default: { name: "KlaytnScope", url: "https://baobab.scope.klaytn.com" },
  },
} as const satisfies Chain;

export const emeraldTestnet = {
  id: 42261,
  name: "Emerald Paratime Testnet",
  network: "emerald-testnet",
  nativeCurrency: { name: "Emerald Rose", symbol: "ROSE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.emerald.oasis.dev"] },
    public: { http: ["https://testnet.emerald.oasis.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Oasis",
      url: "https://testnet.explorer.emerald.oasis.dev",
    },
  },
} as const satisfies Chain;

export const emerald = {
  id: 42262,
  name: "Emerald Paratime Mainnet",
  network: "emerald-testnet",
  nativeCurrency: { name: "Emerald Rose", symbol: "ROSE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://emerald.oasis.dev"] },
    public: { http: ["https://emerald.oasis.dev"] },
  },
  blockExplorers: {
    default: { name: "Oasis", url: "https://explorer.emerald.oasis.dev" },
  },
} as const satisfies Chain;

export const DEFAULT_CHAINS: Chain[] = Object.values(CHAINS).concat([
  acala,
  acalaTestnet,
  emerald,
  emeraldTestnet,
  karura,
  karuraTestnet,
  klaytnBaobab,
]);
