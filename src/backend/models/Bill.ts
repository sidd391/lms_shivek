
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin, HasOneGetAssociationMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Patient from './Patient';
import type Doctor from './Doctor';
import type Report from './Report';
import type BillItem from './BillItem';

export type BillStatus = 'Pending' | 'Done' | 'Partial' | 'Cancelled';
export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Online' | 'Cheque' | null;

export interface BillAttributes {
  id: CreationOptional<number>;
  billNumber: CreationOptional<string>;
  patientId: ForeignKey<Patient['id']>;
  doctorId: CreationOptional<ForeignKey<Doctor['id'] | null>>;
  billDate: CreationOptional<Date>;
  subTotal: number;
  discountAmount: CreationOptional<number>;
  grandTotal: number;
  amountReceived: CreationOptional<number>;
  amountDue: CreationOptional<number>;
  paymentMode: CreationOptional<PaymentMode>;
  status: CreationOptional<BillStatus>;
  notes: CreationOptional<string | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BillCreationAttributes
  extends Optional<BillAttributes, 'id' | 'billNumber' | 'doctorId' | 'billDate' | 'discountAmount' | 'amountReceived' | 'amountDue' | 'paymentMode' | 'status' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class Bill extends Model<BillAttributes, BillCreationAttributes> implements BillAttributes {
  public declare id: CreationOptional<number>;
  public declare billNumber: CreationOptional<string>;
  public declare patientId: ForeignKey<Patient['id']>;
  public declare doctorId: CreationOptional<ForeignKey<Doctor['id'] | null>>;
  public declare billDate: CreationOptional<Date>;
  public declare subTotal: number;
  public declare discountAmount: CreationOptional<number>;
  public declare grandTotal: number;
  public declare amountReceived: CreationOptional<number>;
  public declare amountDue: CreationOptional<number>;
  public declare paymentMode: CreationOptional<PaymentMode>;
  public declare status: CreationOptional<BillStatus>;
  public declare notes: CreationOptional<string | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getPatient: BelongsToGetAssociationMixin<Patient>;
  public declare getDoctor: BelongsToGetAssociationMixin<Doctor>;
  public declare getItems: HasManyGetAssociationsMixin<BillItem>;
  public declare getReport: HasOneGetAssociationMixin<Report>;


  public static initModel(sequelizeInstance: Sequelize): typeof Bill {
    Bill.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        billNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { name: 'unique_bill_number', msg: 'Bill number must be unique.' },
        },
        patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'patients', key: 'id' } },
        doctorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'doctors', key: 'id' } },
        billDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        subTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
        discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
        grandTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
        amountReceived: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
        amountDue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
        paymentMode: { type: DataTypes.ENUM('Cash', 'Card', 'UPI', 'Online', 'Cheque'), allowNull: true },
        status: { type: DataTypes.ENUM('Pending', 'Done', 'Partial', 'Cancelled'), allowNull: false, defaultValue: 'Pending' },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'bills',
        timestamps: true,
      }
    );
    return Bill;
  }

  public static associate(models: any) { // `models` will be of type TenantModels
    Bill.hasMany(models.BillItem, { foreignKey: 'billId', as: 'items', onDelete: 'CASCADE' });
    Bill.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Bill.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    Bill.hasOne(models.Report, { foreignKey: 'billId', as: 'report' });
  }
}

export default Bill;
