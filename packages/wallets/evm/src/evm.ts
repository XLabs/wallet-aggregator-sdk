import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import {
  Client,
  configureChains,
  Connector,
  ConnectorData,
  createClient,
  ProviderRpcError,
  Provider,
  WebSocketProvider,
  RpcError,
} from "@wagmi/core";
import { Chain, DEFAULT_CHAINS } from "./chains";
import { publicProvider } from "@wagmi/core/providers/public";
import {
  Address,
  ChainId,
  CHAIN_ID_ETH,
  NotConnected,
  NotSupported,
  SendTransactionResult,
  Signature,
  Wallet,
  WalletEvents,
  WalletState,
} from "@xlabs-libs/wallet-aggregator-core";
import { ethers, utils } from "ethers";
import { evmChainIdToChainId, isTestnetEvm } from "./constants";

type EVMChainId = number;

interface EVMWalletEvents extends WalletEvents {
  accountsChanged(address: Address): void;
}

// See:
// - https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
// - https://docs.metamask.io/guide/rpc-api.html#returns-7
enum ERROR_CODES {
  USER_REJECTED = 4001,
  CHAIN_NOT_ADDED = 4902,
}

/** EVMWallet config options */
export interface EVMWalletConfig<COpts = any> {
  /**
   * An array of evm chain config objects as defined by wagmi's Chain type.
   * While the information is the same as in the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085}, the structure is slightly different
   * Defaults to all chains
   */
  chains?: Chain[];
  /**
   * An EVM chain id. When connecting, the wallet will try to switch to this chain if the provider network's chain id differs.
   */
  preferredChain?: EVMChainId;
  /**
   * Indicates whether the wallet should attempt to switch the network back to the preferredChain upon detecting a `chainChanged` event.
   */
  autoSwitch?: boolean;
  /**
   * Amount of confirmations/blocks to wait a transaction for
   */
  confirmations?: number;
  /**
   * Options specific to the connection method
   */
  connectorOptions?: COpts;
}

export type EthereumMessage = string | ethers.utils.Bytes;

export interface EVMNetworkInfo {
  /** Network EVM chain id */
  chainId: number;
}

class SwitchChainError extends Error {
  public readonly code: number;

  constructor(message: string, code: number, stack?: string) {
    super(message);
    this.code = code;
    this.stack = stack;
  }
}

/**
 * An abstraction over EVM compatible blockchain wallets
 */
export abstract class EVMWallet<
  C extends Connector = Connector,
  COpts = any
> extends Wallet<
  TransactionRequest,
  TransactionRequest,
  TransactionReceipt,
  EVMNetworkInfo,
  EthereumMessage,
  Signature,
  EVMWalletEvents
