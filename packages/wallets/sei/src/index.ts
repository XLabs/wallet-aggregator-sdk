import { AccountData, StdFee } from "@cosmjs/amino";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import {
  SUPPORTED_WALLETS,
  WalletWindowKey,
  connect,
  getSigningClient,
} from "@sei-js/core";
import {
  NotConnected,
  SendTransactionResult,
  Wallet,
} from "@xlabs-libs/wallet-aggregator-core";

type SeiWalletType = WalletWindowKey;
type SeiChainId = "sei-devnet-3" | "atlantic-2";
type GetWalletsOptions = Omit<SeiWalletConfig, "type">;
interface SeiTransaction {
  msgs: EncodeObject[];
  fee: StdFee;
  memo: string;
}

export interface TxRaw {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  signatures: Uint8Array[];
}

export const getWallets = (config: GetWalletsOptions): SeiWallet[] => {
  return SUPPORTED_WALLETS.filter((w) => !!window[w.windowKey]).map(
    (w) =>
      new SeiWallet({
        ...config,
        type: w.windowKey,
      })
  );
};

interface SeiWalletConfig {
  type: SeiWalletType;
  chainId: SeiChainId;
  rpcUrl: string;
}

export class SeiWallet extends Wallet<
  SeiTransaction,
  TxRaw,
  DeliverTxResponse
> {
  private type: SeiWalletType;
  private chainId: SeiChainId;
  private rpcUrl: string;
  private activeAccount?: AccountData;
  private accounts: AccountData[] = [];
  private signer?: OfflineSigner;

  constructor(config: SeiWalletConfig) {
    super();
    this.type = config.type;
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;
  }

  async connect(): Promise<string[]> {
    const { offlineSigner, accounts } = await connect(this.type, this.chainId);
    this.signer = offlineSigner;
    this.accounts = [...accounts];
    this.activeAccount = accounts[0];
    return accounts.map((a) => a.address);
  }

  disconnect(): Promise<void> {
    this.accounts = [];
    this.activeAccount = undefined;
    this.signer = undefined;
    return Promise.resolve();
  }

  getAccounts(): string[] {
    return this.accounts.map((a) => a.address);
  }

  getAddress(): string | undefined {
    return this.activeAccount?.address;
  }

  async signTransaction(tx: SeiTransaction): Promise<TxRaw> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    // it doesn't matter if we use getSigningClient or getSigningCosmWasmClient
    // because the code to sign is the same for both
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/cosmwasm-stargate/src/signingcosmwasmclient.ts#L560
    // https://github.com/cosmos/cosmjs/blob/e8e65aa0c145616ccb58625c32bffe08b46ff574/packages/stargate/src/signingstargateclient.ts#L323
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    return await signer.sign(
      this.activeAccount.address,
      tx.msgs,
      tx.fee,
      tx.memo
    );
  }

  async sendTransaction(
    tx: TxRaw
  ): Promise<SendTransactionResult<DeliverTxResponse>> {
    if (!this.signer || !this.activeAccount) throw new NotConnected();
    const signer = await getSigningClient(this.rpcUrl, this.signer);
    const response = await signer.broadcastTx(tx.bodyBytes);
    return {
      id: response.transactionHash,
      data: response,
    };
  }
}
