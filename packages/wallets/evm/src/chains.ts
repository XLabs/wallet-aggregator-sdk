import * as CHAINS from "@wagmi/core/chains";
import { Chain } from "@wagmi/core/chains";

export * from "@wagmi/core/chains";

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

// https://docs.blast.io/building/network-information
export const blast = {
  id: 81457,
  name: "Blast Mainnet",
  network: "blast-mainnet",
  nativeCurrency: { name: "Blast Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.blast.io"] },
    public: { http: ["	https://rpc.blast.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blast",
      url: "https://blastscan.io",
    },
  },
} as const satisfies Chain;

export const blastSepolia = {
  id: 168587773,
  name: "Blast Sepolia",
  network: "blast-repolia",
  nativeCurrency: { name: "Blast Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.blast.io"] },
    public: { http: ["https://sepolia.blast.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blast Sepolia Explorer",
      url: "https://sepolia.blastexplorer.io",
    },
  },
} as const satisfies Chain;

export const scroll = {
  id: 534_352,
  name: "Scroll",
  network: "scroll",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/scroll"],
    },
    public: {
      http: ["https://rpc.ankr.com/scroll"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scrollscan",
      url: "https://scrollscan.com",
    },
  },
} as const satisfies Chain;

export const scrollSepolia = {
  id: 534_351,
  name: "Scroll Sepolia",
  network: "scroll-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/scroll_sepolia_testnet"],
    },
    public: {
      http: ["https://rpc.ankr.com/scroll_sepolia_testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scrollscan",
      url: "https://sepolia.scrollscan.com",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const xlayer = {
  id: 37,
  name: "X Layer",
  network: "xlayer-mainnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.xlayer.tech"],
    },
    public: {
      http: ["https://rpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "X Layer Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer",
    },
  },
} as const satisfies Chain;

export const xlayerTestnet = {
  id: 195,
  name: "X Layer Testnet",
  network: "xlayer-testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://xlayertestrpc.okx.com/"],
    },
    public: {
      http: ["https://xlayertestrpc.okx.com/"],
    },
  },
  blockExplorers: {
    default: {
      name: "X Layer Testnet Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer-test",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const DEFAULT_CHAINS: Chain[] = [
  ...Object.values(CHAINS),
  acala,
  acalaTestnet,
  blast,
  blastSepolia,
  emerald,
  emeraldTestnet,
  karura,
  karuraTestnet,
  scroll,
  scrollSepolia,
  xlayer,
  xlayerTestnet,
];
