import {
    ListItemIcon,
    ListItemText,
    makeStyles, MenuItem, OutlinedTextFieldProps, TextField
} from "@material-ui/core";
import clsx from "clsx";
import { AlgorandWallet, EthereumWalletConnectWallet, EthereumWeb3Wallet, CHAINS as CHAIN_IDS, ChainId } from "wormhole-wallet-aggregator";
import algorandIcon from "../icons/algorand.svg";
import ethIcon from "../icons/eth.svg";

export interface ChainInfo {
    id: ChainId;
    name: string;
    logo: string;
}

const CHAINS = [
    {
        id: CHAIN_IDS['algorand'],
        name: "Algorand",
        logo: algorandIcon,
    },
    {
      id: CHAIN_IDS['ethereum'],
      name: "Ethereum (Goerli)",
      logo: ethIcon,
    }
]

const PROVIDERS = {
    [CHAIN_IDS['algorand']]: [AlgorandWallet],
    [CHAIN_IDS['ethereum']]: [EthereumWeb3Wallet, EthereumWalletConnectWallet],
};
  
const useStyles = makeStyles((theme) => ({
    select: {
        "& .MuiSelect-root": {
            display: "flex",
            alignItems: "center",
        },
    },
    listItemIcon: {
        minWidth: 40,
    },
    icon: {
        height: 24,
        maxWidth: 24,
    },
}));

const createChainMenuItem = ({ id, name, logo }: ChainInfo, classes: any) => (
    <MenuItem key={id} value={id}>
        <ListItemIcon className={classes.listItemIcon}>
            <img src={logo} alt={name} className={classes.icon} />
        </ListItemIcon>
        <ListItemText>{name}</ListItemText>
    </MenuItem>
);

interface MuiChainSelectorProps extends OutlinedTextFieldProps {
    chains?: ChainInfo[];
}

export function MuiChainSelector({ chains = CHAINS, ...rest }: MuiChainSelectorProps) {
    const classes = useStyles();

    return (
        <TextField {...rest} className={clsx(classes.select, rest.className)}>
            {chains.map((chain) => createChainMenuItem(chain, classes))}
        </TextField>
    );
}
