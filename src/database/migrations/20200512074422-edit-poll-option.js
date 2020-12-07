'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('PollOptions', 'mediaId', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: "Media",
          key: "id",
        },
      }),
      queryInterface.addColumn('PollOptions', 'date', {
        allowNull: true,
        type: Sequelize.DATE,
      }),
      queryInterface.addColumn('PollOptions', 'weekDay', {
        allowNull: true,
        type: Sequelize.INTEGER,
      }),
      queryInterface.addColumn('PollOptions', 'time', {
        allowNull: true,
        type: Sequelize.TIME,
      }),
      queryInterface.removeColumn('PollOptions', 'type'),
    ]);
  },
  down: () => {
  }
};
