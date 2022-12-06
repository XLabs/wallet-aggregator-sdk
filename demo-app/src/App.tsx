import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_ETH, CONTRACTS, transferFromAlgorand, transferFromEthTx
} from '@certusone/wormhole-sdk';
import { Button } from '@material-ui/core';
import algosdk from 'algosdk';
import clsx from 'clsx';
import { parseUnits } from "ethers/lib/utils";
import { useState } from 'react';
import './App.css';
import ChainSelector from './components/Selector';
import { EthereumWallet, Wallet } from 'wormhole-wallet-aggregator';
import { useWallet } from 'wormhole-wallet-aggregator-react';
import useStyles from './styles';


// COMO RESUELVE SOLANA CUANDO HAY UN CAMBIO DE WALLET?

const ALGORAND_HOST = {
    algodToken: "",
    algodServer: "https://testnet-api.algonode.cloud",
    algodPort: "",
};


const buildAlgorandTxs = async function(wallet: Wallet): Promise<any> {
  const pubkey = await wallet.getPublicKey();
  const amount = "1";
  const decimals = 6;

  const baseAmountParsed = parseUnits(amount, decimals);
  const feeParsed = parseUnits("0", decimals);
  const transferAmountParsed = baseAmountParsed.add(feeParsed);
  const algodClient = new algosdk.Algodv2(
    ALGORAND_HOST.algodToken,
    ALGORAND_HOST.algodServer,
    ALGORAND_HOST.algodPort
  );
  // const tokenAddress = '0xF890982f9310df57d00f659cf4fd87e65adEd8d7';
  const recipientAddress = '0xE6990c7e206D418D62B9e50c8E61f59Dc360183b';
  const txs = await transferFromAlgorand(
    algodClient,
    BigInt(CONTRACTS['TESTNET'].algorand.token_bridge),
    BigInt(CONTRACTS['TESTNET'].algorand.core),
    pubkey!,
    BigInt(0),
    transferAmountParsed.toBigInt(),
    Buffer.from(recipientAddress).toString('hex'),
    CHAIN_ID_ETH,
    feeParsed.toBigInt()
  );

  return txs.map((t: any) => t.tx);
}

const buildEthTxs = async function(wallet: Wallet): Promise<any> {
  // const amount = "0.001";
  const usdcAmount = "1";
  const decimals = 18;

  const baseAmountParsed = parseUnits(usdcAmount, decimals);
  const feeParsed = parseUnits("0", decimals);
  const transferAmountParsed = baseAmountParsed.add(feeParsed);

  const TOKEN_BRIDGE_ADDRESS = CONTRACTS['TESTNET'].ethereum.token_bridge;
  const USDC_TOKEN_ADDRESS = '0x466595626333c55fa7d7Ad6265D46bA5fDbBDd99';
  const target = algosdk.decodeAddress('46QNIYQEMLKNOBTQC56UEBBHFNH37EWLHGT2KGL3ZGB4SW77W6V7GBKPDY').publicKey

  return transferFromEthTx(
    TOKEN_BRIDGE_ADDRESS,
    (wallet as EthereumWallet).getSigner(),
    USDC_TOKEN_ADDRESS,
    transferAmountParsed,
    CHAIN_ID_ALGORAND,
    target
  );
}

const txBuilders: { [key: number]: (wallet: Wallet) => Promise<any> } = {
  [CHAIN_ID_ALGORAND]: buildAlgorandTxs,
  [CHAIN_ID_ETH]: buildEthTxs
};

function App() {
  const styles = useStyles();
  const wallet = useWallet();

  const [ pubKey, setPubKey ] = useState<string | undefined>();
  const [ result, setResult ] = useState<any>();
  const [ error, setError ] = useState<any>();

  const onClickConnect = async () => {
    if (!wallet) {
      return;
    }

    await wallet.connect();

    const pubKey = await wallet.getPublicKey();
    setPubKey(pubKey);
  }

  const onClickSign = async () => {
    if (!wallet) return;
    setResult(undefined);
    setError(undefined);

    try {
      const builder = txBuilders[wallet.getChainId()];
      const toSign = await builder(wallet);
      const signed = await wallet.signTransaction(toSign);
      const res = await wallet.sendTransaction(signed);

      setResult(res);
    } catch (e) {
      console.log('ERROR', e);
      setError(e);
    }
  }

  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header> */}

      <div className={clsx(styles.appContainer)}>
        <div className={clsx(styles.content)}>
          <ChainSelector />

          <div className={clsx(styles.row)}>
            {wallet && <Button variant='contained' onClick={onClickConnect}>Connect</Button>}
            {pubKey && <span className={clsx(styles.pubkey)}>{pubKey}</span>}
          </div>

          <div className={clsx(styles.row)}>
            {pubKey && <Button variant='contained' onClick={onClickSign}>Sign</Button>}
            {result && <span className={clsx(styles.pubkey)}>{typeof result === 'object' ? JSON.stringify(result) : result}</span>}
          </div>

          <div className={clsx(styles.row)}>
            {error && <span className={clsx(styles.pubkey)}>{typeof error === 'object' ? JSON.stringify(error) : error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
