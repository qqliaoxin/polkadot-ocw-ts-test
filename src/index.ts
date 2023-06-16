import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { metadata } from '@polkadot/types/interfaces/essentials';

const WEB_SOCKET = "ws://localhost:9944";
const sleep = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

// connection to substrate chain
const connectSubstrate = async () => {
    const wsProvider = new WsProvider(WEB_SOCKET);
    const api = await ApiPromise.create({ provider: wsProvider, types: {} })
    await api.isReady;
    console.log("connection to substrate is OK.")
    return api;
}
// get const value
const getConst = async (api: ApiPromise) => {
    const existentialDeposit = await api.consts.balances.existentialDeposit.toHuman();
    return existentialDeposit;
}
// get free balance variable
const getFreeBalance = async (api: ApiPromise, address: String) => {
    const aliceAccount = await api.query.system.account(address);
    // return aliceAccount["data"]["free"].toHuman();
    return aliceAccount;
}

const printAliceBobBalance = async (api: ApiPromise) => {
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const bob = keyring.addFromUri("//Bob");
    console.log("alice balance is:", await getFreeBalance(api, alice.address));
    console.log("bob balance is:", await getFreeBalance(api, bob.address));
}

// submit a transfer transaction
const transferFromAliceToBob = async (api: ApiPromise, amount: number) => {
    const keyring = new Keyring({ type: "sr25519" });
    const alice = keyring.addFromUri("//Alice");
    const bob = keyring.addFromUri("//Bbo");
    await api.tx.balances.transfer(bob.address, amount)
        .signAndSend(alice, res => {
            console.log('Tx status:',res.status);
        })
}

// subscribe balance change
const subscribeAliceBalance = async (api:ApiPromise) => {
    const keyring = new Keyring({type:"sr25519"});
    const alice = keyring.addFromUri("//Alice");
    await api.query.system.account(alice.address,(aliceAcct: { data: { free: any; }; }) => {
        console.log("Subscribe to Alice account.");
        const aliceFreeSub = aliceAcct.data.free;
        console.log('Alice Account (sub): ',aliceFreeSub.toHuman());
    });
}

// get metadata
const getMetadata = async (api: ApiPromise) => {
    const metadata = await api.rpc.state.getMetadata();
    console.log("print metadata:");
    console.log(metadata);
    return metadata;
}
// OCW indexing
const localStorageGet = async (api: ApiPromise) => {
    const encodedkey = api.createType("Bytes",[105, 110, 100, 101, 120, 105, 110, 103, 95, 49, 64, 7, 0, 0, 0]);
    console.log(`print encodedkey: ${encodedkey}`,encodedkey);
    const res = await api.rpc.offchain.localStorageGet('PERSISTENT', encodedkey);
    console.log(`print localStorageGet: ${res}`,res);

}

const main = async () => {
    const api = await connectSubstrate();
    console.log("const value existentialDeposit is:", await getConst(api));

    // await printAliceBobBalance(api);

    // await transferFromAliceToBob(api, 10 ** 12);
    // await sleep(6000);

    // await subscribeAliceBalance(api);
    // await sleep(6000);

    // await getMetadata(api);
    await localStorageGet(api);
    console.log("game over!")
};

main()
    .then(() => {
        console.log("successfully exited");
        process.exit(0);
    })
    .catch(err => {
        console.log("error occur:", err);
        process.exit(1);
    })