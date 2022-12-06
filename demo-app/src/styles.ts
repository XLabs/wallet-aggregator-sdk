import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(() => ({
    appContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        width: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        flexDirection: 'column'
    },
    row: {
        display: 'flex',
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    pubkey: {
        fontSize: 16,
        marginLeft: 10
    },
    signContainer: {

    }
}));

export default useStyles;
