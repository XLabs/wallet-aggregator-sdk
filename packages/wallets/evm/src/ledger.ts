// import { LedgerConnector } from "@wagmi/core/connectors/ledger";
// import { EVMWallet, EVMWalletConfig, EVMWalletType } from "./evm";

// interface LedgerConnectOptions {
//   bridge?: string;
//   chainId?: number;
//   enableDebugLogs?: boolean;
//   rpc?: {
//     [chainId: number]: string;
//   };
// }

// export type LedgerWalletConfig = EVMWalletConfig<LedgerConnectOptions>;

// export class LedgerWallet extends EVMWallet<
//   LedgerConnector,
//   LedgerConnectOptions
// > {
//   constructor(config: LedgerWalletConfig) {
//     super(config);
//   }

//   protected createConnector(): LedgerConnector {
//     return new LedgerConnector({
//       chains: this.chains,
//       options: this.connectorOptions,
//     });
//   }

//   getName(): string {
//     return "Ledger Connect";
//   }

//   getUrl(): string {
//     return "https://www.ledger.com/";
//   }

//   getIcon(): string {
//     return "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIzLjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA3NjguOTEgNjY5LjM1IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA3NjguOTEgNjY5LjM1OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIGQ9Ik0wLDQ3OS4yOXYxOTAuMDZoMjg5LjIyVjYyNy4ySDQyLjE0VjQ3OS4yOUgweiBNNzI2Ljc3LDQ3OS4yOVY2MjcuMkg0NzkuNjl2NDIuMTRoMjg5LjIyVjQ3OS4yOUg3MjYuNzd6IE0yODkuNjQsMTkwLjA2Cgl2Mjg5LjIyaDE5MC4wNXYtMzguMDFIMzMxLjc4VjE5MC4wNkgyODkuNjR6IE0wLDB2MTkwLjA2aDQyLjE0VjQyLjE0aDI0Ny4wOFYwSDB6IE00NzkuNjksMHY0Mi4xNGgyNDcuMDh2MTQ3LjkyaDQyLjE0VjBINDc5LjY5eiIKCS8+Cjwvc3ZnPgo=";
//   }

//   static getWalletType(): EVMWalletType {
//     return EVMWalletType.Ledger;
//   }
// }
export class LedgerWallet {}
