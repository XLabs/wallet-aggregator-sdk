import MyAlgoConnect from "@randlabs/myalgo-connect";
import {
  Address,
  ChainId,
  CHAINS,
  IconSource,
  NotConnected,
  Signature,
} from "@xlabs-libs/wallet-aggregator-core";
import {
  AlgorandMessage,
  AlgorandWalletConfig,
  AlgorandWalletParams,
  SignerTransaction,
  SignTransactionResult,
} from "./types";
import { AlgorandWallet } from "./algorand";

export interface MyAlgoConnectConfig {
  /** MyAlgoConnect bridge url */
  bridgeUrl?: string;
  /** Indicates whether ledger accounts are enabled or not */
  disableLedgerNano?: boolean;
}

/** MyAlgoWallet constructor params */
export interface MyAlgoWalletParams extends AlgorandWalletParams {
  /** MyAlgoConnect configuration params */
  myAlgoConnect?: MyAlgoConnectConfig;
}

/** MyAlgoWallet constructor config */
export interface MyAlgoWalletConfig extends AlgorandWalletConfig {
  /** MyAlgoConnect configuration params */
  myAlgoConnect?: MyAlgoConnectConfig;
}

export class MyAlgoWallet extends AlgorandWallet {
  private readonly client: MyAlgoConnect;

  constructor(config: MyAlgoWalletParams = {}) {
    super(config);
    this.client = new MyAlgoConnect({ ...config?.myAlgoConnect });
  }

  getName(): string {
    return "My Algo Wallet";
  }

  getUrl(): string {
    return "https://wallet.myalgo.com";
  }

  async innerConnect(): Promise<Address[]> {
    const accounts = await this.client.connect();
    return accounts.map((a) => a.address);
  }

  innerDisconnect(): Promise<void> {
    return Promise.resolve();
  }

  getChainId(): ChainId {
    return CHAINS["algorand"];
  }

  async signTransaction(
    tx: SignerTransaction | SignerTransaction[]
  ): Promise<SignTransactionResult> {
    if (!this.account) throw new NotConnected();

    const toSend = Array.isArray(tx) ? tx : [tx];
    return await this.client.signTxns(toSend);
  }

  async signMessage(msg: AlgorandMessage): Promise<Signature> {
    if (!this.account) throw new NotConnected();
    return this.client.signBytes(msg, this.account);
  }

  /**
   * Signs an arbitrary piece of data which may later be used in a teal contract through the {@link https://developer.algorand.org/docs/get-details/dapps/avm/teal/opcodes/#ed25519verify ed25519verify opcode}
   *
   * @param data The piece of data to sign
   * @param contractAddress The address of the contract the signature will be validated on
   * @param signer The signer address
   * @returns The data signature
   */
  async tealSign(
    data: Uint8Array,
    contractAddress: Address,
    signer: Address
  ): Promise<Uint8Array> {
    return this.client.tealSign(data, contractAddress, signer);
  }

  /**
   * Sign a teal program
   *
   * @param logic The teal program to sign
   * @param signer The signer address
   * @returns The signed teal
   */
  async signLogicSig(
    logic: string | Uint8Array,
    signer: Address
  ): Promise<Uint8Array> {
    return this.client.signLogicSig(logic, signer);
  }

