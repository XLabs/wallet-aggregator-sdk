import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from 'ethers';
import { EVMWallet } from "./evm";

// detectEthereumProvider does not export its return type interface
export interface MetaMaskEthereumProvider {
  isMetaMask?: boolean;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

export class EVMWeb3Wallet extends EVMWallet {
  private metamaskProvider?: MetaMaskEthereumProvider;

  constructor() {
    super();
  }

  getName(): string {
    return 'Eth Metamask';
  }

  async innerConnect(): Promise<void> {
    this.metamaskProvider = await detectEthereumProvider() || undefined;

    if (!this.metamaskProvider) throw new Error('Failed to detect provider')

    this.provider = new ethers.providers.Web3Provider(
      this.metamaskProvider,
      'any'
    );

    this.metamaskProvider!.on('accountsChanged', () => this.onAccountsChanged());
    this.metamaskProvider!.on('chainChanged', (chainId: number) => this.onChainChanged(chainId));

    await this.provider.send('eth_requestAccounts', []);
  }

  async innerDisconnect(): Promise<void> {
    this.metamaskProvider?.removeAllListeners();
    this.metamaskProvider = undefined;
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjAiIHk9IjAiIHZpZXdCb3g9IjAgMCAzMTguNiAzMTguNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzE4LjYgMzE4LjYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxzdHlsZT4uc3QxLC5zdDIsLnN0Mywuc3Q0LC5zdDUsLnN0Niwuc3Q5e2ZpbGw6I2U0NzYxYjtzdHJva2U6I2U0NzYxYjtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmR9LnN0Miwuc3QzLC5zdDQsLnN0NSwuc3Q2LC5zdDl7ZmlsbDojZDdjMWIzO3N0cm9rZTojZDdjMWIzfS5zdDMsLnN0NCwuc3Q1LC5zdDYsLnN0OXtmaWxsOiMyMzM0NDc7c3Ryb2tlOiMyMzM0NDd9LnN0NCwuc3Q1LC5zdDYsLnN0OXtmaWxsOiNjZDYxMTY7c3Ryb2tlOiNjZDYxMTZ9LnN0NSwuc3Q2LC5zdDl7ZmlsbDojZTQ3NTFmO3N0cm9rZTojZTQ3NTFmfS5zdDYsLnN0OXtmaWxsOiNmNjg1MWI7c3Ryb2tlOiNmNjg1MWJ9LnN0OXtmaWxsOiM3NjNkMTY7c3Ryb2tlOiM3NjNkMTZ9PC9zdHlsZT48cGF0aCBzdHlsZT0iZmlsbDojZTI3NjFiO3N0cm9rZTojZTI3NjFiO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZCIgZD0ibTI3NC4xIDM1LjUtOTkuNSA3My45TDE5MyA2NS44eiIvPjxwYXRoIGNsYXNzPSJzdDEiIGQ9Im00NC40IDM1LjUgOTguNyA3NC42LTE3LjUtNDQuM3pNMjM4LjMgMjA2LjhsLTI2LjUgNDAuNiA1Ni43IDE1LjYgMTYuMy01NS4zek0zMy45IDIwNy43IDUwLjEgMjYzbDU2LjctMTUuNi0yNi41LTQwLjZ6Ii8+PHBhdGggY2xhc3M9InN0MSIgZD0ibTEwMy42IDEzOC4yLTE1LjggMjMuOSA1Ni4zIDIuNS0yLTYwLjV6TTIxNC45IDEzOC4ybC0zOS0zNC44LTEuMyA2MS4yIDU2LjItMi41ek0xMDYuOCAyNDcuNGwzMy44LTE2LjUtMjkuMi0yMi44ek0xNzcuOSAyMzAuOWwzMy45IDE2LjUtNC43LTM5LjN6Ii8+PHBhdGggY2xhc3M9InN0MiIgZD0ibTIxMS44IDI0Ny40LTMzLjktMTYuNSAyLjcgMjIuMS0uMyA5LjN6TTEwNi44IDI0Ny40bDMxLjUgMTQuOS0uMi05LjMgMi41LTIyLjF6Ii8+PHBhdGggY2xhc3M9InN0MyIgZD0ibTEzOC44IDE5My41LTI4LjItOC4zIDE5LjktOS4xek0xNzkuNyAxOTMuNWw4LjMtMTcuNCAyMCA5LjF6Ii8+PHBhdGggY2xhc3M9InN0NCIgZD0ibTEwNi44IDI0Ny40IDQuOC00MC42LTMxLjMuOXpNMjA3IDIwNi44bDQuOCA0MC42IDI2LjUtMzkuN3pNMjMwLjggMTYyLjFsLTU2LjIgMi41IDUuMiAyOC45IDguMy0xNy40IDIwIDkuMXpNMTEwLjYgMTg1LjJsMjAtOS4xIDguMiAxNy40IDUuMy0yOC45LTU2LjMtMi41eiIvPjxwYXRoIGNsYXNzPSJzdDUiIGQ9Im04Ny44IDE2Mi4xIDIzLjYgNDYtLjgtMjIuOXpNMjA4LjEgMTg1LjJsLTEgMjIuOSAyMy43LTQ2ek0xNDQuMSAxNjQuNmwtNS4zIDI4LjkgNi42IDM0LjEgMS41LTQ0Ljl6TTE3NC42IDE2NC42bC0yLjcgMTggMS4yIDQ1IDYuNy0zNC4xeiIvPjxwYXRoIGNsYXNzPSJzdDYiIGQ9Im0xNzkuOCAxOTMuNS02LjcgMzQuMSA0LjggMy4zIDI5LjItMjIuOCAxLTIyLjl6TTExMC42IDE4NS4ybC44IDIyLjkgMjkuMiAyMi44IDQuOC0zLjMtNi42LTM0LjF6Ii8+PHBhdGggc3R5bGU9ImZpbGw6I2MwYWQ5ZTtzdHJva2U6I2MwYWQ5ZTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQiIGQ9Im0xODAuMyAyNjIuMy4zLTkuMy0yLjUtMi4yaC0zNy43bC0yLjMgMi4yLjIgOS4zLTMxLjUtMTQuOSAxMSA5IDIyLjMgMTUuNWgzOC4zbDIyLjQtMTUuNSAxMS05eiIvPjxwYXRoIHN0eWxlPSJmaWxsOiMxNjE2MTY7c3Ryb2tlOiMxNjE2MTY7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kIiBkPSJtMTc3LjkgMjMwLjktNC44LTMuM2gtMjcuN2wtNC44IDMuMy0yLjUgMjIuMSAyLjMtMi4yaDM3LjdsMi41IDIuMnoiLz48cGF0aCBjbGFzcz0ic3Q5IiBkPSJtMjc4LjMgMTE0LjIgOC41LTQwLjgtMTIuNy0zNy45LTk2LjIgNzEuNCAzNyAzMS4zIDUyLjMgMTUuMyAxMS42LTEzLjUtNS0zLjYgOC03LjMtNi4yLTQuOCA4LTYuMXpNMzEuOCA3My40bDguNSA0MC44LTUuNCA0IDggNi4xLTYuMSA0LjggOCA3LjMtNSAzLjYgMTEuNSAxMy41IDUyLjMtMTUuMyAzNy0zMS4zLTk2LjItNzEuNHoiLz48cGF0aCBjbGFzcz0ic3Q2IiBkPSJtMjY3LjIgMTUzLjUtNTIuMy0xNS4zIDE1LjkgMjMuOS0yMy43IDQ2IDMxLjItLjRoNDYuNXpNMTAzLjYgMTM4LjJsLTUyLjMgMTUuMy0xNy40IDU0LjJoNDYuNGwzMS4xLjQtMjMuNi00NnpNMTc0LjYgMTY0LjZsMy4zLTU3LjcgMTUuMi00MS4xaC02Ny41bDE1IDQxLjEgMy41IDU3LjcgMS4yIDE4LjIuMSA0NC44aDI3LjdsLjItNDQuOHoiLz48L3N2Zz4=";
  }
}