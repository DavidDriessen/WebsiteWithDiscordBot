'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Media', 'aniId'),
      queryInterface.removeColumn('Media', 'malId'),
      queryInterface.removeColumn('Media', 'siteUrl'),
      queryInterface.addColumn('Media', 'trailer', {
        allowNull: true,
        type: Sequelize.STRING
      }),
      queryInterface.addColumn('Media', 'type', {
        allowNull: true,
        type: Sequelize.ENUM,
        values: ['Series', 'Movie'],
        defaultValue: "Series"
      })
    ]);
  },
  down: () => {
  }
};
