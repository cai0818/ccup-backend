export const checkLoggedIn = async (ctx, next) => {
    if (ctx.session.user) {
        await next();
    } else {
        ctx.fail({
            code: 401,
            message: "Unauthorized",
            data: null
        });
    }
}

export const checkUnloggedIn = async (ctx, next) => {
    if (!ctx.session.user) {
        await next();
    } else {
        ctx.success({
            code: 200,
            message: "Already logged in",
            data: ctx.session.user
        });
    }
}

export const checkAccountNotVerified = async (ctx, next) => {
    // 0: Not verified
    // 1: Pending
    // 2: Verified
    if (ctx.session.user.verified !== 2) {
        await next();
    } else {
        ctx.fail({
            code: 403,
            message: "Account already verified",
            data: null
        });
    }
}

export const checkAccountVerified = async (ctx, next) => {
    // 0: Not verified
    // 1: Pending
    // 2: Verified
    if (ctx.session.user.verified === 2) {
        await next();
    } else {
        ctx.fail({
            code: 403,
            message: "Account not verified",
            data: null
        });
    }
}

export const checkRole = (roles) => {
    // 0: Company
    // 1: Data Reviewer
    // 2: 3rd Party Supervisor
    // 3: Admin
    return async (ctx, next) => {
        if (roles.includes(ctx.session.user.role)) {
            await next();
        } else {
            ctx.fail({
                code: 403,
                message: "Forbidden",
                data: null
            });
        }
    }
}