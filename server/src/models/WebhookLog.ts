import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Trapper from './Trapper';

export type LogStatus = 'SENT' | 'FILTERED' | 'REJECTED' | 'QUEUED';

interface WebhookLogAttributes {
  id: string;
  trapperId: string;
  timestamp: Date;
  sourceIp: string;
  method: string;
  headers: string;
  payload: string;
  status: LogStatus;
  responseCode: number | null;
  latency: number | null;
  errorMessage: string | null;
}

interface WebhookLogCreationAttributes extends Optional<WebhookLogAttributes, 'id' | 'responseCode' | 'latency' | 'errorMessage'> {}

class WebhookLog extends Model<WebhookLogAttributes, WebhookLogCreationAttributes> implements WebhookLogAttributes {
  declare id: string;
  declare trapperId: string;
  declare timestamp: Date;
  declare sourceIp: string;
  declare method: string;
  declare headers: string;
  declare payload: string;
  declare status: LogStatus;
  declare responseCode: number | null;
  declare latency: number | null;
  declare errorMessage: string | null;
}

WebhookLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trapperId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    sourceIp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    headers: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('SENT', 'FILTERED', 'REJECTED', 'QUEUED'),
      allowNull: false,
    },
    responseCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    latency: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'webhook_logs',
  }
);

Trapper.hasMany(WebhookLog, { foreignKey: 'trapperId', as: 'logs', onDelete: 'CASCADE' });
WebhookLog.belongsTo(Trapper, { foreignKey: 'trapperId' });

export default WebhookLog;
