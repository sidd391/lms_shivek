
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin, HasManyGetAssociationsMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Patient from './Patient';
import type Doctor from './Doctor';
import type Bill from './Bill';
import type ReportItem from './ReportItem';
import type ReportParameterResult from './ReportParameterResult';
import type { PatientAttributes } from './Patient';
import type { DoctorAttributes } from './Doctor';
import type { BillAttributes } from './Bill';
import type { ReportItemAttributes } from './ReportItem';
import type { ReportParameterResultAttributes } from './ReportParameterResult';

export type ReportStatusType = 'Initial' | 'Pending' | 'Completed' | 'Verified';

export interface ReportAttributes {
  id: CreationOptional<number>;
  reportIdNumber: CreationOptional<string>;
  patientId: ForeignKey<Patient['id']>;
  doctorId: CreationOptional<ForeignKey<Doctor['id'] | null>>;
  billId: ForeignKey<Bill['id']>;
  reportDate: CreationOptional<Date>;
  status: CreationOptional<ReportStatusType>;
  notes: CreationOptional<string | null>;
  createdAt?: Date;
  updatedAt?: Date;
  items?: ReportItemAttributes[];
  patient?: PatientAttributes;
  doctor?: DoctorAttributes;
  bill?: BillAttributes;
  parameterResults?: ReportParameterResultAttributes[];
}

interface ReportCreationAttributes
  extends Optional<ReportAttributes, 'id' | 'reportIdNumber' | 'doctorId' | 'reportDate' | 'status' | 'notes' | 'createdAt' | 'updatedAt' | 'items' | 'patient' | 'doctor' | 'bill' | 'parameterResults'> {}

export class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public declare id: CreationOptional<number>;
  public declare reportIdNumber: CreationOptional<string>;
  public declare patientId: ForeignKey<Patient['id']>;
  public declare doctorId: CreationOptional<ForeignKey<Doctor['id'] | null>>;
  public declare billId: ForeignKey<Bill['id']>;
  public declare reportDate: CreationOptional<Date>;
  public declare status: CreationOptional<ReportStatusType>;
  public declare notes: CreationOptional<string | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getPatient: BelongsToGetAssociationMixin<Patient>;
  public declare getDoctor: BelongsToGetAssociationMixin<Doctor>;
  public declare getBill: BelongsToGetAssociationMixin<Bill>;
  public declare getItems: HasManyGetAssociationsMixin<ReportItem>;
  public declare getParameterResults: HasManyGetAssociationsMixin<ReportParameterResult>;

  public readonly items?: ReportItemAttributes[];
  public readonly patient?: PatientAttributes;
  public readonly doctor?: DoctorAttributes;
  public readonly bill?: BillAttributes;
  public readonly parameterResults?: ReportParameterResultAttributes[];

  public static initModel(sequelizeInstance: Sequelize): typeof Report {
    Report.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        reportIdNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { name: 'unique_report_id_number', msg: 'Report ID number must be unique.' },
        },
        patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'patients', key: 'id' } },
        doctorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'doctors', key: 'id' } },
        billId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: { name: 'unique_report_bill_id', msg: 'A report for this bill already exists.' },
          references: { model: 'bills', key: 'id' },
        },
        reportDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        status: { type: DataTypes.ENUM('Initial', 'Pending', 'Completed', 'Verified'), allowNull: false, defaultValue: 'Initial' },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'reports',
        timestamps: true,
      }
    );
    return Report;
  }

  public static associate(models: any) { // `models` will be of type TenantModels
    Report.hasMany(models.ReportItem, { foreignKey: 'reportId', as: 'items', onDelete: 'CASCADE' });
    Report.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    Report.belongsTo(models.Doctor, { foreignKey: 'doctorId', as: 'doctor' });
    Report.belongsTo(models.Bill, { foreignKey: 'billId', as: 'bill' });
    Report.hasMany(models.ReportParameterResult, { foreignKey: 'reportId', as: 'parameterResults', onDelete: 'CASCADE' });
  }
}

export default Report;
