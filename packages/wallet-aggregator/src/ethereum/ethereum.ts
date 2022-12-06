import { ethers } from "ethers";
import { CHAINS } from "../constants";
import { Wallet } from "../wallet";

export abstract class EthereumWallet extends Wallet {
    abstract getSigner(): ethers.Signer;

    getChainId(): number {
        return CHAINS['ethereum'];
    }
}