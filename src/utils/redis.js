import { Redis } from "ioredis";
import createLogger from "../common/logger.js";

const logger = createLogger("redis");
logger.info(`Connecting ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`);

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB
});

export default redis;