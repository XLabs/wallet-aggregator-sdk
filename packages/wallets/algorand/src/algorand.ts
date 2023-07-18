import {
  Address,
  BaseFeatures,
  CHAIN_ID_ALGORAND,
  ChainId,
  SendTransactionResult,
  Signature,
  Wallet,
} from "@xlabs-libs/wallet-aggregator-core";
import algosdk from "algosdk";
import {
  AccountDataResponse,
  AlgorandFeatures,
  AlgorandMessage,
  AlgorandNetworkInfo,
  AlgorandWalletConfig,
  AlgorandWalletParams,
  SendTransactionResponse,
  SignerTransaction,
  SignTransactionResult,
  SubmittedTransactionMap,
} from "./types";

const DEFAULT_CONFIG: AlgorandWalletConfig = {
  node: { url: "https://xna-mainnet-api.algonode.cloud" },
  indexer: { url: "https://mainnet-idx.algonode.cloud" },
  waitRounds: 1000,
};

const notNull = <T>(t: T | null): t is T => {
  return t !== null;
};

export abstract class AlgorandWallet extends Wallet<
  typeof CHAIN_ID_ALGORAND,
  void,
  SignerTransaction,
  SignTransactionResult,
  SignTransactionResult,
  SubmittedTransactionMap,
  SignerTransaction,
  SubmittedTransactionMap,
  AlgorandMessage,
  Signature,
  AlgorandNetworkInfo,
  AlgorandFeatures
> {
  protected config: AlgorandWalletConfig;
  protected accounts: Address[];
  protected account: Address | undefined;
  protected networkInfo?: AlgorandNetworkInfo;

  constructor({ defaultAccount, ...config }: AlgorandWalletParams = {}) {
    super();
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.accounts = defaultAccount ? [defaultAccount] : [];
    this.account = defaultAccount;
  }

  protected abstract innerConnect(): Promise<Address[]>;
  protected abstract innerDisconnect(): Promise<void>;

  async connect(): Promise<Address[]> {
    const accounts = await this.innerConnect();
    this.accounts = accounts;
    this.account = this.accounts[0];

    this.emit("connect");

    const { genesisHash, genesisID } = await this.buildClient()
      .getTransactionParams()
      .do();
    this.networkInfo = {
      genesisHash,
      genesisID,
    };

    return this.accounts;
  }

  abstract signTransaction(
    tx: SignerTransaction | SignerTransaction[]
  ): Promise<SignTransactionResult>;

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    this.accounts = [];
    this.account = undefined;
    this.networkInfo = undefined;
    this.emit("disconnect");
  }

  isConnected(): boolean {
    return !!this.account;
  }

  getChainId() {
    return CHAIN_ID_ALGORAND;
  }

  getAddress(): Address | undefined {
    return this.account;
  }

  getAddresses(): Address[] {
    return this.accounts;
  }

  setMainAddress(account: Address): void {
    if (!this.accounts.includes(account)) {
      throw new Error("Unknown address");
    }
    this.account = account;
  }

  getNetworkInfo(): AlgorandNetworkInfo | undefined {
    return this.networkInfo;
  }

  async getBalance(assetAddress?: string): Promise<string> {
    if (!this.account) throw new Error("Not connected");

    const indexer = new algosdk.Indexer("", this.config.indexer.url);

    if (assetAddress) {
      const id =
        typeof assetAddress === "number"
          ? assetAddress
          : Number.parseInt(assetAddress);
      const holdingResponse = (await indexer
        .lookupAccountAssets(this.account)
        .assetId(id)
        .do()) as algosdk.indexerModels.AssetHoldingsResponse;
      const balance = BigInt(holdingResponse.assets[0]?.amount || 0);

      const assetResponse = (await indexer
        .lookupAssetByID(id)
        .do()) as algosdk.indexerModels.AssetResponse;
      const decimals = BigInt(assetResponse.asset.params.decimals);

      return (balance / BigInt(10) ** decimals).toString();
    }

    const response = (await indexer
      .lookupAccountByID(this.account)
      .do()) as algosdk.indexerModels.AccountResponse;
    return algosdk
      .microalgosToAlgos(Number(response.account?.amount || 0))
      .toString();
  }

  async sendTransaction(
    signedTx: SignTransactionResult
  ): Promise<SendTransactionResult<SubmittedTransactionMap>> {
    const algod = this.buildClient();

    // the null filter should not be needed, since all txs should be signed
    // by this point, but since we can't assume so, we filter them out
    // the sdk will raise an error need it be
    const toSend = signedTx
      .filter(notNull)
      .map((t) => Buffer.from(t, "base64"));
    const { txId } = (await algod
      .sendRawTransaction(toSend)
      .do()) as SendTransactionResponse;
    const info = await algosdk.waitForConfirmation(
      algod,
      txId,
      this.config.waitRounds
    );
    return {
      id: txId,
      data: info,
    };
  }

  async signAndSendTransaction(
    tx: SignerTransaction
  ): Promise<SendTransactionResult<SubmittedTransactionMap>> {
    const signed = await this.signTransaction(tx);
    return this.sendTransaction(signed);
  }

  private buildClient(): algosdk.Algodv2 {
    return new algosdk.Algodv2(
      this.config.node.token || "",
      this.config.node.url,
      this.config.node.port || ""
    );
  }

  getFeatures(): AlgorandFeatures[] {
    return [
      BaseFeatures.SendTransaction,
      BaseFeatures.SignTransaction,
      BaseFeatures.SignAndSendTransaction,
    ];
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_ALGORAND;
  }
}
