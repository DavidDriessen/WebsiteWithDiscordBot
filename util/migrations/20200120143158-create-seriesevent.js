"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Series", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            event: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Events",
                    key: "id",
                },
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            series: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Series",
                    key: "id",
                },
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            episode: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            episodes: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("Series");
    },
};
