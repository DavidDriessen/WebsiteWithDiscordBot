'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Ballots', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
                onUpdate: "cascade",
                onDelete: "cascade",
            },
            pollId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Polls",
                    key: "id",
                },
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
        return queryInterface.dropTable('Ballots');
    }
};
