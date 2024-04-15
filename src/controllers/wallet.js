import { privateKeyToAccount } from "viem/accounts";
import { client as publicClient, walletClient } from "../utils/evm.js";
import { models as db } from "../utils/postgres.js"
import { contractAbi as carbonContractAbi, contractAddress as carbonContractAddress } from "../contracts/CARBON.abi.js";
import { contractAbi as creportContractAbi, contractAddress as creportContractAddress } from "../contracts/CREPORT.abi.js";

import createLogger from "../common/logger.js";

const logger = createLogger("walletController");

export const bindWallet = async (ctx) => {
    const { id } = ctx.session.user;
    let { walletAddress } = ctx.request.body;

    if (walletAddress.startsWith("0x")) {
        walletAddress = walletAddress.slice(2);
    }

    walletAddress = walletAddress.toLowerCase();

    try {
        const walletAddr = await db.tblWallet.findOne({
            where: {
                wallet_address: walletAddress
            }
        });

        if (walletAddr) {
            ctx.fail({
                code: 400,
                message: "Wallet address already exists",
                data: null
            });
            return;
        }

        await db.tblWallet.create({
            wallet_address: walletAddress,
            user_id: id
        });

        ctx.success({
            code: 200,
            message: "Wallet address binded successfully",
            data: null
        });
    } catch (e) {
        logger.error(e);
        ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }
}

export const unbindWallet = async (ctx) => {
    const { id } = ctx.session.user;
    const { walletAddress } = ctx.request.body;

    try {
        await db.tblWallet.destroy({
            where: {
                wallet_address: walletAddress,
                user_id: id
            }
        });

        ctx.success({
            code: 200,
            message: "Wallet address unbinded successfully",
            data: null
        });
    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }
}

export const getWalletAddress = async (ctx) => {
    const { id } = ctx.session.user;

    try {
        const wallet = await db.tblWallet.findOne({
            where: {
                user_id: id
            }
        });

        if (!wallet) {
            ctx.success({
                code: 200,
                message: "Wallet address not found",
                data: {
                    wallet_address: null
                }
            });
            return;
        }

        ctx.success({
            code: 200,
            message: "Wallet address found",
            data: {
                wallet_address: wallet.wallet_address
            }
        });
    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }
}

export const _getWalletBalance = async (walletAddress) => {

    if (!walletAddress.startsWith("0x")) {
        walletAddress = `0x${walletAddress}`
    }

    const res = await publicClient.readContract({
        address: carbonContractAddress,
        abi: carbonContractAbi,
        functionName: "balanceOf",
        args: [walletAddress]
    });

    return res;
}

export const _allowAccount = async (account) => {
    const walletAccount = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);

    const res = await walletClient.writeContract({
        address: carbonContractAddress,
        abi: carbonContractAbi,
        functionName: "allowAccount",
        args: [account],
        account: walletAccount
    });

    return res;
}

export const _disallowAccount = async (account) => {
    const walletAccount = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);

    const res = await walletClient.writeContract({
        address: carbonContractAddress,
        abi: carbonContractAbi,
        functionName: "disallowAccount",
        args: [account],
        account: walletAccount
    });

    return res;
}

export const _mintToken = async (account, amount) => {
    const walletAccount = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);

    const res = await walletClient.writeContract({
        address: carbonContractAddress,
        abi: carbonContractAbi,
        functionName: "mint",
        args: [account, BigInt(amount) * BigInt(10 ** 2)],
        account: walletAccount
    });

    return res;
}

export const _mintNFT = async (account, tokenId, tokenData) => {
    const walletAccount = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);

    const res = await walletClient.writeContract({
        address: creportContractAddress,
        abi: creportContractAbi,
        functionName: "safeMint",
        args: [account, BigInt(tokenId), tokenData],
        account: walletAccount
    });

    return res;
}

export const getNftTokenData = async (ctx) => {

    const { tokenId } = ctx.params;

    const tokenDataMap = await publicClient.readContract({
        address: creportContractAddress,
        abi: creportContractAbi,
        functionName: "tokenDataMap",
        args: [tokenId],
    });

    if (!tokenDataMap) {
        ctx.fail({
            code: 404,
            message: "NFT token data not found",
            data: null
        });
        return;
    }

    const payload = tokenDataMap[1]
    const splitedPayload = payload.split(".");
    const encryptedData = splitedPayload[0];
    const signature = splitedPayload[1];
    
    ctx.success({
        code: 200,
        message: "NFT token data fetched successfully",
        data: {
            encryptedData,
            signature
        }
    });
}