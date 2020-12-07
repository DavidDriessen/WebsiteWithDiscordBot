"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("EventMedia", {
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
            media: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Media",
                    key: "id",
                },
                primaryKey: true,
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
        return queryInterface.dropTable("EventMedia");
    },
};
