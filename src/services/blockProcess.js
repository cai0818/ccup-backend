import { Worker, isMainThread, parentPort } from 'worker_threads';

import PQueue from "p-queue";
import createLogger from "../common/logger.js";

import { models as db } from "../utils/postgres.js"
import redis from "../utils/redis.js";
import publicClient from "../utils/evm.js";
import { wait } from "../common/wait.js";
import { contractAbi as carbonContractAbi, contractTransferEvent as carbonContractTransferEvent, contractAddress as carbonContractAddress } from "../contracts/CARBON.abi.js";
import { contractAbi as creportContractAbi, contractTransferEvent as creportContractTransferEvent, contractAddress as creportContractAddress } from "../contracts/CREPORT.abi.js";
import { _decryptData } from '../utils/sm2.js';

const logger = createLogger("blockProcess");
const evmQueue = new PQueue({ concurrency: 5 });
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const ZERO_ACCOUNT_ID = 0;
const DEAD_ADDR = "0x000000000000000000000000000000000000dEaD";
const DEAD_ACCOUNT_ID = -1;

const processBlock = async (height) => {
    const currentNumber = await publicClient.getBlockNumber({ cacheTime: 300 });
    if (height > currentNumber) {
        await wait(500);
        return processBlock(height);
    }

    const tokenLogs = await getLogs(height, height, carbonContractAddress, [carbonContractTransferEvent]);
    const nftLogs = await getLogs(height, height, creportContractAddress, [creportContractTransferEvent]);
    await processTokenLogs(tokenLogs);
    await processNftLogs(nftLogs);
};

const processHistoricalBlocks = async (from) => {
    const currentBlock = await publicClient.getBlock({ blockTag: "latest" });
    const currentNumber = currentBlock.number;
    // if from is null, start from the last 50000 blocks
    from = from || currentNumber - 100n;
    if (from > currentNumber) return currentNumber;

    const tokenLogs = await getLogs(from, currentNumber, carbonContractAddress, [carbonContractTransferEvent]);
    const nftLogs = await getLogs(from, currentNumber, creportContractAddress, [creportContractTransferEvent]);
    await processTokenLogs(tokenLogs);
    await processNftLogs(nftLogs);
    return currentNumber;
}

const getLogs = async (fromBlock, toBlock, contractAddress, contractEvents) => {
    // Check if string, convert to BigInt
    if (typeof fromBlock === "string") fromBlock = BigInt(fromBlock);
    if (typeof toBlock === "string") toBlock = BigInt(toBlock);

    const logs = await publicClient.getLogs({
        address: contractAddress.toLowerCase(),
        events: contractEvents,
        fromBlock: fromBlock,
        toBlock: toBlock,
    })

    return logs;
}

const processTokenLogs = async (logs) => {
    for (const [index, e] of logs.entries()) {
        if (e.removed) continue;
        logger.debug(e);
        if (e.eventName === "Transfer") {
            // Mint
            if (e.args.from === ZERO_ADDR) {
                logger.debug(`Minted token amount ${e.args.value} to ${e.args.to} at block ${e.blockNumber}`);
            }

            // Burn by user
            if (e.args.to === DEAD_ADDR) {
                logger.debug(`Burned token from ${e.args.from} for ${e.args.value} at block ${e.blockNumber}`);
            }

            // Transfer between users
            if (e.args.from !== ZERO_ADDR && e.args.to !== ZERO_ADDR) {
                logger.debug(`Transferred token from ${e.args.from} to ${e.args.to} for ${e.args.value} at block ${e.blockNumber}`);
            }

            await writeTransactionLog(e.transactionHash, e.blockNumber, e.args.from, e.args.to, e.args.value, "TOKEN", null);
        }


    }
}

const processNftLogs = async (logs) => {
    for (const [index, e] of logs.entries()) {
        if (e.removed) continue;
        const tokenId = e.args.tokenId;
        logger.debug(e);
        if (!tokenId) throw new Error("Token ID not found");
        const tokenIdStr = tokenId.toString();

        // Do something after event transfer
        if (e.eventName === "Transfer") {
            // Mint
            if (e.args.from === ZERO_ADDR) {
                logger.debug(`Minted token ${tokenIdStr} to ${e.args.to} at block ${e.blockNumber}`);
                await dumpNft(tokenId, e.transactionHash);
            }
            // Burn
            else if (e.args.to === ZERO_ADDR) {
                logger.debug(`Burned token ${tokenIdStr} at block ${e.blockNumber}`);
            }
            // Transfer
            else {
                logger.debug(`Transferred token ${tokenIdStr} from ${e.args.from} to ${e.args.to} at block ${e.blockNumber}`);
            }
            await writeTransactionLog(e.transactionHash, e.blockNumber, e.args.from, e.args.to, 0, "NFT", tokenId);
        }
    }
}

const dumpNft = async (tokenId, transactionHash) => {
    const [tokenDataMap] = await Promise.all([
        evmQueue.add(() => publicClient.readContract({
            abi: creportContractAbi,
            address: creportContractAddress,
            functionName: "tokenDataMap",
            args: [tokenId],
        })),
    ]);
    logger.info(`Dumped token ${tokenId} with report info: ${JSON.stringify(tokenDataMap)}`);
    await processReportNft(tokenDataMap[1], tokenId, transactionHash);
    return tokenDataMap;
}

