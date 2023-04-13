import EventEmitter from "eventemitter3";
import { ChainId } from "./constants";

export class NotSupported extends Error {
  constructor() {
    super("Not supported");
  }
}

export class NotConnected extends Error {
  constructor() {
    super("Not connected");
  }
}

/**
 * Events the wallet can be listened on
 */
export interface WalletEvents {
  connect(): void;
  disconnect(): void;
  networkChanged(): void;
}

export enum WalletState {
  Installed = "Installed",
  NotDetected = "NotDetected",
  Loadable = "Loadable",
  Unsupported = "Unsupported",
}

export interface SendTransactionResult<R> {
  id: string;
  data?: R;
}

export type Address = string;
export type IconSource = string;
export type Signature = Uint8Array;

export type BaseUnsignedTransaction = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type BaseSignedTransaction = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type BaseSubmitTransactionInput = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type BaseSubmitTransactionResult = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type BaseMessage = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type BaseSignedMessage = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type NetworkInfo = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Base Wallet abstraction.
 *
 * Generic arguments (all of them `any` by default):
 *  * `BaseUnsignedTransaction` (BUT) - Transaction parameters to sign object type
 *  * `BaseSignedTransaction` (BST) - Signed transaction object type
 *  * `BaseSubmitTransactionResult` (R) - Object type expected after submitting a signed tx to the network
 *  * `NetworkInfo` - Object type that describes the blockchain's network information or state
 *  * `BaseMessage` (BM) - Message to sign object type
 *  * `BaseSignedMessage` (BSM) - Signed message object type
 *  * `WalletEvents` (E) - Object type which describes the events the wallet can be listened on
 *  * `BaseSubmitTransactionInput` (E) - Transaction information to send to the network. DEfaults to `BaseSignedTransaction`. If overriden might involve a signed transaction or not, it is left to the implementor.
 */
export abstract class Wallet<
  CID extends ChainId = ChainId,
  ConnectOptions = void,
  SignTransactionInput = any,
  SignTransactionResult = any,
  SendTransactionInput = any,
  SendTransactionResultData = any,
  SignAndSendTransactionInput = SignTransactionInput,
  SignAndSendTransactionResultData = SendTransactionResultData,
  SignMessageInput = any,
  SignMessageResult = any,
  NetworkInfo = any,
  E extends WalletEvents = WalletEvents
> extends EventEmitter<E> {
  /** Retrieve the wallet's name */
  abstract getName(): string;

  /** Retrieve the wallet's project url */
  abstract getUrl(): string;

  /**
   * @async
   * @description Connect to the wallet. Implementors are expected to emmit a `connect` event upon success
   * @returns A list of connected addresses
   */
  abstract connect(opts: ConnectOptions): Promise<Address[]>;

  /**
   * @async
   * @description Disconnect from the wallet. Implementors are expected to emmit a `disconnect` event upon success
   */
  abstract disconnect(): Promise<void>;

  /**
   * @description Retrieve the wallet's blockchain's wormhole chain id
   * @see The {@link https://github.com/XLabs/wallet-aggregator-sdk/blob/e00efc8aba5fcea1f65b54bf8953a405bdeaf52b/packages/wallets/core/src/constants.ts constants} file for a detailed map of the available chains
   */
  abstract getChainId(): CID;

  /**
   * @description Returns the connected wallet's address
   * @returns A string address if the wallet is connected, undefined if not
   */
  abstract getAddress(): Address | undefined;

  /**
   * @description Returns a collection of connected addresses
   * @returns A non-empty array of addresses if connected, an empty array if not. The returned value from `getAddress` should be present in this array.
   */
  abstract getAddresses(): Address[];

  /**
   * @description Set the main address to operate with (sign transactions, etc.)
   * @param address The new address to operate with
   * @throws Throws if the address can not be set as the main address
   * @throws {NotSupported} May throw NotSupported error if the wallet does not implement it
   */
  abstract setMainAddress(address: Address): void;

  /**
   * @async
   * @description Retrieve the connected account's balance
   * @throws {NotSupported} May throw NotSupported error if the wallet does not implement it
   */
  abstract getBalance(): Promise<string>;

  /**
   * @async
   * @description Sign an unsigned transaction
   *
   * Caveat: some wallets/libraries do not implement separate workflows for signing and sending the tx (e.g. ethers.js); instead, they implement a Sign & Send flow.
   *
   * In order not to break the abstract workflow, implementors of this wallets should return the same unsigned transaction object, so that from a Dapp developer perspective a signing operation for any wallet can be implemented as following
   *
   * ```ts
   * const unsigned = buildTx();
   * const signed = await wallet.signTransaction(unsigned);
   * const result = await wallet.sendTransaction(signed);
   * ```
   *
   * @param {BUT} tx The transaction object or parameters to sign
   * @returns {BST} A signed transaction object, ready to send to the network
   */
  abstract signTransaction(
    tx: SignTransactionInput
  ): Promise<SignTransactionResult>;

  /**
   * @async
   * @description Send a signed transaction to the network
   *
   * @param {BST} tx The signed transaction to send to the network
   * @returns {SendTransactionResult<R>} A SendTransactionResult object, comprised of a string `id` field, which indicates the resulting transaction/receipt id/hash, and a `data` field, which holds details on the operation result (e.g. a transaction receipt)
   */
  abstract sendTransaction(
    tx: SendTransactionInput
  ): Promise<SendTransactionResult<SendTransactionResultData>>;

  /**
   * @async
   * @description Sign a message
   * @param {BM} msg The message to sign
   * @returns {BSM} A signature of the message, signed by the connected account
   * @throws {NotSupported} May throw NotSupported error if the wallet does not implement it
   */
  abstract signMessage(msg: SignMessageInput): Promise<SignMessageResult>;

  /** Retrieve the wallet's icon encoded as a base64 string */
  abstract getIcon(): IconSource;

  /** Retrieve whether the wallet is connected or not */
  abstract isConnected(): boolean;

  /**
   * Retrieve the wallet's blockchain's network info.
   * @returns An object holding the network information (e.g. chainId for EVM chains), if possible. If the value is undefined it does not strictly mean the wallet is not connected.
   */
  abstract getNetworkInfo(): NetworkInfo | undefined;

  /**
   * Wraps the `signTransaction` and `sendTransaction` methods into one operation
   * @param {BUT} tx The transaction object or parameters to sign and send
   * @returns {SendTransactionResult<R>} A SendTransactionResult object
   * @see See {@link signTransaction} and {@link sendTransaction} for a detailed description on each step
   */
  abstract signAndSendTransaction(
    tx: SignAndSendTransactionInput
  ): Promise<SendTransactionResult<SignAndSendTransactionResultData>>;

  /**
   * Retrieve the wallet's current state
   *
   * The possible states are as those used by the {@link https://github.com/solana-labs/wallet-adapter solana} and {@link https://github.com/aptos-labs/aptos-wallet-adapter aptos} libraries, summarized as follows:
   *  * `Installed`: the wallet was detected through the global scope or any other mechanism and can be interacted with. Example: `window.ethereum` for Metamask or `window.phantom` for Phantom wallet)
   *  * `NotDetected`: as opposed to `Installed`, no point of interaction with the wallet was found, and thus it is not available. Users can be redirected to the project url offered by `getUrl`
   *  * `Loadable`: the wallet might not require installation, and thus can be interacted with after being loaded
   *  * `Unsupported`: the wallet is not supported by the environment
   *
   * @returns The wallet's state. Defaults to Installed.
   */
  getWalletState(): WalletState {
    // default
    return WalletState.Installed;
  }
}
