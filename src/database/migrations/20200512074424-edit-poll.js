'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Polls', 'discordImage', {
        allowNull: true,
        type: Sequelize.STRING,
      }),
    ]);
  },
  down: () => {
  }
};
