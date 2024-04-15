// Marketplace
import { Sequelize } from "sequelize";
import { models as db, sequelize } from "../utils/postgres.js";

import createLogger from "../common/logger.js";

import { _getWalletBalance } from "./wallet.js";

const logger = createLogger("marketplace");
const { Op } = Sequelize;

/**
 * @description: 获取市场列表
 * @author:29046
 * @date: 2024/4/5
 * @parameter: 可选参数limit ,offset,status,sort
 */
export const getMarketplaceList = async (ctx) => {
    try {
        const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;
        const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;

        const status = ctx.request.query.status ? parseInt(ctx.request.query.status) : 1;
        const trade_type = ctx.request.query.trade_type ? parseInt(ctx.request.query.trade_type) : 1;
        const sort = ctx.request.query.sort || "DESC";
        // Fetch marketplace data with pagination

        const marketplaceData = await db.tblMarketplace.findAndCountAll({
            where: {
                trade_type: trade_type,
                status: status
            },
            include: [
                {
                    model: db.tblUser,
                    as: 'user',
                    attributes: ['company']
                }
            ],
            limit: limit,
            offset: (page - 1) * limit
        });

        // Sort the responseData array based on totalPrice
        const responseData = marketplaceData.rows.sort((a, b) => {
            if (sort === "ASC") {
                return a.unit_price * a.amount - b.unit_price * b.amount;
            } else {
                return b.unit_price * b.amount - a.unit_price * a.amount;
            }
        });
        // Send success response with the constructed data
        ctx.success({
            message: "Marketplace data fetched successfully",
            data: {
                marketplaceData: responseData,
                total: marketplaceData.count,
            }
        });
    } catch (error) {
        // Handle errors appropriately
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Failed to fetch marketplace data",
            errors: null
        });
    }
};


/**
 * @description: 购买
 * @author:29046
 * @date: 2024/4/5
 * @parameter: 传入参数 json 类似
 * {
 *     "item_id": 6
 * }
 */
export const buyItem = async (ctx) => {
    const transaction = await sequelize.transaction();
    // 下单,验证用户资产是否足够,锁定商品
    try {
        const buyer_id = ctx.session.user.id;
        const item_id = ctx.request.params.id;
        const amount = ctx.request.body.amount;

        const marketplaceItem = await db.tblMarketplace.findOne({ where: { id: item_id } });

        if (!marketplaceItem) {
            ctx.fail({
                code: 404,
                message: "No product exists"
            });
            return;
        }

        if (marketplaceItem.user_id === buyer_id) {
            ctx.fail({
                code: 400,
                message: "You cannot buy your own product"
            });
            return;
        }

        if (marketplaceItem.status !== 1) {
            ctx.fail({
                code: 400,
                message: "Product has traded or been locked"
            });
            return;
        }

        if (marketplaceItem.amount < amount) {
            ctx.fail({
                code: 400,
                message: "The quantity is greater than the quantity of the product"
            });
            return;
        }

        const walletData = await db.tblWallet.findOne({
            where: { user_id: buyer_id },
            attributes: ['wallet_address']
        });

        if (!walletData) {
            ctx.fail({
                code: 404,
                message: "There is no wallet address for the user"
            });
            return;
        }

        //是否足够余额以及商品是否已经锁定
        let balance = await _getWalletBalance(walletData.wallet_address);

        logger.info(`Balance: ${balance}`);

        // Parse the balance to a float
        balance /= BigInt(100);
        balance = parseFloat(balance);

        if (balance < marketplaceItem.unit_price * marketplaceItem.amount) {
            ctx.fail({
                code: 400,
                message: "Insufficient balance",
            });
            return;
        }

        try {
            // 执行更新操作，并传入事务对象
            const res = await db.tblMarketplace.update(
                { status: 2 }, // 要更新的值
                { where: { id: item_id, status: 1 }, transaction } // 更新条件和事务对象
            );

            // 检查更新的记录数
            if (res[0] === 1) {
                // 创建订单
                const newOrder = await db.tblOrder.create({
                    seller_id: marketplaceItem.user_id,
                    buyer_id: buyer_id,
                    marketplace_item_id: item_id,
                    amount: amount,
                    unit_price: marketplaceItem.unit_price,
                    total: Number(marketplaceItem.unit_price) * amount,
                    status: 1
                }, { transaction }); // 传入事务对象

                // 更新市场项状态和金额

                if (marketplaceItem.amount - amount === 0) {
                    // 如果商品数量为 0，将商品状态设置为 3
                    await db.tblMarketplace.update(
                        { status: 3, amount: marketplaceItem.amount - amount },
                        { where: { id: item_id }, transaction }
                    );
                } else {
                    // 否则，减去购买的数量
                    await db.tblMarketplace.update(
                        { amount: marketplaceItem.amount - amount, status: 1 },
                        { where: { id: item_id }, transaction }
                    );
                }

                // 提交事务
                await transaction.commit();

                ctx.success({ code: 200, message: "Order successfully placed", data: { order_id: newOrder.id } });
            } else {
                // 回滚事务
                await transaction.rollback();

                ctx.fail({
                    code: 404,
                    message: "Record not found",
                    error: "No records were updated"
                });
            }
        } catch (error) {
            // 发生错误时回滚事务
            await transaction.rollback();
            console.error('Transaction failed:', error);
            ctx.fail({
                code: 500,
                message: "Internal service Error",
                error: error.message
            });
        }

    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }


}
/**
 * @description: 出售商品上架
 * @author:29046
 * @date: 2024/4/5
 * @parameter:请求体
 * json格式{
 *     "unit_price":123,
 *     "amount":1
 * }
 */

