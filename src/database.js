import { Sequelize, DataTypes, Model } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/db.sqlite');
console.log(dbPath);
export function getDatabase() {
  const sequelize = new Sequelize(
    {
      dialect: 'sqlite',
      storage: dbPath,
      logging: false,
    }
  );
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
    niceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nickname: DataTypes.STRING,
    status: DataTypes.NUMBER,
    vehicleConnected: DataTypes.BOOLEAN,
    ledHexCode: DataTypes.STRING,
    ledModulationState: DataTypes.NUMBER,
    current: DataTypes.FLOAT,
    energy: DataTypes.FLOAT,
    energyUnit: DataTypes.STRING,
    voltage: DataTypes.FLOAT,
    voltageUnit: DataTypes.STRING,

  },
  { timestamps: false },
);

await db.sync({ alter: true, force: false });

export { StationObservation, db };
