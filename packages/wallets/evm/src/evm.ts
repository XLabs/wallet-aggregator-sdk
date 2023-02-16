import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider";
import { Address, ChainId, CHAIN_ID_ETH, SendTransactionResult, Signature, Wallet, WalletEvents } from "@xlabs-libs/wallet-aggregator-core";
import { ethers, utils } from "ethers";
import { AddEthereumChainParameterMap, DEFAULT_CHAIN_PARAMETERS } from "./parameters";
import { isTestnetEvm, evmChainIdToChainId, EVM_CHAINS } from "./constants";

type EVMChainId = number

interface EVMWalletEvents extends WalletEvents {
  accountsChanged(address: Address): void;
}

// See:
// - https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
// - https://docs.metamask.io/guide/rpc-api.html#returns-7
enum ERROR_CODES {
  USER_REJECTED = 4001,
  CHAIN_NOT_ADDED = 4902
}

/** EVMWallet config options */
export interface EVMWalletConfig {
  /**
   * A map of AddEthereumChainParameter defined as in the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} indexed by EVM chain ids.
   */
  chainParameters?: AddEthereumChainParameterMap;
  /**
   * An EVM chain id. When connecting, the wallet will try to switch to this chain if the provider network's chain id differs.
   */
  preferredChain?: EVMChainId;
  /**
   * Indicates whether the wallet should attempt to switch the network back to the preferredChain upon detecting a `chainChanged` event.
   */
  autoSwitch?: boolean;
}

export type EthereumMessage = string | ethers.utils.Bytes;

export interface EVMNetworkInfo {
  /** Network EVM chain id */
  chainId: number;
  /** Network name */
  name: string;
}

/**
 * An abstraction over EVM compatible blockchain wallets
 */
export abstract class EVMWallet extends Wallet<
  TransactionRequest,
  TransactionRequest,
  TransactionReceipt,
  EVMNetworkInfo,
  EthereumMessage,
  Signature,
  EVMWalletEvents
> {
  protected addresses: Address[] = [];
  protected address?: Address;
  protected network?: EVMNetworkInfo;
  protected preferredChain?: EVMChainId;
  protected provider?: ethers.providers.Web3Provider;
  protected chainParameters: AddEthereumChainParameterMap;
  protected autoSwitch: boolean;

  constructor({ chainParameters, preferredChain, autoSwitch = false }: EVMWalletConfig = {}) {
    super();
    this.chainParameters = Object.assign({}, DEFAULT_CHAIN_PARAMETERS, chainParameters);
    this.preferredChain = preferredChain;
    this.autoSwitch = autoSwitch;
  }

  protected abstract innerConnect(): Promise<Address[]>;
  protected abstract innerDisconnect(): Promise<void>;

  /**
   * @description Try to switch the evm chain the wallet is connected to through the {@link https://eips.ethereum.org/EIPS/eip-3326 EIP-3326} `wallet_switchEthereumChain` method.
   * 
   * Should the chain be missing from the provider (code `4902`/`CHAIN_NOT_ADDED`), it will try to add it through the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} `wallet_addEthereumChain` method, using the information stored in the map `chainParameters` injected through the constructor.
   *
   * @param ethChainId The EVM chain id of the chain to switch to
   * @throws Throws an error for codes other than `4902`/`CHAIN_NOT_ADDED`
   * @throws Throws an error when trying to add a chain no config is found for
   * @throws May throw if the add chain request fails or is rejected
   */
  async switchChain(ethChainId: EVMChainId): Promise<void> {
    if (!this.provider) return;

    try {
      await this.provider.send("wallet_switchEthereumChain", [
        { chainId: utils.hexStripZeros(utils.hexlify(ethChainId)) },
      ]);

      this.network = await this.provider.getNetwork();
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === ERROR_CODES.CHAIN_NOT_ADDED) {
        const addChainParameter =
          this.chainParameters[ethChainId];

        if (addChainParameter === undefined) {
          throw new Error(`No metamask config found for chain ${ethChainId}`)
        }

        return this.provider.send("wallet_addEthereumChain", [
          addChainParameter,
        ]);
      }

      throw switchError
    }
  }

  async connect(): Promise<Address[]> {
    // TODO: throw error when the evm chain is not supported (evmChainId not in CHAINS) 
    this.addresses = this.checksumAddresses(await this.innerConnect());
    this.address = this.addresses[0];

    await this.enforcePrefferedChain();

    this.network = await this.provider!.getNetwork();

    this.emit('connect');

    return this.addresses;
  }

  private async enforcePrefferedChain(): Promise<void> {
    if (!this.provider) throw new Error('Not connected');
    if (!this.preferredChain) return;

    let currentChain = this.getNetworkInfo()?.chainId;
    while (currentChain !== this.preferredChain) {
      try {
        await this.switchChain(this.preferredChain);
        currentChain = this.getNetworkInfo()?.chainId;
      } catch (error: any) {
        // ignore user rejections
        if (error.code !== ERROR_CODES.USER_REJECTED) {
          throw error
        }
      }
    }
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
    await this.innerDisconnect();
    await this.provider?.removeAllListeners();
    this.provider = undefined;
    this.address = undefined;
    this.addresses = [];
    this.network = undefined;

    this.emit('disconnect');
  }

  getChainId(): ChainId {
    if (!this.provider) return CHAIN_ID_ETH;

    const evmChainId = this.network!.chainId;

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
    if (!this.addresses.includes(address))
      throw new Error('Unknown address')
    this.address = address
  }

  private checksumAddress(address: string | undefined) {
    return address ? utils.getAddress(address) : undefined;
  }

  private checksumAddresses(addresses: string[]): string[] {
    return addresses.map(addr => this.checksumAddress(addr)!);
  }

  async signTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    if (!this.isConnected()) throw new Error('Not connected');
    return tx;
  }

  async sendTransaction(tx: TransactionRequest): Promise<SendTransactionResult<TransactionReceipt>> {
    if (!this.isConnected()) throw new Error('Not connected');
    const response = await this.getSigner()!.sendTransaction(tx);

    // TODO: parameterize confirmations
    const receipt = await response.wait();
    return {
      id: receipt.transactionHash,
      data: receipt
    }
  }

  async signMessage(msg: EthereumMessage): Promise<Signature> {
    if (!this.isConnected()) throw new Error('Not connected');
    const signature = await this.getSigner()!.signMessage(msg);
    return new Uint8Array(Buffer.from(signature.substring(2), 'hex'))
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
  getSigner(): ethers.Signer | undefined {
    return this.provider?.getSigner(this.address);
  }

  async getBalance(): Promise<string> {
    if (!this.isConnected()) throw new Error('Not connected');
    const balance = await this.getSigner()!.getBalance();
    return balance.toString();
  }

  protected async onChainChanged(): Promise<void> {
    if (this.autoSwitch) {
      this.enforcePrefferedChain();
    }

    this.network = await this.provider!.getNetwork();

    this.emit('networkChanged');
  }

  protected async onAccountsChanged(accounts: string[]): Promise<void> {
    // no new accounts === wallet disconnected
    if (!accounts.length) return this.disconnect()

    this.address = await this.provider!.getSigner().getAddress();
    this.emit('accountsChanged', this.address);
  }

  protected parseEvmChainId(id: string | number): number {
    return utils.isHexString(id)
      ? parseInt(id.toString().substring(2), 16)
      : id as number;
  }
}
