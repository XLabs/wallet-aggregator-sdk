import { MuiChainSelector } from "./MuiChainSelector";

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
