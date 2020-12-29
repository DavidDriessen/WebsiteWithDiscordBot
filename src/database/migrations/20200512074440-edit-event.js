'use strict';
module.exports = {
  up: (queryInterface) => {
    return queryInterface.changeColumn('Events', 'description', 'LONGTEXT');
  },
  down: (queryInterface) => {
    return queryInterface.changeColumn('Events', 'description', Sequelize.STRING);
  }
};
