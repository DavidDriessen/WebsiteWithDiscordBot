'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'permissions', {
      type: Sequelize.JSON
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Users', 'permissions');
  }
};