> {
  protected chains: Chain[];
  protected connector: C;
  protected connectorOptions: COpts;
  protected preferredChain?: EVMChainId;

  private addresses: Address[] = [];
  private address?: Address;
  private network?: EVMNetworkInfo;
  private autoSwitch: boolean;
  private confirmations?: number;
  private client?: Client<Provider, WebSocketProvider>;
  private provider?: ethers.providers.Web3Provider;
  private switchingChain = false;

  constructor({
    chains,
    confirmations,
    preferredChain,
    autoSwitch = false,
    connectorOptions,
  }: EVMWalletConfig<COpts> = {}) {
    super();
    this.chains = chains || DEFAULT_CHAINS;
    this.preferredChain = preferredChain;
    this.autoSwitch = autoSwitch;
    this.confirmations = confirmations;
    this.connectorOptions = connectorOptions || ({} as COpts);

    // create here so that injected wallets can be detected before connecting
    this.connector = this.createConnector();
  }

  async connect(): Promise<Address[]> {
    const { provider } = configureChains(this.chains, [publicProvider()]);

    this.client = createClient<Provider, WebSocketProvider>({
      provider,
      autoConnect: false,
      connectors: [this.connector],
    });

    await this.connector.connect({ chainId: this.preferredChain });

    this.provider = new ethers.providers.Web3Provider(
      (await this.connector.getProvider()) as ethers.providers.ExternalProvider,
      "any"
    );

    this.connector.on("change", this.onChange.bind(this));
    this.connector.on("disconnect", this.onDisconnect.bind(this));

    this.network = await this.fetchNetworkInfo();
    this.address = await this.connector.getAccount();
    this.addresses = [this.address];

    this.emit("connect");

    return this.addresses;
  }

  protected abstract createConnector(): C;

  private async enforcePrefferedChain(): Promise<void> {
    if (!this.preferredChain) return;
    if (!this.connector.switchChain) throw new NotSupported();

    let currentChain = this.getNetworkInfo()?.chainId;
    while (currentChain !== this.preferredChain) {
      try {
        await this.connector.switchChain(this.preferredChain);
        currentChain = this.getNetworkInfo()?.chainId;
      } catch (error) {
        const { code } = error as ProviderRpcError;
        // ignore user rejections
        if (code === ERROR_CODES.USER_REJECTED) {
          return;
        }
        throw error;
      }
    }
  }

  private async onChange(data: ConnectorData) {
    if (data.chain) await this.onChainChanged();
    if (data.account) await this.onAccountsChanged([data.account]);
  }

  /**
   * @description Change the preferred evm chain. Calling this method will automatically trigger a switch to the new chain request.
   *
   * @param chainId The new evm chain id
   */
  public async setPrefferedChain(chainId: EVMChainId): Promise<void> {
    this.preferredChain = chainId;
    await this.enforcePrefferedChain();
  }

  isConnected(): boolean {
    return !!this.provider;
  }

  async disconnect(): Promise<void> {
    await this.connector?.disconnect();
    await this.onDisconnect();
  }

  getChainId(): ChainId {
    if (!this.isConnected() || !this.network) return CHAIN_ID_ETH;

    const evmChainId = this.network.chainId;

    const network = isTestnetEvm(evmChainId) ? "TESTNET" : "MAINNET";
    return evmChainIdToChainId(evmChainId, network);
  }

  getNetworkInfo(): EVMNetworkInfo | undefined {
    return this.network;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getAddresses(): string[] {
    return this.addresses;
  }

  setMainAddress(address: string): void {
    if (!this.addresses.includes(address)) throw new Error("Unknown address");
    this.address = address;
  }

  async signTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    if (!this.isConnected()) throw new NotConnected();
    await this.enforcePrefferedChain();
    return Promise.resolve(tx);
  }

  async sendTransaction(
    tx: TransactionRequest
  ): Promise<SendTransactionResult<TransactionReceipt>> {
    if (!this.isConnected()) throw new NotConnected();

    await this.enforcePrefferedChain();

    const response = await this.getSigner().sendTransaction(tx);
    const receipt = await response.wait(this.confirmations);
    return {
      id: receipt.transactionHash,
      data: receipt,
    };
  }

  async signMessage(msg: EthereumMessage): Promise<Signature> {
    if (!this.isConnected()) throw new NotConnected();
    await this.enforcePrefferedChain();
    const signature = await this.getSigner().signMessage(msg);
    return new Uint8Array(Buffer.from(signature.substring(2), "hex"));
  }

  /**
   * @description Try to switch the evm chain the wallet is connected to through the {@link https://eips.ethereum.org/EIPS/eip-3326 EIP-3326} `wallet_switchEthereumChain` method, or throw if the wallet does not support it.
   * Should the chain be missing from the provider, it will try to add it through the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} `wallet_addEthereumChain` method, using the information stored in the map `chainParameters` injected through the constructor.
   * If a switch chain request is already in progress, it will ignore the new request and return without doing anything.
   *
   * @param ethChainId The EVM chain id of the chain to switch to
   */
  async switchChain(ethChainId: EVMChainId): Promise<void> {
    if (!this.isConnected()) throw new NotConnected();
    if (!this.connector?.switchChain) throw new NotSupported();

    // some wallets like metamask throw an error if the provider makes multiple requests
    // while others will trigger as many operations as are requested
    if (this.switchingChain) return;

    try {
      this.switchingChain = true;
      await this.connector.switchChain(ethChainId);
      this.network = await this.fetchNetworkInfo();
    } catch (err) {
      const isChainNotAddedError =
        (err as RpcError).code === ERROR_CODES.CHAIN_NOT_ADDED ||
        (err as RpcError<{ originalError?: { code: number } }>).data
          ?.originalError?.code === ERROR_CODES.CHAIN_NOT_ADDED;

      // wagmi only does this for injected wallets and not for walletconnect
      if (isChainNotAddedError) {
        await this.addChain(ethChainId);
        return;
      }

      throw err;
    } finally {
      this.switchingChain = false;
    }
  }

  /**
   * @description Try to add a new chain to the wallet through the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} `wallet_addEthereumChain` method.
   * The chain information is looked up in the configured `chains` array.
   */
  public async addChain(ethChainId: EVMChainId): Promise<Chain> {
    if (!this.provider) throw new NotConnected();

    const chain = this.chains.find((chain) => chain.id === ethChainId);
    if (!chain) {
      throw new SwitchChainError(
        `Chain ${ethChainId} not configured`,
        ERROR_CODES.CHAIN_NOT_ADDED
      );
    }

    return (await this.provider.send("wallet_addEthereumChain", [
      {
        chainId: ethers.utils.hexValue(chain.id),
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [chain.rpcUrls.public?.http[0] ?? ""],
        blockExplorerUrls: this.getBlockExplorerUrls(chain),
      },
    ])) as Chain;
  }

  protected getBlockExplorerUrls(chain: Chain) {
    const { default: blockExplorer, ...blockExplorers } =
      chain.blockExplorers ?? {};
    if (blockExplorer)
      return [
        blockExplorer.url,
        ...Object.values(blockExplorers).map((x) => x.url),
      ];
  }

  /**
   * Retrieve the underlying Web3Provider
   *
   * @returns {ethers.providers.Web3Provider} Returns the underlying ethers.js Web3Provider if connected, or undefined if not
   */
  getProvider(): ethers.providers.Web3Provider | undefined {
    return this.provider;
  }

  /**
   * Retrieve the underlying Signer.
   *
   * @returns {ethers.Signer} Returns the underlying ethers.js Signer if connected, or undefined if not
   */
  getSigner(): ethers.Signer {
    if (!this.provider) throw new NotConnected();
    return this.provider.getSigner(this.address);
  }

  getWalletState(): WalletState {
    return this.connector.ready
      ? WalletState.Loadable
      : WalletState.NotDetected;
  }

  async getBalance(): Promise<string> {
    if (!this.isConnected()) throw new NotConnected();
    const balance = await this.getSigner()?.getBalance();
    return balance.toString();
  }

  protected async onChainChanged(): Promise<void> {
    if (this.autoSwitch) {
      await this.enforcePrefferedChain();
    }

    this.network = await this.fetchNetworkInfo();

    this.emit("networkChanged");
  }

  protected async onAccountsChanged(accounts: string[]): Promise<void> {
    // no new accounts === wallet disconnected
    if (!accounts.length) return this.disconnect();

    this.address = await this.connector.getAccount();
    this.emit("accountsChanged", this.address);
  }

  protected async onDisconnect(): Promise<void> {
    this.connector.removeAllListeners();
    await this.client?.destroy();
    this.client = undefined;
    this.emit("disconnect");
  }

  private async fetchNetworkInfo(): Promise<EVMNetworkInfo | undefined> {
    if (!this.isConnected()) return;
    return {
      chainId: await this.connector.getChainId(),
    };
  }

  protected parseEvmChainId(id: string | number): number {
    return utils.isHexString(id)
      ? parseInt(id.toString().substring(2), 16)
      : (id as number);
  }
}
