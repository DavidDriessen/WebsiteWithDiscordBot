'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Polls', 'image', {
        allowNull: true,
        type: Sequelize.STRING,
      }),
    ]);
  },
  down: () => {
  }
};
