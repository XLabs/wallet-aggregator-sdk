import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { WalletContextProvider } from "@xlabs-libs/wallet-aggregator-react";
import { initWallets } from "@xlabs-libs/wallet-aggregator-react-init";

const wallets = initWallets();

ReactDOM.render(
  <React.StrictMode>
    <WalletContextProvider availableWallets={wallets}>
      <App />
    </WalletContextProvider>
  </React.StrictMode>,
  document.getElementById("root") as HTMLElement
);

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement
// );
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
