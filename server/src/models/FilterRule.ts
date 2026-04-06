import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import Trapper from './Trapper';

export type Operator =
  | 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'matches' | 'is_empty' | 'is_not_empty'
  | 'is_true' | 'is_false'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'in' | 'not_in'
  | 'has_key' | 'has_keys' | 'is_null' | 'is_not_null'
  | 'exists' | 'not_exists';
export type LogicOp = 'AND' | 'OR';

interface FilterRuleAttributes {
  id: string;
  trapperId: string;
  fieldPath: string;
  operator: Operator;
  value: string | null;
  order: number;
  logicOp: LogicOp;   // connector to the NEXT rule
  groupBefore: number; // how many '(' before this rule
  groupAfter: number;  // how many ')' after this rule
}

interface FilterRuleCreationAttributes extends Optional<FilterRuleAttributes, 'id' | 'value' | 'logicOp' | 'groupBefore' | 'groupAfter'> {}

class FilterRule extends Model<FilterRuleAttributes, FilterRuleCreationAttributes> implements FilterRuleAttributes {
  declare id: string;
  declare trapperId: string;
  declare fieldPath: string;
  declare operator: Operator;
  declare value: string | null;
  declare order: number;
  declare logicOp: LogicOp;
  declare groupBefore: number;
  declare groupAfter: number;
}

FilterRule.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    trapperId: { type: DataTypes.UUID, allowNull: false },
    fieldPath: { type: DataTypes.STRING, allowNull: false },
    operator: { type: DataTypes.ENUM(
      'equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'matches', 'is_empty', 'is_not_empty',
      'is_true', 'is_false',
      'gt', 'lt', 'gte', 'lte',
      'in', 'not_in',
      'has_key', 'has_keys', 'is_null', 'is_not_null',
      'exists', 'not_exists'
    ), allowNull: false },
    value: { type: DataTypes.STRING, allowNull: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    logicOp: { type: DataTypes.ENUM('AND', 'OR'), allowNull: false, defaultValue: 'AND' },
    groupBefore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    groupAfter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'filter_rules' }
);

Trapper.hasMany(FilterRule, { foreignKey: 'trapperId', as: 'rules', onDelete: 'CASCADE', hooks: true });
FilterRule.belongsTo(Trapper, { foreignKey: 'trapperId', onDelete: 'CASCADE' });

export default FilterRule;
