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

export interface EVMWalletConfig {
  chainParameters?: AddEthereumChainParameterMap;
  preferredChain?: EVMChainId;
  autoSwitch?: boolean;
}

export type EthereumMessage = string | ethers.utils.Bytes;

export interface EVMNetworkInfo {
  chainId: number;
  name: string;
}

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

    const chainId = (await this.provider!.getNetwork()).chainId;
    await this.enforcePrefferedChain(chainId);

    this.network = await this.provider!.getNetwork();

    this.emit('connect');

    return this.addresses;
  }

  private async enforcePrefferedChain(chainId: EVMChainId): Promise<void> {
    if (!this.preferredChain || chainId === this.preferredChain) return;

    try {
      await this.switchChain(this.preferredChain);
    } catch (error: any) {
      // enforce disconnect if the user is not willing to change to the desired chain
      if (error.code === ERROR_CODES.USER_REJECTED) {
        await this.disconnect()
      }

      throw error
    }
  }

  public async setPrefferedChain(chainId: EVMChainId): Promise<void> {
    await this.enforcePrefferedChain(chainId);
    this.preferredChain = chainId;
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
    if (!this.provider) return CHAIN_ID_ETH

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

  getProvider(): ethers.providers.Web3Provider | undefined {
    return this.provider;
  }

  getSigner(): ethers.Signer | undefined {
    return this.provider?.getSigner(this.address);
  }

  async getBalance(): Promise<string> {
    if (!this.isConnected()) throw new Error('Not connected');
    const balance = await this.getSigner()!.getBalance();
    return balance.toString();
  }

  protected async onChainChanged(chainId: number): Promise<void> {
    if (this.autoSwitch) {
      this.enforcePrefferedChain(chainId);
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
