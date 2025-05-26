
import { Model, DataTypes, Optional, CreationOptional, Sequelize } from 'sequelize';
// Removed: import sequelize from '../config/database';

export interface SettingAttributes {
  key: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SettingCreationAttributes extends SettingAttributes {}

export class Setting extends Model<SettingAttributes, SettingCreationAttributes> implements SettingAttributes {
  public declare key: string;
  public declare value: string;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public static initModel(sequelizeInstance: Sequelize): typeof Setting {
    Setting.init(
      {
        key: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        value: { type: DataTypes.TEXT, allowNull: false },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'settings',
        timestamps: true,
      }
    );
    return Setting;
  }
}

export default Setting;