export const sellRequest = async (ctx) => {
    // 上架商品,验证用户资产是否足够,并且已完成当年年报

    try {
        const userid = ctx.session.user.id;
        const { unit_price, amount } = ctx.request.body;
        // 检查价格和数量是否为合法数字且大于 0
        if (isNaN(unit_price) || isNaN(amount) || unit_price <= 0 || amount <= 0) {
            // 如果价格或数量不是合法数字，或者价格或数量小于等于 0，返回 500 错误
            ctx.fail({
                code: 400,
                message: "The price or quantity is not a legal number and must be greater than 0",
                errors: null
            });
            return;
        }
        // 从数据库中获取地址
        const walletData = await db.tblWallet.findOne({
            where: { user_id: userid },
            attributes: ['wallet_address']
        })

        if (!walletData) {
            ctx.fail({
                code: 404,
                message: "No wallet address found for the user",
                errors: null
            });
            return;
        }

        // 检查是否已完成上一年的年报
        // const reportData = await db.tblReport.findOne({
        //     where: {
        //         user_id: userid,
        //         annual: new Date().getFullYear()
        //     }
        // });

        // if (!reportData || reportData.status !== 2) {
        //     ctx.fail({
        //         code: 400,
        //         message: "Annual report not completed"
        //     });
        //     return;
        // }

        // 插入市场数据
        await db.tblMarketplace.create({
            user_id: userid,
            unit_price: unit_price,
            amount: amount,
            status: 1,
            trade_type: 1
        });


        //return data
        ctx.success({
            code: 200,
            message: "Create item success"
        });
    } catch (error) {
        // Handle errors appropriately
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal Server error",
            errors: null
        });
    }
}
/**
 * @description: 求购
 * @author:29046
 * @date: 2024/4/5
 * @parameter:{
 *     "unit_price": 123,
 *     "amount":1
 * }
 */
