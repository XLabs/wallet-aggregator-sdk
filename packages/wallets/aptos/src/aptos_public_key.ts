import * as SHA3 from "js-sha3";
import base58 from "bs58";

export class AptosPublicKey {
  private readonly hexString: string;

  static default() {
    return new AptosPublicKey("0".repeat(64));
  }

  address() {
    const hash = SHA3.sha3_256.create();
    hash.update(Buffer.from(this.asPureHex(), "hex"));
    hash.update("\x00");
    return "0x" + hash.hex();
  }

  asUint8Array() {
    return new Uint8Array(Buffer.from(this.asPureHex(), "hex"));
  }
  static fromBase58(base58string: string) {
    const bytes = Buffer.from(base58.decode(base58string));
    const hexString = bytes.toString("hex");
    return new AptosPublicKey(hexString);
  }
  asString() {
    return this.hexString;
  }

  asPureHex() {
    return this.hexString.substr(2);
  }

  constructor(hexString: string) {
    if (hexString.startsWith("0x")) {
      this.hexString = hexString;
    } else {
      this.hexString = `0x${hexString}`;
    }
  }
}
