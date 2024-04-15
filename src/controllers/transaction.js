import { Sequelize } from "sequelize";
import { models as db, sequelize } from "../utils/postgres.js"

import createLogger from "../common/logger.js";

const logger = createLogger("transactionController");

export const getTransaction = async (ctx) => {
    const { id } = ctx.session.user;
    const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;
    const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;

    try {
        const transactions = await db.tblTransaction.findAll({
            where: {
                [Sequelize.Op.or]: [{ from_account: id }, { to_account: id }]
            },
            order: [
                ["id", "DESC"]
            ],
            limit: limit,
            offset: (page - 1) * limit
        });

        // 新建事务，查询交易 from_account 和 to_account 的用户信息
        const transactionList = await Promise.all(transactions.map(async (transaction) => {

            // 0: Mint
            // -1: Burn
            const fromUser = transaction.from_account !== "0" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.from_account
                }
            }) : "Mint";

            const toUser = transaction.to_account !== "-1" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.to_account
                }
            }) : "Burn";

            return {
                id: transaction.id,
                from: fromUser,
                to: toUser,
                block_height: transaction.block_height,
                transaction_hash: transaction.transaction_hash,
                transaction_type: transaction.transaction_type === 1 ? "Token" : "NFT",
                nft_id: transaction.nft_id,
                amount: transaction.amount,
                created_at: transaction.created_date,
                status: transaction.status,
            };
        }));
        

        ctx.success({
            code: 200,
            message: "Transaction fetched successfully",
            data: transactionList
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

export const getCompanyTransactions = async (ctx) => {
    const { company, company_uscc } = ctx.request.query;
    const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;
    const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;

    // 如果有 company_uscc 参数，根据 company_uscc 查询 company
    let where;
    if (company_uscc) {
        where = {
            company_uscc
        };
    } else {
        where = {
            company
        };
    }

    const companyInfo = await db.tblUser.findOne({
        where
    });

    if (!companyInfo) {
        ctx.success({
            code: 200,
            message: "Company not found",
            data: []
        });
    }

    const userId = companyInfo.id;


    try {
        const transactions = await db.tblTransaction.findAndCountAll({
            where: {
                [Sequelize.Op.or]: [{ from_account: userId }, { to_account: userId }]
            },
            order: [
                ["id", "DESC"]
            ],
            limit: limit,
            offset: (page - 1) * limit
        });

        const transactionList = await Promise.all(transactions.rows.map(async (transaction) => {

            // 0: Mint
            // -1: Burn
            const fromUser = transaction.from_account !== "0" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.from_account
                }
            }) : "Mint";

            const toUser = transaction.to_account !== "-1" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.to_account
                }
            }) : "Burn";

            return {
                id: transaction.id,
                from: fromUser,
                to: toUser,
                block_height: transaction.block_height,
                transaction_hash: transaction.transaction_hash,
                transaction_type: transaction.transaction_type === 1 ? "Token" : "NFT",
                nft_id: transaction.nft_id,
                amount: transaction.amount,
                created_at: transaction.created_date,
                status: transaction.status,
            };
        }));

        ctx.success({
            code: 200,
            message: "Transaction fetched successfully",
            data: {
                total: transactions.count,
                transactions: transactionList
            }
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

export const getTransactions = async (ctx) => {
    const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;
    const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;

    try {
        const transactions = await db.tblTransaction.findAndCountAll({
            order: [
                ["id", "DESC"]
            ],
            limit: limit,
            offset: (page - 1) * limit
        });

        const transactionList = await Promise.all(transactions.rows.map(async (transaction) => {

            // 0: Mint
            // -1: Burn
            const fromUser = transaction.from_account !== "0" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.from_account
                }
            }) : "Mint";

            const toUser = transaction.to_account !== "-1" ? await db.tblUser.findOne({
                attributes: ["first_name", "last_name", "company"],
                where: {
                    id: transaction.to_account
                }
            }) : "Burn";

            return {
                id: transaction.id,
                from: fromUser,
                to: toUser,
                block_height: transaction.block_height,
                transaction_hash: transaction.transaction_hash,
                transaction_type: transaction.transaction_type === 1 ? "Token" : "NFT",
                nft_id: transaction.nft_id,
                amount: transaction.amount,
                created_at: transaction.created_date,
                status: transaction.status,
            };
        }));

        ctx.success({
            code: 200,
            message: "Transaction fetched successfully",
            data: {
                total: transactions.count,
                transactions: transactionList
            }
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