const writeTransactionLog = async (transactionHash, blockNumber, from, to, value, transactionContract, nftId) => {
    // TransactionHash / from / to remove "0x"
    transactionHash = transactionHash.toLowerCase().replace("0x", "");

    const transactionExist = await db.tblTransaction.findOne({
        where: { transaction_hash: transactionHash, transaction_type: transactionContract === "TOKEN" ? 1 : 2 },
    });

    if (transactionExist) {
        // 检查数据一致
        logger.warn(`Transaction ${transactionHash} already exists`);
        return;
    }

    let fromAccountId;
    let toAccountId;

    if (from === ZERO_ADDR) fromAccountId = ZERO_ACCOUNT_ID;
    if (from === DEAD_ADDR) fromAccountId = DEAD_ACCOUNT_ID;
    if (to === ZERO_ADDR) toAccountId = ZERO_ACCOUNT_ID;
    if (to === DEAD_ADDR) toAccountId = DEAD_ACCOUNT_ID;

    // Check if from and to is a valid account
    // skip ZERO_ADDR and DEAD_ADDR
    if (from !== ZERO_ADDR && from !== DEAD_ADDR) {
        const fromAccount = await db.tblWallet.findOne({
            where: { wallet_address: from.toLowerCase().replace("0x", "") },
        });

        if (!fromAccount) {
            logger.error(`Account ${from} not found`);
            return;
        }

        fromAccountId = fromAccount.user_id;
    }

    if (to !== ZERO_ADDR && to !== DEAD_ADDR) {
        const toAccount = await db.tblWallet.findOne({
            where: { wallet_address: to.toLowerCase().replace("0x", "") },
        });

        if (!toAccount) {
            logger.error(`Account ${to} not found`);
            return;
        }

        toAccountId = toAccount.user_id;
    }

    if (transactionContract === "TOKEN") {
        await db.tblTransaction.create({
            block_height: blockNumber,
            transaction_hash: transactionHash,
            from_account: fromAccountId,
            to_account: toAccountId,
            transaction_type: 1,
            amount: BigInt(value) / BigInt(100)
        });

        // Process order transaction
        await processOrderTransaction(transactionHash, from, to, value);
    } else if (transactionContract === "NFT") {
        await db.tblTransaction.create({
            block_height: blockNumber,
            transaction_hash: transactionHash,
            from_account: fromAccountId,
            to_account: toAccountId,
            transaction_type: 2,
            amount: 1,
            nft_id: nftId
        });
    }
}

const processOrderTransaction = async (transactionHash, from, to, value) => {
    const buyerWallet = await db.tblWallet.findOne({
        where: { wallet_address: to.toLowerCase().replace("0x", "") },
    });

    if (!buyerWallet) {
        return false;
    }

    const sellerWallet = await db.tblWallet.findOne({
        where: { wallet_address: from.toLowerCase().replace("0x", "") },
    });

    if (!sellerWallet) {
        return false;
    }

    const buyerAccountId = buyerWallet.user_id;
    const sellerAccountId = sellerWallet.user_id;

    // Try to find an existing order
    const order = await db.tblOrder.findOne({
        where: { buyer_id: buyerAccountId, seller_id: sellerAccountId, amount: BigInt(value) / BigInt(100) },
    });

    if (!order) {
        return false;
    }

    // Update order status
    await db.tblOrder.update({
        status: 2,
        transaction_hash: transactionHash,
    }, {
        where: { id: order.id },
    });

    return true;
}


const processReportNft = async (encryptedData, nftId, transactionHash) => {
    const reportData = encryptedData.split(".")[0];
    const reportDataJson = await _decryptData(reportData);

    transactionHash = transactionHash.toLowerCase().replace("0x", "");

    logger.info(`Decrypted report data: ${reportDataJson}`);
    const { uuid } = JSON.parse(reportDataJson);

    if (!uuid) {
        logger.error("UUID not found in report data");
        return;
    }

    const report = await db.tblReport.findOne({
        where: { uuid: uuid },
    });

    if (!report) {
        logger.error(`Report ${uuid} not found`);
        return;
    }

    await db.tblReport.update({
        nft_id: nftId,
        transaction_hash: transactionHash,
    }, {
        where: { id: report.id },
    });
}

// Task
if (!isMainThread) {
    const startBlock = process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : 1n;
    const processedHeightKey = "app:blockProcess:ph";
    const currentProcessedHeight = await redis.get(processedHeightKey);
    let processedHeight = currentProcessedHeight ? BigInt(currentProcessedHeight) : startBlock;

    const t1 = Date.now();
    const historicalBlock = await processHistoricalBlocks(processedHeight);
    const t2 = Date.now();
    logger.info(`Processed historical blocks from ${processedHeight} to ${historicalBlock} in ${t2 - t1}ms`);

    await redis.set(processedHeightKey, historicalBlock.toString());
    processedHeight = historicalBlock;

    while (true) {
        const t1 = Date.now();
        await processBlock(processedHeight + 1n);
        const t2 = Date.now();
        logger.info(`Processed block ${processedHeight + 1n} in ${t2 - t1}ms`);
        await redis.set(processedHeightKey, (processedHeight + 1n).toString());
        processedHeight += 1n;
        await redis.set(processedHeightKey, processedHeight.toString());
    }
}