import { ListItemText, MenuItem, TextField } from "@material-ui/core";
import { useCallback } from "react";
import { ChainId } from "wormhole-wallet-aggregator-core";
import { useChangeWallet, useWalletsForChain } from "wormhole-wallet-aggregator-react";

interface WalletSelectorProps {
    chainId: ChainId
}

export default function WalletSelector({ chainId }: WalletSelectorProps) {
    const changeWallet = useChangeWallet();
    const wallets = useWalletsForChain(chainId);

    const onChange = useCallback((ev: any) => {
        const walletName = ev.target.value;
        const wallet = wallets.find(w => w.getName() === walletName);
        if (wallet) changeWallet(wallet);
    }, [ wallets, changeWallet ]);

    return (
        <TextField select variant="outlined" onChange={onChange}>
            {wallets.map(wallet =>
                <MenuItem key={`wallet-selector-${wallet.getName()}`} value={wallet.getName()}>
                    <ListItemText>{wallet.getName()}</ListItemText>
                </MenuItem>            
            )}
        </TextField>
    );
}
