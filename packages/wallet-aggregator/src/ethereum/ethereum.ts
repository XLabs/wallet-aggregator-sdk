import { TransactionRequest } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import { CHAINS } from "../constants";
import { Wallet } from "../wallet";

export abstract class EthereumWallet extends Wallet {
    protected address?: string;
    protected provider?: ethers.providers.Web3Provider;  

    protected abstract innerConnect(): Promise<void>;

    async connect(): Promise<void> {
        await this.innerConnect();
        this.address = await this.getSigner().getAddress();
    }

    getChainId(): number {
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