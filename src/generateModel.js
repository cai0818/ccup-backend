// Sequelize-auto
import SequelizeAuto from 'sequelize-auto';
import "./env.js";

const auto = new SequelizeAuto('carbon_platform', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    directory: './src/models',
    caseModel: 'c',
    caseFile: 'c',
    singularize: true,
    additional: {
        timestamps: false
    },
    lang: 'esm'
});

auto.run(function (err) {
    if (err) throw err;
    console.log(auto.tables); // table list
    console.log(auto.foreignKeys); // foreign key list
});