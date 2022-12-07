// import { useChangeWallet } from "./WalletContext";
import { MuiChainSelector } from "wormhole-wallet-aggregator-react";

interface ChainSelectorProps {
    onChange: (event: any) => void;
}

const ChainSelector = ({ onChange }: ChainSelectorProps) => {
    return (
        <MuiChainSelector
            select
            variant="outlined"
            onChange={onChange} />
    )  
}

export default ChainSelector;