  getIcon(): IconSource {
    return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgNjAgNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3QgeD0iOS4xNDYiIHk9IjEzLjI5OCIgd2lkdGg9IjM5LjM3NSIgaGVpZ2h0PSIyOC4yMDciIHN0eWxlPSJzdHJva2Utd2lkdGg6IDBweDsgZmlsbDogcmdiKDI1NSwgMjU1LCAyNTUpOyBzdHJva2U6IHJnYigyNTUsIDI1NSwgMjU1KTsiLz4KICA8cGF0aCBkPSJNIDI5Ljk1NiA2MCBDIDI0LjAzMiA2MCAxOC4yNCA1OC4yNDQgMTMuMzE0IDU0Ljk1MyBDIDguMzg4IDUxLjY2MiA0LjU0OCA0Ni45ODQgMi4yODEgNDEuNTEgQyAwLjAxMyAzNi4wMzcgLTAuNTggMzAuMDE0IDAuNTc1IDI0LjIwNCBDIDEuNzMxIDE4LjM5MyA0LjU4NCAxMy4wNTUgOC43NzMgOC44NjYgQyAxMS41NSA2LjA2NSAxNC44NTMgMy44MzkgMTguNDkyIDIuMzE4IEMgMjIuMTMyIDAuNzk2IDI2LjAzNiAwLjAwOSAyOS45OCAwIEMgMzMuOTI1IC0wLjAwOSAzNy44MzIgMC43NjIgNDEuNDc4IDIuMjY4IEMgNDUuMTI0IDMuNzczIDQ4LjQzNyA1Ljk4NCA1MS4yMjYgOC43NzMgQyA1NC4wMTYgMTEuNTYyIDU2LjIyNiAxNC44NzUgNTcuNzMyIDE4LjUyMSBDIDU5LjIzOCAyMi4xNjcgNjAuMDA4IDI2LjA3NSA1OS45OTkgMzAuMDE5IEMgNTkuOTkxIDMzLjk2NCA1OS4yMDMgMzcuODY4IDU3LjY4MiA0MS41MDcgQyA1Ni4xNiA0NS4xNDcgNTMuOTM1IDQ4LjQ1IDUxLjEzMyA1MS4yMjcgQyA0OC4zNTkgNTQuMDE2IDQ1LjA1OSA1Ni4yMjggNDEuNDI0IDU3LjczNCBDIDM3Ljc4OCA1OS4yNCAzMy44OTEgNjAuMDEgMjkuOTU2IDYwIFogTSAzNy45MjQgMjEuMDQ1IEwgMzguMTY2IDIxLjk4IEwgNDMuMDc3IDM5Ljc4MSBMIDQ3LjA3MyAzOS43ODEgTCA0MC4zNyAxNi42OTYgTCA0MC4yMDYgMTYuMDY5IEwgMzYuNzIxIDE2LjA2OSBMIDM2LjY0IDE2LjE5NCBMIDMzLjM4IDIxLjk4NCBMIDMwLjAzNyAyNy45MjMgTCAyOS45NTYgMjguMDY1IEwgMjkuOTE5IDI3LjkyMyBMIDI5LjUwNyAyNi4zOTcgTCAyOC4zNjYgMjEuOTg0IEwgMjguMjQzIDIxLjU0NiBMIDI2Ljk3OSAxNi42OTUgTCAyNi44MTYgMTYuMDY3IEwgMjMuMzM2IDE2LjA2NyBMIDIzLjI1NiAxNi4xOTMgTCAxOS45OTcgMjEuOTg0IEwgMTYuNjU0IDI3LjkyMyBMIDEzLjMzMiAzMy44NCBMIDkuOTg5IDM5Ljc4MSBMIDEzLjk4MiAzOS43ODEgTCAxNy4zMjUgMzMuODQzIEwgMjAuNjY4IDI3LjkyNyBMIDIzLjk4OSAyMS45ODkgTCAyNC41MzkgMjEuMDQ4IEwgMjQuNzgzIDIxLjk4OSBMIDI1LjgwMiAyNS44OTkgTCAyNy4wNjcgMzAuNzcgTCAyNy41MDggMzIuNDMxIEwgMjYuNzE0IDMzLjg0MyBMIDIzLjM2NiAzOS43ODEgTCAyNy4zNTkgMzkuNzgxIEwgMjguNzcgMzcuMjc2IEwgMzEuMjIyIDMyLjkyNSBMIDM0LjA0NSAyNy45MjcgTCAzNy4zNjcgMjEuOTg5IEwgMzcuOTE1IDIxLjA1MyBMIDM3LjkyNCAyMS4wNDUgWiIgc3R5bGU9InBhaW50LW9yZGVyOiBmaWxsOyBmaWxsLXJ1bGU6IG5vbnplcm87IiBmaWxsPSIjMjQ1RUM2Ii8+Cjwvc3ZnPg==";
  }
}
