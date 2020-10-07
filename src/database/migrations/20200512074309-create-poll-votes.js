'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PollVotes', {
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
      option: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "PollOptions",
          key: "id",
        },
        primaryKey: true,
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
    return queryInterface.dropTable('PollVotes');
  }
};
