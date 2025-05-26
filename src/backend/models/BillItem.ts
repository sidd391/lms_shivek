
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Bill from './Bill';

export type BillItemType = 'Test' | 'Package';

export interface BillItemAttributes {
  id: CreationOptional<number>;
  billId: ForeignKey<Bill['id']>;
  itemName: string;
  itemType: BillItemType;
  itemPrice: number;
  originalItemId: CreationOptional<number | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillItemCreationAttributes extends Optional<BillItemAttributes, 'id' | 'createdAt' | 'updatedAt' | 'originalItemId'> {}

export class BillItem extends Model<BillItemAttributes, BillItemCreationAttributes> implements BillItemAttributes {
  public declare id: CreationOptional<number>;
  public declare billId: ForeignKey<Bill['id']>;
  public declare itemName: string;
  public declare itemType: BillItemType;
  public declare itemPrice: number;
  public declare originalItemId: CreationOptional<number | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getBill: BelongsToGetAssociationMixin<Bill>;

  public static initModel(sequelizeInstance: Sequelize): typeof BillItem {
    BillItem.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        billId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'bills', key: 'id' },
          onDelete: 'CASCADE',
        },
        itemName: { type: DataTypes.STRING, allowNull: false },
        itemType: { type: DataTypes.ENUM('Test', 'Package'), allowNull: false },
        itemPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
        originalItemId: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'bill_items',
        timestamps: true,
      }
    );
    return BillItem;
  }
}

export default BillItem;
