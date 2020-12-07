const {DataTypes} = require('sequelize');

module.exports = {
  up: (queryInterface) => {
    const SeriesEvent = queryInterface.sequelize.define('SeriesEvents', {
      event: {
        type: DataTypes.INTEGER
      },
      seriesId: {
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      episode: {
        type: DataTypes.INTEGER
      },
      episodes: {
        type: DataTypes.INTEGER
      },
      order: {
        type: DataTypes.INTEGER
      }
    }, {});
    const EventMedia = queryInterface.sequelize.define('EventMedia', {
      event: {
        type: DataTypes.INTEGER
      },
      media: {
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      episode: {
        type: DataTypes.INTEGER
      },
      episodes: {
        type: DataTypes.INTEGER
      },
      order: {
        type: DataTypes.INTEGER
      }
    }, {});
    const Media = queryInterface.sequelize.define('Media', {}, {});
    return SeriesEvent.findAll()
      .then((ses) =>
        Promise.all(ses.map((se) =>
          Media.findOne({where: {aniId: se.seriesId}})
            .then((media) =>
              EventMedia.create({
                event: se.event,
                media: media.id,
                episode: se.episode,
                episodes: se.episodes,
                order: se.order,
              })))))
      .then(() => queryInterface.dropTable('SeriesEvents'))
      .catch(console.error);
  },
  down: () => {

  },
};
