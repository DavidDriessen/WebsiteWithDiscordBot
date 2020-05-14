'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PollOptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        allowNull: false,
        defaultValue: 'General',
        type: Sequelize.ENUM('Series', 'Date', 'Time', 'DateTime', 'WeekTime', 'Game', 'General')
      },
      content: {
        allowNull: false,
        type: Sequelize.STRING
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
    return queryInterface.dropTable('PollOptions');
  }
};
