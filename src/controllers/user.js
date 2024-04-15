import { Op, fn, col, where } from "sequelize";
import { models as db } from "../utils/postgres.js"
import bcrypt from "bcryptjs";
import createLogger from "../common/logger.js";

const logger = createLogger("userController");

export const changeUserProfile = async (ctx) => {
    const { id } = ctx.session.user;
    const { firstName, lastName } = ctx.request.body;

    try {
        await db.tblUser.update({
            first_name: firstName,
            last_name: lastName
        }, {
            where: {
                id: id
            }
        });

        return ctx.success({
            code: 200,
            message: "Profile updated successfully",
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

export const changeUserPassword = async (ctx) => {
    const { id } = ctx.session.user;
    const { oldPassword, newPassword } = ctx.request.body;

    try {
        const user = await db.tblUser.findOne({
            where: {
                id: id
            }
        });

        if (bcrypt.compareSync(oldPassword, user.password)) {
            const salt = bcrypt.genSaltSync(10);
            const password = bcrypt.hashSync(newPassword, salt);

            await db.tblUser.update({
                password: password
            }, {
                where: {
                    id: id
                }
            });

            return ctx.success({
                code: 200,
                message: "Password updated successfully",
                data: null
            });
        }

        return ctx.fail({
            code: 401,
            message: "Invalid old password",
            errors: null
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

export const saveCompanyProfile = async (ctx) => {
    const { id } = ctx.session.user;
    const { company, company_uscc, company_phone } = ctx.request.body;

    if (!company || !company_uscc || !company_phone) {
        return ctx.fail({
            code: 400,
            message: "Invalid request",
            errors: null
        });
    }

    try {
        await db.tblUser.update({
            company: company,
            company_uscc: company_uscc,
            company_phone: company_phone
        }, {
            where: {
                id: id
            }
        });

        return ctx.success({
            code: 200,
            message: "Company profile updated successfully",
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

export const submitAccountVerify = async (ctx) => {
    const { id } = ctx.session.user;
    const { company, company_uscc, company_phone } = ctx.request.body;
    

    try {
        const user = await db.tblUser.findOne({
            where: {
                id: id
            }
        });

        if (user.verified === 1) {
            // already have a pending verification request
            return ctx.fail({
                code: 409,
                message: "Account verification already submitted",
                errors: null
            })
        }

        await db.tblUser.update({
            verified: 1,
            company: company.trim(),
            company_uscc: company_uscc.trim(),
            company_phone: company_phone.trim()
        }, {
            where: {
                id: id
            }
        });

        await db.tblAccountVerifyRequest.create({
            user_id: id,
            status: 0
        });

        ctx.session.user.verified = 1;
        ctx.session.user.company = company;
        ctx.session.user.companyUSCC = company_uscc;
        ctx.session.user.companyPhone = company_phone;

        return ctx.success({
            code: 200,
            message: "Account verification submitted successfully",
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

export const approveAccountVerify = async (ctx) => {
    const { id } = ctx.request.params;

    try {
        const request = await db.tblAccountVerifyRequest.findOne({
            where: {
                id: id
            }
        });

        if (!request) {
            return ctx.fail({
                code: 404,
                message: "Request not found",
                errors: null
            });
        }

        await db.tblAccountVerifyRequest.update({
            status: 2
        }, {
            where: {
                id: id
            }
        });

        await db.tblUser.update({
            verified: 2
        }, {
            where: {
                id: request.user_id
            }
        });

        return ctx.success({
            code: 200,
            message: "Account verification approved successfully",
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

export const rejectAccountVerify = async (ctx) => {
    const { id } = ctx.request.params;
    const { reject_reason } = ctx.request.body;

    try {
        const request = await db.tblAccountVerifyRequest.findOne({
            where: {
                id: id
            }
        });

        if (!request) {
            return ctx.fail({
                code: 404,
                message: "Request not found",
                errors: null
            });
        }

        await db.tblAccountVerifyRequest.update({
            status: 1,
            reject_reason: reject_reason
        }, {
            where: {
                id: id
            }
        });

        await db.tblUser.update({
            verified: 0
        }, {
            where: {
                id: request.user_id
            }
        });

        return ctx.success({
            code: 200,
            message: "Account verification rejected successfully",
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

export const getLatestAccountVerifyRequest = async (ctx) => {

    const { id } = ctx.session.user;

    try {
        const request = await db.tblAccountVerifyRequest.findOne({
            order: [
                ["created_date", "DESC"]
            ],
            where: {
                user_id: id
            }
        });

        if (!request) {
            return ctx.success({
                code: 200,
                message: "No request found",
                data: null
            });
        }

        return ctx.success({
            code: 200,
            message: "Success",
            data: request
        });
    } catch (error) {
        logger.error(error);
        return ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });
    }
}

export const getPendingAccountVerifyRequests = async (ctx) => {
    const { page, limit } = ctx.request.query;
    const offset = (page - 1) * limit;

    try {
        const requests = await db.tblAccountVerifyRequest.findAll({
            where: {
                status: 0
            },
            include: [
                {
                    model: db.tblUser,
                    as: "user"
                }
            ],
            limit,
            offset
        });
        
        return ctx.success({
            code: 200,
            message: "Success",
            data: requests
        });

    } catch (error) {
        logger.error(error);
        return ctx.fail({
            code: 500,
            message: "Internal server error",
            errors: null
        });

    }
}


export const _initDefaultUser = async () => {
    try {
        await db.tblUser.create({
            email: "admin@acgcloud.net",
            password: bcrypt.hashSync("admin", 10),
            first_name: "Admin",
            last_name: "Admin",
            role: 3,
            company: "Demo Company",
            verified: 1,
            status: 1
        });

        return true;
    } catch (error) {
        logger.error(error);
    }

    return false;
}

export const _userAuth = async (email, password) => {
    try {
        const user = await db.tblUser.findOne({
            where: {
                email: email
            }
        });
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                // Check status
                if (user.status === 1) {
                    // Update last_login
                    await db.tblUser.update({
                        last_login: new Date()
                    }, {
                        where: {
                            id: user.id
                        }
                    });

                    return {
                        code: 200,
                        message: "Login successful",
                        data: {
                            id: user.id,
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            role: user.role,
                            company: user.company,
                            companyUSCC: user.company_uscc,
                            companyPhone: user.company_phone,
                            annualQuota: user.annual_quota,
                            verified: user.verified,
                            status: user.status
                        }
                    }
                }
                return {
                    code: 403,
                    message: "User is not active",
                    data: null
                }
            }
        }
        return {
            code: 401,
            message: "Invalid email or password",
            data: null
        }
    } catch (error) {
        logger.error(error);
        return {
            code: 500,
            message: "Internal server error",
            data: null
        }
    }
}

export const _userRegister = async (payload) => {
    try {
        const user = await db.tblUser.findOne({
            where: {
                email: payload.email
            }
        });
        if (!user) {
            const salt = bcrypt.genSaltSync(10);
            payload.password = bcrypt.hashSync(payload.password, salt);
            const newUser = await db.tblUser.create(payload);
            return {
                code: 200,
                message: "User registered successfully",
                data: {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.first_name,
                    lastName: newUser.last_name,
                    role: newUser.role,
                    company: newUser.company,
                    verified: newUser.verified,
                    status: newUser.status
                }
            }
        }
        return {
            code: 409,
            message: "Email already exists",
            data: null
        }
    } catch (error) {
        logger.error(error);
        return {
            code: 500,
            message: "Internal server error",
            data: null
        }
    }
}

export const getPendVerifyRequests = async (ctx) => {
    const page = ctx.request.query.page || 1;
    const limit = ctx.request.query.limit || 10;
    const offset = (page - 1) * limit; // Corrected calculation for offset
    const data = await db.tblAccountVerifyRequest.findAll({
        where: { status: 0 },
        limit,
        offset,
    });

    ctx.success({
        code: 200,
        message: "Success",
        data
    });
};

export const getVerifyRequestDetail = async (ctx) => {
    const { id } = ctx.request.params;
    const data = await db.tblAccountVerifyRequest.findOne({
        where: { id },
        include: [
            {
                model: db.tblUser,
                as: "user"
            }
        ]
    });

    const response = {
        id: data.id,
        status: data.status,
        user: {
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            company: data.user.company,
        }
    };

    ctx.success({
        code: 200,
        message: "Success",
        data: response
    });
}

export const getAllUsers = async (ctx) => {
    const page = parseInt(ctx.request.query.page) || 1;
    const limit = parseInt(ctx.request.query.limit) || 10;
    const search = ctx.request.query.search || "";
    const verified = ctx.request.query.verified !== undefined ? parseInt(ctx.request.query.verified) : null;

    const users = await db.tblUser.findAndCountAll({
        where: {
            [Op.or]: [
                where(fn("concat", col("first_name"), " ", col("last_name")), {
                    [Op.iLike]: `%${search}%`
                }),
                {
                    email: {
                        [Op.iLike]: `%${search}%`
                    }
                },
                {
                    company: {
                        [Op.iLike]: `%${search}%`
                    }
                }
            ],
            verified: verified !== null ? verified : { [Op.ne]: null }
        },
        attributes: ["id", "email", "first_name", "last_name", "role", "company", "company_uscc", "company_phone", "verified", "annual_quota", "last_login", "status"],
        limit,
        include: [
            {
                model: db.tblAccountVerifyRequest,
                as: "tbl_account_verify_requests",
                attributes: ["id", "status"],
                required: false,
                where: { status: 0 },
            }
        ],
        offset: (page - 1) * limit
    });

    const userList = users.rows.map(user => {
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            company: user.company,
            company_uscc: user.company_uscc,
            company_phone: user.company_phone,
            verified: user.verified,
            annual_quota: user.annual_quota,
            last_login: user.last_login,
            status: user.status,
            verify_request: user.tbl_account_verify_requests.length > 0 ? user.tbl_account_verify_requests[0].id : null
        }
    });

    ctx.success({
        code: 200,
        message: "Success",
        data: {
            total: users.count,
            users: userList
        }
    });

}

export const adjustAnnualQuota = async (ctx) => {
    const { id } = ctx.request.params;
    const { annual_quota } = ctx.request.body;

    try {
        await db.tblUser.update({
            annual_quota
        }, {
            where: {
                id
            }
        });

        ctx.success({
            code: 200,
            message: "Annual quota updated successfully",
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

export const setUserRole = async (ctx) => {
    const { id } = ctx.request.params;
    const { role } = ctx.request.body;

    try {
        await db.tblUser.update({
            role
        }, {
            where: {
                id
            }
        });

        ctx.success({
            code: 200,
            message: "Role updated successfully",
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
