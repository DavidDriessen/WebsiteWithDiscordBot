'use strict';
module.exports = {
  up: (queryInterface) => {
    return queryInterface.changeColumn('Polls', 'description', 'LONGTEXT');
  },
  down: (queryInterface) => {
    return queryInterface.changeColumn('Polls', 'description', Sequelize.STRING);
  }
};
