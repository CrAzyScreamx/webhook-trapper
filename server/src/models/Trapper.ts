import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

export type RetryPolicy = 'exponential' | 'immediate' | 'none';
export type AuthType = 'bearer' | 'basic' | 'hmac' | 'none';
export type TrapperStatus = 'active' | 'paused';

interface TrapperAttributes {
  id: string;
  name: string;
  description: string | null;
  trapId: string;
  status: TrapperStatus;
  destinationUrl: string;
  retryPolicy: RetryPolicy;
  authType: AuthType;
  authValue: string | null;
  rateLimit: number | null;
  rateLimitWindowMs: number | null;
  hmacSecret: string | null;
  hmacHeader: string | null;
  hmacAlgorithm: 'sha256' | 'sha1';
}

interface TrapperCreationAttributes extends Optional<TrapperAttributes, 'id' | 'description' | 'authValue' | 'rateLimit' | 'rateLimitWindowMs' | 'hmacSecret' | 'hmacHeader' | 'hmacAlgorithm'> {}

class Trapper extends Model<TrapperAttributes, TrapperCreationAttributes> implements TrapperAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare trapId: string;
  declare status: TrapperStatus;
  declare destinationUrl: string;
  declare retryPolicy: RetryPolicy;
  declare authType: AuthType;
  declare authValue: string | null;
  declare rateLimit: number | null;
  declare rateLimitWindowMs: number | null;
  declare hmacSecret: string | null;
  declare hmacHeader: string | null;
  declare hmacAlgorithm: 'sha256' | 'sha1';
}

Trapper.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    trapId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused'),
      defaultValue: 'active',
      allowNull: false,
    },
    destinationUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    retryPolicy: {
      type: DataTypes.ENUM('exponential', 'immediate', 'none'),
      defaultValue: 'none',
      allowNull: false,
    },
    authType: {
      type: DataTypes.ENUM('bearer', 'basic', 'hmac', 'none'),
      defaultValue: 'none',
      allowNull: false,
    },
    authValue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rateLimitWindowMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hmacSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hmacHeader: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hmacAlgorithm: {
      type: DataTypes.STRING,
      defaultValue: 'sha256',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'trappers',
  }
);

export default Trapper;
