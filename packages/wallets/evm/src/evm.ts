import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider";
import { hexlify, hexStripZeros } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { ChainId, PublicKey, SendTransactionResult, Wallet, WalletEvents } from "wallet-aggregator-core";
import { AddEthereumChainParameterMap, DEFAULT_CHAIN_PARAMETERS } from "./parameters";

interface EVMWalletEvents extends WalletEvents {
  evmChainChanged(evmChainId: number): void;
  accountsChanged(address: string): void;
}

export abstract class EVMWallet extends Wallet<TransactionReceipt, EVMWalletEvents> {
  protected addresses: string[] = [];
  protected address?: string;
  protected evmChainId?: number;
  protected provider?: ethers.providers.Web3Provider;
  protected chainParameters: AddEthereumChainParameterMap;

  constructor(params?: AddEthereumChainParameterMap) {
    super();
    this.chainParameters = Object.assign({}, DEFAULT_CHAIN_PARAMETERS, params)
  }

  protected abstract innerConnect(): Promise<string[]>;
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

  async connect(): Promise<PublicKey[]> {
    // TODO: throw error when the evm chain is not supported (evmChainId not in CHAINS) 
    this.addresses = await this.innerConnect();
    this.address = this.addresses[0];
    this.evmChainId = (await this.provider!.getNetwork()).chainId;

    this.emit('connect');

    return this.addresses
  }

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    await this.provider?.removeAllListeners();
    this.provider = undefined;
    this.address = undefined;
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

  getPublicKey(): string | undefined {
    return this.address;
  }

  async signTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return tx;
  }

  async sendTransaction(tx: TransactionRequest): Promise<SendTransactionResult<TransactionReceipt>> {
    if (!this.provider) throw new Error('Not connected');
    const response = await this.provider.getSigner().sendTransaction(tx);

    // TODO: parameterize confirmations
    const receipt = await response.wait();
    return {
      id: receipt.transactionHash,
      data: receipt
    }
  }

  async signMessage(msg: Uint8Array): Promise<Uint8Array> {
    if (!this.provider) throw new Error('Not connected');
    const signature = await this.provider.getSigner().signMessage(msg);
    return new Uint8Array(Buffer.from(signature.substring(2), 'hex'))
  }

  getProvider(): ethers.providers.Web3Provider | undefined {
    if (!this.provider) throw new Error('Not connected');
    return this.provider;
  }

  getSigner(): ethers.Signer {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner();
  }

  async getBalance(): Promise<string> {
    if (!this.provider) throw new Error('Not connected');
    const balance = await this.provider.getSigner().getBalance();
    return balance.toString();
  }

  protected async onChainChanged(chainId: number): Promise<void> {
    const network = await this.provider!.getNetwork();
    this.evmChainId = network.chainId;
    this.emit('evmChainChanged', this.evmChainId)
  }

  protected async onAccountsChanged(): Promise<void> {
    this.address = await this.getSigner().getAddress();
    this.emit('accountsChanged', this.address);
  }
}