export const buyRequest = async (ctx) => {
    // 求购商品
    // 提交求购信息(数量,单价)

    // 上架商品,验证用户资产是否足够,并且已完成当年年报
    try {
        const userid = ctx.session.user.id;

        const { unit_price, amount } = ctx.request.body;

        // 检查价格和数量是否为合法数字且大于 0
        if (isNaN(unit_price) || isNaN(amount) || unit_price <= 0 || amount <= 0) {
            // 如果价格或数量不是合法数字，或者价格或数量小于等于 0，返回 500 错误
            ctx.fail({
                code: 400,
                message: "The price or quantity is not a legal number and must be greater than 0",
                errors: null
            });
            return;
        }
        //从数据库中获取地址
        const walletData = await db.tblWallet.findOne({
            where: { user_id: userid },
            attributes: ['wallet_address']
        });

        if (!walletData) {
            ctx.fail({
                code: 404,
                message: "No wallet address found for the user",
                errors: null
            });
            return;
        }

        //是否足够余额
        let balance = await _getWalletBalance(walletData.wallet_address);

        logger.info(`Balance: ${balance}`);

        balance /= BigInt(100);
        balance = parseFloat(balance);
        if (balance < amount * unit_price) {
            ctx.fail({
                code: 400,
                message: "Insufficient balance",
                errors: null
            });
            return;
        }

        //插入市场数据
        await db.tblMarketplace.create({
            user_id: userid,
            unit_price: unit_price,
            amount: amount,
            status: 1,
            trade_type: 2
        });


        // return data
        ctx.success({
            code: 200,
            message: "success",

        });
    } catch (error) {
        // Handle errors appropriately
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }
}

/**
 * @description: 下架商品
 * @author:29046
 * @date: 2024/4/5
 * @parameter: 传入参数
 */
export const unlistItem = async (ctx) => {
    try {
        const userid = ctx.session.user.id;
        const item_id = ctx.params.id;

        const marketplaceItem = await db.tblMarketplace.findOne({ where: { id: item_id } });

        if (!marketplaceItem) {
            ctx.fail({
                code: 404,
                message: "No product exists"
            });
            return;
        }

        // 如果是管理员，可以删除任何商品
        if (marketplaceItem.user_id != userid && ctx.session.user.role !== 3) {
            ctx.fail({
                code: 403,
                message: "You are not the owner of this product"
            });
            return;
        }

        if (marketplaceItem.status !== 1) {
            ctx.fail({
                code: 400,
                message: "Product has traded or been locked"
            });
            return;
        }

        await db.tblMarketplace.update(
            { status: 0 },
            { where: { id: item_id } }
        );

        ctx.success({
            message: "Product unlisted successfully"
        });

    } catch (error) {
        // Handle errors appropriately
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Internal Server error",
            errors: null
        });
    }
}

export const getCurrentUserMarketplaceItems = async (ctx) => {
    try {
        const userid = ctx.session.user.id;
        const trade_type = ctx.request.query.trade_type ? parseInt(ctx.request.query.trade_type) : 1;
        const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;
        const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;

        const marketplaceItems = await db.tblMarketplace.findAll({
            where: {
                user_id: userid,
                trade_type: trade_type
            },
            limit: limit,
            offset: (page - 1) * limit
        });

        ctx.success({
            message: "Marketplace data fetched successfully",
            data: marketplaceItems
        });

    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Failed to fetch marketplace data",
            errors: null
        });
    }
}

