"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("SeriesEvents", {
            event: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Events",
                    key: "id",
                },
                primaryKey: true,
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            seriesId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            episode: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            episodes: {
                allowNull: true,
                type: Sequelize.INTEGER,
            },
            order: {
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
    down: (queryInterface) => {
        return queryInterface.dropTable("SeriesEvents");
    },
};
