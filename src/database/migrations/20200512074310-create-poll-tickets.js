'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('PollTickets', {
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
            poll: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Polls",
                    key: "id",
                },
                primaryKey: true,
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            discordMessageID: {
                type: Sequelize.STRING,
                allowNull: true,
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('PollTickets');
    }
};
