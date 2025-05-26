
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Report from './Report';
import type TestParameter from './TestParameter';

export interface ReportParameterResultAttributes {
  id: CreationOptional<number>;
  reportId: ForeignKey<Report['id']>;
  testParameterId: ForeignKey<TestParameter['id']>;
  resultValue: CreationOptional<string | null>;
  isAbnormal: CreationOptional<boolean | null>;
  notes: CreationOptional<string | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportParameterResultCreationAttributes
  extends Optional<ReportParameterResultAttributes, 'id' | 'resultValue' | 'isAbnormal' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class ReportParameterResult extends Model<ReportParameterResultAttributes, ReportParameterResultCreationAttributes> implements ReportParameterResultAttributes {
  public declare id: CreationOptional<number>;
  public declare reportId: ForeignKey<Report['id']>;
  public declare testParameterId: ForeignKey<TestParameter['id']>;
  public declare resultValue: CreationOptional<string | null>;
  public declare isAbnormal: CreationOptional<boolean | null>;
  public declare notes: CreationOptional<string | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getReport: BelongsToGetAssociationMixin<Report>;
  public declare getParameterDefinition: BelongsToGetAssociationMixin<TestParameter>;

  public static initModel(sequelizeInstance: Sequelize): typeof ReportParameterResult {
    ReportParameterResult.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        reportId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'reports', key: 'id' },
          onDelete: 'CASCADE',
        },
        testParameterId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'test_parameters', key: 'id' },
          onDelete: 'CASCADE',
        },
        resultValue: { type: DataTypes.TEXT, allowNull: true },
        isAbnormal: { type: DataTypes.BOOLEAN, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'report_parameter_results',
        timestamps: true,
        indexes: [
          { unique: true, fields: ['reportId', 'testParameterId'], name: 'unique_report_parameter_result_value' }
        ]
      }
    );
    return ReportParameterResult;
  }
}

export default ReportParameterResult;
