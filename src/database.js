import { Sequelize, DataTypes, Model } from 'sequelize';

export function getDatabase() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '../data/db.sqlite',
  });
  return sequelize;
}

const db = getDatabase();

const StationObservation = db.define(
  'StationObservation',
  {
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    voltage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  { timestamps: false },
);

await db.sync({ alter: true, force: false });

export { StationObservation, db };
