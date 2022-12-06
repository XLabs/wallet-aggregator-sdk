// import { useChangeWallet } from "./WalletContext";
import { useChangeWallet, MuiChainSelector } from "wormhole-wallet-aggregator-react";

const Selector = () => {
    const changeWallet = useChangeWallet();

    const onChange = (event: any) => {
        const chainId = event.target.value;
        changeWallet(chainId);
    }

    return (
        <MuiChainSelector
            select
            variant="outlined"
            onChange={onChange} />
    )  
}

export default Selector;
