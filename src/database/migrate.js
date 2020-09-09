const Sequelize = require("sequelize");
const Umzug = require("umzug");

module.exports.migrate = (sequelize) => {
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

    return umzug.up().then(function (migrations) {
        if (migrations.length > 0) {
            console.log("Migrations finished");
        } else {
            console.log("Database up-to-date");
        }
    }).catch((err) => {
        console.log("error migrating DB: ");
        throw err;
    });
}
