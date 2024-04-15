import { models as db } from "../utils/postgres.js"

import createLogger from "../common/logger.js";
import { _mintToken } from "./wallet.js";

const logger = createLogger("quotaController");

export const claimQuota = async (ctx) => {
    const { id } = ctx.session.user;
    const { quota } = ctx.request.body;

    try {
        const user = await db.tblUser.findOne({
            where: { id }
        });

        const annualQuota = user.annual_quota;

        const walletData = await db.tblWallet.findOne({
            where: { user_id: id }
        });

        if (!walletData) {
            ctx.fail({
                code: 400,
                message: "Wallet address not found",
                data: null
            });
            return;
        }

        const userWalletAddress = `0x${walletData.wallet_address}`;

        // Check logs
        const log = await db.tblAnnualQuotaLog.findOne({
            where: {
                user_id: id,
                annual: new Date().getFullYear()
            }
        });

        if (log) {
            ctx.fail({
                code: 400,
                message: "Quota already claimed",
                data: null
            });
            return;
        }

        await _mintToken(userWalletAddress, annualQuota);

        await db.tblAnnualQuotaLog.create({
            user_id: id,
            annual: new Date().getFullYear(),
        });

        ctx.success({
            code: 200,
            message: "Quota claimed successfully",
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

export const getLastClaimQuotaDate = async (ctx) => {
    const { id } = ctx.session.user;

    try {
        const log = await db.tblAnnualQuotaLog.findOne({
            where: {
                user_id: id
            },
            order: [
                ['claimed_date', 'DESC']
            ]
        });

        if (!log) {
            ctx.success({
                code: 200,
                message: "No quota claimed yet",
                data: null
            });
            return;
        }

        ctx.success({
            code: 200,
            message: "Quota claimed",
            data: {
                date: log.claimed_date
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