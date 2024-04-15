import log4js from "log4js";

const createLogger = (loggerName) => {
    const logger = log4js.getLogger(loggerName || "app");
    logger.level = process.env.LOG_LEVEL || "info";
    return logger;
}

export default createLogger;