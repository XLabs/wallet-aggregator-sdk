import {
  AptosSnapAdapter,
  AptosWalletAdapter, BaseWalletAdapter, BitkeepWalletAdapter, FewchaWalletAdapter,
  FletchWalletAdapter,
  MartianWalletAdapter,
  NightlyWalletAdapter as AptosNightlyWalletAdapter,
  PontemWalletAdapter,
  RiseWalletAdapter,
  SpikaWalletAdapter,
  TokenPocketWalletAdapter
} from "@manahippo/aptos-wallet-adapter";
import {
  BackpackWalletAdapter, CloverWalletAdapter,
  Coin98WalletAdapter, ExodusWalletAdapter, NightlyWalletAdapter as SolanaNightlyWalletAdapter,
  PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter,
  SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter,
  TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { AlgorandWalletConfig, MyAlgoWallet } from "@xlabs-libs/wallet-aggregator-algorand";
import { AptosWallet } from "@xlabs-libs/wallet-aggregator-aptos";
import { CHAINS } from "@xlabs-libs/wallet-aggregator-core";
import { EVMWalletConnectWallet, EVMWeb3Wallet } from "@xlabs-libs/wallet-aggregator-evm";
import { AddEthereumChainParameterMap } from "@xlabs-libs/wallet-aggregator-evm/dist/types/parameters";
import { AvailableWalletsMap } from "@xlabs-libs/wallet-aggregator-react";
import { SolanaAdapter, SolanaWallet } from "@xlabs-libs/wallet-aggregator-solana";


interface InitWalletsConfig {
  solana?: {
      host?: string;
  },
  algorand?: AlgorandWalletConfig,
  evm?: {
      chainParameters?: AddEthereumChainParameterMap
  }
}

export const initWallets = (config?: InitWalletsConfig): AvailableWalletsMap => {
  const solanaAdapters: SolanaAdapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new SolanaNightlyWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new CloverWalletAdapter(),
      new Coin98WalletAdapter(),
      new SlopeWalletAdapter(),
      new SolongWalletAdapter(),
      new TorusWalletAdapter(),
      new ExodusWalletAdapter()
  ];

  const aptosAdapters: BaseWalletAdapter[] = [
      new AptosWalletAdapter(),
      new MartianWalletAdapter(),
      new RiseWalletAdapter(),
      new AptosNightlyWalletAdapter(),
      new PontemWalletAdapter(),
      new FletchWalletAdapter(),
      new FewchaWalletAdapter(),
      new SpikaWalletAdapter(),
      new AptosSnapAdapter(),
      new BitkeepWalletAdapter(),
      new TokenPocketWalletAdapter(),
      // new BloctoWalletAdapter({ bloctoAppId: '' })
  ];

  return {
      [CHAINS['algorand']]: [new MyAlgoWallet(config?.algorand)],
      [CHAINS['ethereum']]: [
          new EVMWeb3Wallet(config?.evm?.chainParameters),
          new EVMWalletConnectWallet(config?.evm?.chainParameters)
      ],
      [CHAINS['solana']]:
          solanaAdapters.map(adapter =>
              new SolanaWallet(adapter, new Connection(config?.solana?.host || clusterApiUrl("devnet")))),
      [CHAINS['aptos']]:
          aptosAdapters.map(adapter => new AptosWallet(adapter))
  };
};