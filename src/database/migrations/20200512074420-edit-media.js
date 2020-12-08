const {DataTypes} = require('sequelize');

'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {

    const Media = queryInterface.sequelize.define('Media', {
      title: {type: DataTypes.STRING},
      siteUrl: {type: DataTypes.STRING},
      aniId: {type: DataTypes.INTEGER},
      malId: {type: DataTypes.INTEGER},
    }, {});
    const MediaReference = queryInterface.sequelize.define('MediaReference', {
      name: {type: DataTypes.STRING},
      type: {type: DataTypes.STRING},
      apiId: {type: DataTypes.STRING},
      url: {type: DataTypes.STRING},
      media: {type: DataTypes.INTEGER},
    }, {});
    return Media.findAll({include: []})
      .then((ses) =>
        Promise.all(ses.map((media) => {
          const ref = [MediaReference.create({
            media: media.id,
            name: media.title,
            type: 'anidb',
            apiId: media.aniId,
            url: media.siteUrl
          })];
          if (media.malId) {
            ref.push(MediaReference.create({
              media: media.id,
              name: media.title,
              type: 'mal',
              apiId: media.malId,
              url: ''
            }));
          }
          return Promise.all(ref);
        })))
      .then(() => Promise.all([
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
      ])).catch(console.error);
  },
  down: () => {
  }
};
