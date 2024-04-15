import { createPublicClient, createWalletClient, defineChain, fallback, http, webSocket } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { polygonZkEvm } from "viem/chains";

const polygonCDKValidum = defineChain({
    id: 1001,
    name: "Carbon Credit Unified",
    nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [process.env.POLYGON_CDK_RPC_HTTP],
            ws: process.env.POLYGON_CDK_RPC_WS,
        }
    }
});

const transport = fallback([
    webSocket(process.env.POLYGON_MUMBAI_RPC_WS),
    http(process.env.POLYGON_MUMBAI_RPC_HTTP)
]);

export const rawClient = createPublicClient({
    chain: polygonCDKValidum,
    transport,
});

export const rawWalletClient = createWalletClient({
    chain: polygonCDKValidum,
    transport,
    account: privateKeyToAccount(process.env.WALLET_PRIVATE_KEY),
});


export const client = new Proxy(rawClient, {
    get(target, prop, receiver) {
        const fn = target[prop];
        if (typeof fn !== "function") return fn;
        return async function wrappedFn(...props) {
            let retryCount = 0;
            let e;
            while (retryCount < 3) {
                try {
                    return Promise.race([fn(...props)]);
                } catch (error) {
                    e = error;
                    retryCount += 1;
                }
            }
            throw e;
        };
    },
});

export const walletClient = new Proxy(rawWalletClient, {
    get(target, prop, receiver) {
        const fn = target[prop];
        if (typeof fn !== "function") return fn;
        return async function wrappedFn(...props) {
            let retryCount = 0;
            let e;
            while (retryCount < 3) {
                try {
                    return Promise.race([fn(...props)]);
                } catch (error) {
                    e = error;
                    retryCount += 1;
                }
            }
            throw e;
        }
    }
});

export default client;