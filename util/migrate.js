const env = process.env.NODE_ENV || "development";
const config = require("../" + (process.argv > 2 ? process.argv[2] : "") + "config/database")[env];

const Sequelize = require("sequelize");
const Umzug = require("umzug");
const sequelize = new Sequelize(config);
const umzug = new Umzug({
    migrations: {
        params: [sequelize.getQueryInterface(), Sequelize],
        path: __dirname + "/migrations",
    },
    storage: "sequelize",
    storageOptions: {
        sequelize: sequelize,
    },
    logging: false,
});

umzug.up().then(function(migrations) {
    if (migrations.length > 0) {
        console.log("Migrations finished");
    }
    process.exit();
}).catch((err) => {
    console.log("error migrating DB: ");
    throw err;
});
