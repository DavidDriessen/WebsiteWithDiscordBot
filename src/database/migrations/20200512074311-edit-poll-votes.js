'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('PollVotes', 'user', 'ballot')
        .then(() => queryInterface.changeColumn('PollVotes', 'ballot', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Ballots",
            key: "id",
          },
          onUpdate: "cascade",
          onDelete: "cascade",
        })),
      queryInterface.addColumn('PollVotes', 'choice', {
        type: Sequelize.INTEGER
      })])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn('PollVotes', 'ballot', 'user')
        .then(() =>
          queryInterface.changeColumn('PollVotes', 'user', {
            type: Sequelize.INTEGER,
            references: {
              model: "Users",
              key: "id",
            }
          })),
      queryInterface.removeColumn('PollVotes', 'choice')
    ]);
  }
};
