'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Events', 'discordImage', {
      type: Sequelize.STRING
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Events', 'discordImage');
  }
};
