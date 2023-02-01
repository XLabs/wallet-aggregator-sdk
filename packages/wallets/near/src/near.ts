import { Account, Action, FinalExecutionOutcome, Network, NetworkId, setupWalletSelector, Wallet as InternalWallet, WalletMetadata, WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { Address, ChainId, CHAIN_ID_NEAR, SendTransactionResult, Wallet } from "@xlabs-libs/wallet-aggregator-core";

type NearNetwork = NetworkId | Network;

export interface NearWalletParams {
    network: NearNetwork;
    modules: any[];
    contractId: string;
}

interface NearTransaction {
    signerId?: string;
    receiverId: string;
    actions: Action[];
}

interface NearTransactionParams {
    transactions: NearTransaction[];
}

type NearTransactionResult = FinalExecutionOutcome[];

export class NearWallet extends Wallet<
    NearTransactionParams,
    NearTransactionParams,
    NearTransactionResult
> {
    private readonly network: NearNetwork;
    private readonly modules: any[];
    private readonly contractId: string;
    private accounts: Account[] = [];
    private activeAccount?: Account;
    private selector?: WalletSelector;
    private metadata?: WalletMetadata;

    constructor({ network, modules, contractId }: NearWalletParams) {
        super();
        this.network = network;
        this.modules = modules;
        this.contractId = contractId;
    }

    getAddress(): string | undefined {
        return this.activeAccount?.accountId;
    }

    getAddresses(): string[] {
        if (!this.selector) return [];

        return this.accounts.map(a => a.accountId);
    }

    setMainAddress(id: string): void {
        const account = this.accounts.find(acc => acc.accountId === id);
        if (!account) {
            throw new Error('Account not found/enabled');
        }
        this.selector!.setActiveAccount(id);
        this.activeAccount = account;
    }

    getName(): string {
        if (!this.metadata) return 'Near';
        return this.metadata.name;
    }

    getUrl(): string {
        return 'https://near.org';
    }

    getIcon(): string {
        if (!this.metadata) return '';
        return this.metadata.iconUrl;
    }

    getChainId(): ChainId {
        return CHAIN_ID_NEAR;
    }

    getBalance(): Promise<string> {
        throw new Error('Not supported');
    }

    async signTransaction(tx: NearTransactionParams): Promise<NearTransactionParams> {
        const wallet = await this.getWallet();
        if (!wallet) throw new Error('Not connected');
        return tx;
    }

    async sendTransaction(txs: NearTransactionParams): Promise<SendTransactionResult<NearTransactionResult>> {
        const wallet = await this.getWallet();
        if (!wallet) throw new Error('Not connected');
        
        if (wallet.type === 'browser') {
            // TODO: find a way to solve this
            throw new Error('SendTransaction not supported by browser wallets');
        } else {
            const result = await wallet.signAndSendTransactions(txs);
            return {
                id: result[result.length - 1].transaction_outcome.id,
                data: result
            }
        }
    }

    signMessage(msg: any): Promise<any> {
        throw new Error("Sign message not supported");
    }

    /**
     * TODO: this is using a modal library. Find a way to programatically select a wallet, maybe by receiving
     * the type through constructor or as an argument for connect()
     */
    async connect(): Promise<Address[]> {
        this.selector = await setupWalletSelector({
            network: this.network,
            modules: this.modules
        });

        return new Promise(async (resolve, reject) => {
            const modal = await setupModal(this.selector!, {
                contractId: this.contractId,
                onHide: (reason) => {
                    if (reason === 'user-triggered') {
                        reject('Connect cancelled');
                    }
                }
            });

            modal.show();

            const onConnect = async (accounts: Account[]) => {
                modal.hide();

                const wallet = await this.selector!.wallet();
                
                this.accounts = accounts;
                this.activeAccount = accounts[0];
                this.metadata = wallet?.metadata;

                this.selector?.off('signedIn', () => {});
                resolve(this.getAddresses());
            };

            this.selector!.on('signedIn', async ({ accounts }) => {
                await onConnect(accounts);
            });

            const accounts = this.selector!.store.getState().accounts;
            if (accounts.length > 0) {
                onConnect(accounts);
            }
        });
    }

    async disconnect(): Promise<void> {
        const wallet = await this.getWallet();
        if (!wallet) {
            throw new Error('Not connected')
        }

        this.accounts = [];
        this.activeAccount = undefined;
        this.metadata = undefined;
        await wallet.signOut();
    }

    async getWallet(): Promise<InternalWallet | undefined> {
        return this.selector?.wallet();
    }
}
