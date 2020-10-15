'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Media', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      aniId: {
        type: Sequelize.INTEGER
      },
      malId: {
        type: Sequelize.INTEGER
      },
      siteUrl: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT('long')
      },
      genres: {
        type: Sequelize.JSON
      },
      image: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      episodes: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {});
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Media');
  }
};
