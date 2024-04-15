import { turnstileVerify } from "../utils/turnstile.js";

export const captchaVerify = async (ctx, next) => {
    const { token } = ctx.request.body;
    const ip = ctx.request.ip;

    if (!token) {
        ctx.fail({
            code: 400,
            message: "Bad Request",
            errors: {
                token: "Captcha token is required"
            }
        });
        return;
    }

    const result = await turnstileVerify(token, ip);

    if (result) {
        return await next();
    }

    ctx.fail({
        code: 401,
        message: "Unauthorized",
        errors: {
            token: "Captcha verification failed"
        }
    });

}

