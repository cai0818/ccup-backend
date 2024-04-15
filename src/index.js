import http from "http";
import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import koaStatic from "koa-static";
import session from "koa-session";
import cors from "@koa/cors";

// Worker
import { Worker } from "worker_threads";

// Socket.io
import { Server } from "socket.io";

import "./env.js";
import createLogger from "./common/logger.js";

import { routerResponse, errorHandler } from "./middlewares/common.js";

import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import fileRoute from "./routes/file.js"
import marketplaceRoute from "./routes/marketplace.js";
import reportRoute from "./routes/report.js";
import walletRoute from "./routes/wallet.js";
import quotaRoute from "./routes/quota.js";
import transactionRoute from "./routes/transaction.js";

const app = new Koa();
const server = http.createServer(app.callback());
const router = new Router();
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
const logger = createLogger("app");

// XFF Parser / logger
app.use(async (ctx, next) => {
    const xff = ctx.request.get("X-Forwarded-For");
    if (xff) {
        const ips = xff.split(",");
        ctx.request.ip = ips[0];
    }

    ctx.logger = logger;
    
    await next();
});

app.use(routerResponse());
app.use(errorHandler());
app.use(bodyParser({
    enableTypes: ["json", "form"],
    jsonLimit: "5mb",
    formLimit: "15mb",
    strict: true,
    onerror: (err, ctx) => {
        ctx.fail({
            code: 400,
            message: "Invalid request",
            errors: null,
        });
    },
}));

// Session
app.keys = [process.env.SESSION_SECRET];
app.use(session({
    key: "ccup:sess",
    maxAge: 1 * 24 * 60 * 60 * 1000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false,
    renew: false,
}, app));

// CORS
app.use(cors({
    origin: (ctx) => {
        const whiteList = ["https://carbon-coin.demo.acgcloud.net"];
        if (whiteList.includes(ctx.request.header.origin)) {
            return ctx.request.header.origin;
        }

        if (process.env.NODE_ENV === "development") {
            return "*";
        }
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "HEAD"],
}));

// Default
router.get("/", async (ctx) => {
    ctx.success({ message: "OK", data: { version: "1.0.0" } });
});

// Routes
router.get("/health", async (ctx) => {
    ctx.success({ message: "OK" });
});

// Uploads
app.use(koaStatic("../public"));

router.prefix("/v1");
router.use("/auth", authRouter.routes());
router.use("/user", userRouter.routes());
router.use("/file", fileRoute.routes());
router.use("/marketplace", marketplaceRoute.routes());
router.use("/report", reportRoute.routes());
router.use("/wallet", walletRoute.routes());
router.use("/quota", quotaRoute.routes());
router.use("/transaction", transactionRoute.routes());

app.use(router.routes()).use(router.allowedMethods());


server.listen(process.env.PORT || 3000, () => {
    logger.info(`Server started on port ${process.env.PORT || 3000}`);
});

io.on("connection", (socket) => {
    const channel = socket.handshake.query.channel;
    logger.info(`Connceted from ${socket.handshake.address} with ID ${socket.id} on channel ${channel}`);
    // Join channel
    socket.join(channel);
    socket.on("disconnect", () => {
        logger.info("Disconnected");
    });
});

// 拉起Worker blockProcess.js
const worker = new Worker("./src/services/blockProcess.js");
worker.on("message", (message) => {
    logger.info(`Worker: ${message}`);
});
worker.on("error", (error) => {
    logger.error(`Worker: ${error}`);
});


