import { Sequelize, DataTypes, Model } from 'sequelize';
import { databaseFile } from './paths.js';

export function getDatabase() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: databaseFile,
    logging: false,
  });
  return sequelize;
}

const db = getDatabase();

const StationObservation = db.define(
  'StationObservation',
  {
    niceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nickname: DataTypes.STRING,
    status: DataTypes.NUMBER,
    vehicleConnected: DataTypes.BOOLEAN,
    current: DataTypes.FLOAT,
    energy: DataTypes.FLOAT,
    energyUnit: DataTypes.STRING,
    voltage: DataTypes.FLOAT,
    voltageUnit: DataTypes.STRING,
    ledHexCode: DataTypes.STRING,
    ledModulationState: DataTypes.NUMBER,
  },
  { timestamps: false },
);

const SessionHistory = db.define(
  'SessionHistory',
  {
    stationName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    durationMs: {
      type: DataTypes.NUMBER,
    },
    energyTransferredWh: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
  },
  { timestamps: false },
);

await db.sync({ alter: true, force: false });

export { StationObservation, SessionHistory };
