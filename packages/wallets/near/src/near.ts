import { Account, Action, FinalExecutionOutcome, Network, NetworkId, setupWalletSelector, Wallet as InternalWallet, WalletMetadata, WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { Address, ChainId, CHAIN_ID_NEAR, NotSupported, SendTransactionResult, Wallet } from "@xlabs-libs/wallet-aggregator-core";
import { connect, ConnectConfig as NearConfig, Account as ConnectedAccount } from "near-api-js";
import { BN } from "bn.js";


export interface NearWalletParams {
    /** Near configuration */
    config: NearConfig;
    /** List of modules/wallets available */
    modules: any[];
    /** Contract ID the wallet/application will interact with */
    contractId: string;
    /** Allow browser wallets to redirect to another page */
    allowRedirect?: boolean;
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
    NearTransactionResult,
    Network
> {
    private readonly config: NearConfig;
    private readonly modules: any[];
    private readonly contractId: string;
    private accounts: Account[] = [];
    private activeAccount?: Account;
    private selector?: WalletSelector;
    private metadata?: WalletMetadata;
    private allowRedirect: boolean;
    private network?: Network;

    constructor({ config, modules, contractId, allowRedirect }: NearWalletParams) {
        super();
        this.config = config;
        this.modules = modules;
        this.contractId = contractId;
        this.allowRedirect = allowRedirect ?? true;
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

    getNetworkInfo(): Network | undefined {
        return this.network;
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
        throw new NotSupported();
    }

    async signTransaction(tx: NearTransactionParams): Promise<NearTransactionParams> {
        const wallet = await this.getWallet();
        if (!wallet) throw new Error('Not connected');
        return tx;
    }

    async sendTransaction(txs: NearTransactionParams): Promise<SendTransactionResult<NearTransactionResult>> {
        const wallet = await this.getWallet();
        if (!wallet || !this.activeAccount) throw new Error('Not connected');
        
        let result: FinalExecutionOutcome[];
        if (wallet.type === 'browser') {
            const connection = await connect(this.config);
            const account = await connection.account(this.activeAccount.accountId)
            result = [];
            for (const tx of txs.transactions) {
                // browser wallets may redirect to another page, which might not be desirable for developers
                if (this.allowRedirect) {
                    for (const tx of txs.transactions) {
                        const outcome = await wallet.signAndSendTransaction(tx);
                        result.push(outcome as FinalExecutionOutcome);
                    }
                } else {
                    for (const action of tx.actions) {
                        result.push(await this.executeAction(account, action));
                    }
                }
            }
        } else {
            result = await wallet.signAndSendTransactions(txs);
        }

        return {
            id: result[result.length - 1].transaction_outcome.id,
            data: result
        }
    }

    private async executeAction(account: ConnectedAccount, action: Action): Promise<FinalExecutionOutcome> {
        switch (action.type) {
            case "FunctionCall":
                return account.functionCall({
                    args: action.params.args,
                    methodName: action.params.methodName,
                    gas: new BN(action.params.gas || 0),
                    attachedDeposit: new BN(action.params.deposit || 0),
                    contractId: this.contractId
                });
            default:
                throw new Error('WIP: only FunctionCall is supported for browser wallets');
        }
    }

    signMessage(msg: any): Promise<any> {
        throw new NotSupported();
    }

    /**
     * TODO: this is using a modal library. Find a way to programatically select a wallet, maybe by receiving
     * the type through constructor or as an argument for connect()
     */
    async connect(): Promise<Address[]> {
        this.selector = await setupWalletSelector({
            network: this.config.networkId as NetworkId,
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

            const onSignIn = async ({ accounts }: { accounts: Account[] }) => {
                await onConnect(accounts);
            }

            const onConnect = async (accounts: Account[]) => {
                modal.hide();

                const wallet = await this.selector!.wallet();
                
                this.accounts = accounts;
                this.activeAccount = accounts[0];
                this.metadata = wallet?.metadata;
                this.network = {
                    ...this.selector!.options.network,
                }

                this.selector?.on('networkChanged', this.onNetworkChange);

                this.selector?.off('signedIn', onSignIn);
                resolve(this.getAddresses());
            };

            this.selector!.on('signedIn', onSignIn);

            const accounts = this.selector!.store.getState().accounts;
            if (accounts.length > 0) {
                onConnect(accounts);
            }
        });
    }

    isConnected(): boolean {
        return !!this.selector?.isSignedIn();
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

        this.selector?.off('networkChanged', this.onNetworkChange);
        this.selector = undefined;
    }

    /** Returns the active/internal wallet */
    async getWallet(): Promise<InternalWallet | undefined> {
        return this.selector?.wallet();
    }

    private onNetworkChange = ({ networkId }: { networkId: string; }) => {
        this.network = {
            ...this.network!,
            networkId
        }
        this.emit('networkChanged');
    };
}