export const getCurrentUserOrders = async (ctx) => {
    const limit = ctx.request.query.limit ? parseInt(ctx.request.query.limit) : 10;
    const page = ctx.request.query.page ? parseInt(ctx.request.query.page) : 1;
    const userid = ctx.session.user.id;

    try {
        const orders = await db.tblOrder.findAndCountAll({
            where: {
                [Op.or]: [
                    { buyer_id: userid },
                    { seller_id: userid }
                ]
            },
            include: [
                {
                    model: db.tblUser,
                    as: "buyer",
                    attributes: ["company", "company_uscc", "company_phone"],
                },
                {
                    model: db.tblUser,
                    as: "seller",
                    attributes: ["company", "company_uscc", "company_phone"]
                }
            ],
            limit: limit,
            offset: (page - 1) * limit
        });

        // 根据 seller_id buyer_id 判断是卖出还是买入
        ctx.success({
            message: "Orders fetched successfully",
            data: {
                orders: orders.rows.map(order => ({
                    id: order.id,
                    buyer: {
                        id: order.buyer_id,
                        company: order.buyer.company,
                        company_uscc: order.buyer.company_uscc,
                        company_phone: order.buyer.company_phone
                    },
                    seller: {
                        id: order.seller_id,
                        company: order.seller.company,
                        company_uscc: order.seller.company_uscc,
                        company_phone: order.seller.company_phone
                    },
                    trade_type: order.buyer_id === userid ? "1" : "2",
                    transaction_hash: order.transaction_hash,
                    amount: order.amount,
                    unit_price: order.unit_price,
                    total: order.total,
                    status: order.status
                })),
                total: orders.count,
            }
        });
    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Failed to fetch orders",
            errors: null
        });
    }
}

export const getOrderDetails = async (ctx) => {
    const order_id = ctx.params.id;
    const userId = ctx.session.user.id;

    try {
        const order = await db.tblOrder.findOne({
            where: {
                id: order_id
            },
            // Map buyer_id and seller_id to tblUser model
            include: [
                {
                    model: db.tblUser,
                    as: "buyer",
                    attributes: ["company", "company_uscc", "company_phone"],
                },
                {
                    model: db.tblUser,
                    as: "seller",
                    attributes: ["company", "company_uscc", "company_phone"]
                }
            ],
        });

        const buyerWallet = await db.tblWallet.findOne({
            where: { user_id: order.buyer_id },
            attributes: ['wallet_address']
        });

        const sellerWallet = await db.tblWallet.findOne({
            where: { user_id: order.seller_id },
            attributes: ['wallet_address']
        });

        if (!order) {
            ctx.fail({
                code: 404,
                message: "Order not found"
            });
            return;
        }

        if (order.buyer_id !== userId && order.seller_id !== userId) {
            ctx.fail({
                code: 403,
                message: "You are not authorized to view this order"
            });
            return;
        }

        ctx.success({
            message: "Order fetched successfully",
            data: {
                current_role: order.buyer_id === userId ? "buyer" : "seller",
                buyer: {
                    id: order.buyer_id,
                    company: order.buyer.company,
                    company_uscc: order.buyer.company_uscc,
                    company_phone: order.buyer.company_phone,
                    wallet_address: buyerWallet.wallet_address ? `0x${buyerWallet.wallet_address}` : null
                },
                seller: {
                    id: order.seller_id,
                    company: order.seller.company,
                    company_uscc: order.seller.company_uscc,
                    company_phone: order.seller.company_phone,
                    wallet_address: sellerWallet.wallet_address ? `0x${sellerWallet.wallet_address}` : null
                },
                transaction_hash: order.transaction_hash,
                amount: order.amount,
                unit_price: order.unit_price,
                total: order.total,
                status: order.status
            }
        });
    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Failed to fetch order",
            errors: null
        });
    }
}

export const confirmOrderPayment = async (ctx) => {
    const order_id = ctx.params.id;
    const userId = ctx.session.user.id;

    try {
        const order = await db.tblOrder.findOne({
            where: {
                id: order_id
            }
        });

        if (!order) {
            ctx.fail({
                code: 404,
                message: "Order not found"
            });
            return;
        }

        if (order.buyer_id !== userId) {
            ctx.fail({
                code: 403,
                message: "You are not authorized to confirm this order"
            });
            return;
        }

        if (order.status !== 1) {
            ctx.fail({
                code: 400,
                message: "Order has already been confirmed"
            });
            return;
        }

        await db.tblOrder.update(
            { status: 2 },
            { where: { id: order_id } }
        );

        ctx.success({
            message: "Order confirmed successfully"
        });
    } catch (error) {
        logger.error(error);
        ctx.fail({
            code: 500,
            message: "Failed to confirm order",
            errors: null
        });
    }
}