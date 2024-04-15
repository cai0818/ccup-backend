import { Sequelize } from "sequelize";
import initModels from "../models/init-models.js";
import createLogger from "../common/logger.js";

const logger = createLogger("postgres");

const sequelize = new Sequelize(
    process.env.POSTGRES_DBNAME,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: "postgres",
        logging: process.env.NODE_ENV === 'production' ? false : (msg) => logger.debug(msg),
        benchmark: process.env.NODE_ENV === 'production' ? false : true,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },
    }
);

const models = initModels(sequelize);

export { sequelize, models };