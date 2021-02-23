'use strict';
var SequelizeGuard = require('sequelize-guard');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return SequelizeGuard.migration.up(queryInterface, Sequelize, {timestamps: true});
    },
    down: (queryInterface, Sequelize) => {
        return SequelizeGuard.migration.down(queryInterface, Sequelize);
    },
};
