"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("Attendees", {
            user: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
                primaryKey: true,
                onUpdate: "cascade",
                onDelete: "cascade",
            },
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
            decision: {
                allowNull: false,
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
        return queryInterface.dropTable("Attendees");
    },
};
