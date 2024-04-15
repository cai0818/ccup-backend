import { _userAuth, _userRegister } from "./user.js";
import { models as db } from "../utils/postgres.js";

export const login = async (ctx) => {
    try {
        const { email, password } = ctx.request.body;
        const result = await _userAuth(email, password);
        if (result.code === 200) {
            ctx.session.user = result.data;
            return ctx.success(result);
        }
        ctx = ctx.fail(result);
    } catch (error) {
        ctx.fail({
            code: 500,
            message: "Internal server error",
            data: null
        });
    }
}
/**
 * @description: 描述信息
 * @author:29046
 * @date: 2024/4/7
 * @parameter: 传入参数
 */

export const getLoginState = async (ctx) => {

    // 刷新数据
    const user = await db.tblUser.findOne({
        where: {
            id: ctx.session.user.id
        }
    });

    ctx.session.user = {
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

    return ctx.success({
        data: ctx.session.user
    });
}

export const register = async (ctx) => {
    const { email, password, firstName, lastName, company } = ctx.request.body;

    const payload = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        company: company ? company : null
    };

    const result = await _userRegister(payload);
    if (result.code === 200) {
        return ctx.success(result);
    }

    ctx.fail(result);
}


export const logout = async (ctx) => {
    ctx.session = null;
    ctx.success({ message: "Logout successful" });
}