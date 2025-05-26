
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Report from './Report';

export type ReportItemType = 'Test' | 'Package';

export interface ReportItemAttributes {
  id: CreationOptional<number>;
  reportId: ForeignKey<Report['id']>;
  itemName: string;
  itemType: ReportItemType;
  originalItemId: CreationOptional<number | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReportItemCreationAttributes extends Optional<ReportItemAttributes, 'id' | 'originalItemId' | 'createdAt' | 'updatedAt'> {}

export class ReportItem extends Model<ReportItemAttributes, ReportItemCreationAttributes> implements ReportItemAttributes {
  public declare id: CreationOptional<number>;
  public declare reportId: ForeignKey<Report['id']>;
  public declare itemName: string;
  public declare itemType: ReportItemType;
  public declare originalItemId: CreationOptional<number | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getReport: BelongsToGetAssociationMixin<Report>;

  public static initModel(sequelizeInstance: Sequelize): typeof ReportItem {
    ReportItem.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        reportId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'reports', key: 'id' },
          onDelete: 'CASCADE',
        },
        itemName: { type: DataTypes.STRING, allowNull: false },
        itemType: { type: DataTypes.ENUM('Test', 'Package'), allowNull: false },
        originalItemId: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'report_items',
        timestamps: true,
      }
    );
    return ReportItem;
  }
}

export default ReportItem;
