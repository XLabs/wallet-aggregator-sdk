import { TransactionRequest } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import { ChainId, CHAINS } from "../constants";
import { Wallet } from "../wallet";
import { hexlify, hexStripZeros } from "@ethersproject/bytes";

export abstract class EthereumWallet extends Wallet {
  protected address?: string;
  protected provider?: ethers.providers.Web3Provider;

  protected abstract innerConnect(): Promise<void>;

  async checkAndSwitchNetwork(ethChainId: number): Promise<void> {
    if (!this.provider) return;

    try {
      await this.provider.send("wallet_switchEthereumChain", [
        { chainId: hexStripZeros(hexlify(ethChainId)) },
      ]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        // const addChainParameter =
        //   METAMASK_CHAIN_PARAMETERS[correctEvmNetwork];
        // if (addChainParameter !== undefined) {
        //   try {
        //     await this.provider.send("wallet_addEthereumChain", [
        //       addChainParameter,
        //     ]);
        //   } catch (addError) {
        //     console.error(addError);
        //   }
        // }
        throw new Error("Chain not in metamask")
      }
      throw switchError
    }
  }

  async connect(): Promise<void> {
    await this.innerConnect();
    this.address = await this.getSigner().getAddress();

    this.provider!.on('accountsChanged', async () => {
      this.address = await this.getSigner().getAddress();
    })
  }

  async disconnect(): Promise<void> {
    await this.provider?.removeAllListeners();
  }

  getChainId(): ChainId {
    return CHAINS['ethereum'];
  }

  getPublicKey(): string | undefined {
    return this.address;
  }

  async signTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return tx;
  }

  async sendTransaction(tx: TransactionRequest): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner().sendTransaction(tx);
  }

  async signMessage(msg: Uint8Array): Promise<any> {
    if (!this.provider) throw new Error('Not connected');
    return this.provider.getSigner().signMessage(msg);
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
}
