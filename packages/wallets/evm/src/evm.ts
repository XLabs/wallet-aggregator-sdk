import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider";
import { hexlify, hexStripZeros } from "@ethersproject/bytes";
import { ethers, utils } from "ethers";
import { ChainId, Address, SendTransactionResult, Wallet, WalletEvents } from "@xlabs/wallet-aggregator-core";
import { AddEthereumChainParameterMap, DEFAULT_CHAIN_PARAMETERS } from "./parameters";

interface EVMWalletEvents extends WalletEvents {
  evmChainChanged(evmChainId: number): void;
  accountsChanged(address: Address): void;
}

export abstract class EVMWallet extends Wallet<TransactionReceipt, EVMWalletEvents> {
  protected addresses: Address[] = [];
  protected address?: Address;
  protected evmChainId?: number;
  protected provider?: ethers.providers.Web3Provider;
  protected chainParameters: AddEthereumChainParameterMap;

  constructor(params?: AddEthereumChainParameterMap) {
    super();
    this.chainParameters = Object.assign({}, DEFAULT_CHAIN_PARAMETERS, params)
  }

  protected abstract innerConnect(): Promise<Address[]>;
  protected abstract innerDisconnect(): Promise<void>;

  async switchChain(ethChainId: number): Promise<void> {
    if (!this.provider) return;

    try {
      await this.provider.send("wallet_switchEthereumChain", [
        { chainId: hexStripZeros(hexlify(ethChainId)) },
      ]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        const addChainParameter =
          this.chainParameters[ethChainId];

        if (addChainParameter !== undefined) {
          await this.provider.send("wallet_addEthereumChain", [
            addChainParameter,
          ]);
        }
        throw new Error("Chain not in metamask")
      }
      throw switchError
    }
  }

  async connect(): Promise<Address[]> {
    // TODO: throw error when the evm chain is not supported (evmChainId not in CHAINS) 
    this.addresses = await this.innerConnect();
    this.address = this.addresses[0];
    this.evmChainId = (await this.provider!.getNetwork()).chainId;

    this.emit('connect');

    return this.addresses.map(addr => this.checksumAddress(addr)!)
  }

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    await this.provider?.removeAllListeners();
    this.provider = undefined;
    this.address = undefined;
    this.addresses = []
    this.evmChainId = undefined;

    this.emit('disconnect');
  }

  getChainId(): ChainId {
    return this.evmChainId as ChainId;
  }

  getEvmChainId(): number | undefined {
    if (!this.provider) throw new Error('Not connected');
    return this.evmChainId;
  }

  getAddress(): string | undefined {
    return this.checksumAddress(this.address);
  }

  getAddresses(): string[] {
    return this.addresses.map(addr => this.checksumAddress(addr)!)
  }

  setMainAddress(address: string): void {
    if (!this.addresses.includes(address))
      throw new Error('Unknown address')
    this.address = address
  }

  private checksumAddress(address: string | undefined) {
    return address ? utils.getAddress(address) : undefined;
  }

  async signTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return tx;
  }

  async sendTransaction(tx: TransactionRequest): Promise<SendTransactionResult<TransactionReceipt>> {
    if (!this.provider) throw new Error('Not connected');
    const account = await this.getSigner().sendTransaction(tx);

    // TODO: parameterize confirmations
    const receipt = await account.wait();
    return {
      id: receipt.transactionHash,
      data: receipt
    }
  }

  async signMessage(msg: Uint8Array): Promise<Uint8Array> {
    if (!this.provider) throw new Error('Not connected');
    const signature = await this.getSigner().signMessage(msg);
    return new Uint8Array(Buffer.from(signature.substring(2), 'hex'))
  }

  getProvider(): ethers.providers.Web3Provider | undefined {
    if (!this.provider) throw new Error('Not connected');
    return this.provider;
  }

  getSigner(): ethers.Signer {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner(this.address);
  }

  async getBalance(): Promise<string> {
    if (!this.provider) throw new Error('Not connected');
    const balance = await this.getSigner().getBalance();
    return balance.toString();
  }

  protected async onChainChanged(chainId: number): Promise<void> {
    const network = await this.provider!.getNetwork();
    this.evmChainId = network.chainId;
    this.emit('evmChainChanged', this.evmChainId)
  }

  protected async onAccountsChanged(accounts: string[]): Promise<void> {
    // no new accounts === wallet disconnected
    if (!accounts.length) return this.disconnect()

    this.address = await this.provider!.getSigner().getAddress();
    this.emit('accountsChanged', this.address);
  }
}
