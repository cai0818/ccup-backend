export const routerResponse = () => {
    return async (ctx, next) => {
        ctx.success = ({ message, data }) => {
            message = message || "success"
            ctx.responseHandled = true;
            if (data) {
                ctx.body = {
                    code: 200,
                    message,
                    data
                }
            } else {
                ctx.body = {
                    code: 200,
                    message
                }
            }
        }
        ctx.fail = ({ code, message, errors }) => {
            ctx.status = code;
            ctx.responseHandled = true;
            ctx.body = {
                code,
                message,
                errors
            }
        }

        await next();
    }
}

export const errorHandler = () => {
    const statusCodes = {
        400: "Bad Request",
        401: "Unauthorized",
        404: "Not Found",
        405: "Method Not Allowed",
        501: "Not Implemented",
        500: "Internal Server Error"
    };

    return async (ctx, next) => {
        try {
            await next();

            if (!ctx.responseHandled && statusCodes[ctx.status]) {
                ctx.status = ctx.status;
                ctx.body = {
                    code: ctx.status,
                    message: statusCodes[ctx.status]
                }
            }
        } catch (err) {
            const status = err.status || 500;
            ctx.status = status;
            ctx.body = {
                code: status,
                message: statusCodes[status]
            }

            ctx.logger.error(err);
        }
    }
}