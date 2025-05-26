
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
import type Test from './Test';

// Added 'Numeric Unbounded' and 'Text Editor'
export type TestParameterFieldType = 'Numeric' | 'Text' | 'Option List' | 'Formula' | 'Group' | 'Text Editor' | 'Numeric Unbounded';

export interface TestParameterAttributes {
  id: CreationOptional<number>;
  testId: ForeignKey<Test['id']>;
  name: string;
  fieldType: TestParameterFieldType;
  units: CreationOptional<string | null>;
  rangeLow: CreationOptional<number | null>; // For 'Numeric' and 'Formula'
  rangeHigh: CreationOptional<number | null>; // For 'Numeric' and 'Formula'
  rangeText: CreationOptional<string | null>; // For 'Numeric Unbounded', 'Text', or as display for Numeric/Formula
  testMethod: CreationOptional<string | null>;
  isFormula: CreationOptional<boolean>; // True if fieldType is 'Formula'
  options: CreationOptional<string | null>; // JSON string for 'Option List', HTML for 'Text Editor' default
  order: CreationOptional<number>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  formulaString: CreationOptional<string | null>; // For 'Formula'
  parentId: ForeignKey<TestParameter['id']> | null;
}

interface TestParameterCreationAttributes
  extends Optional<TestParameterAttributes, 'id' | 'units' | 'rangeLow' | 'rangeHigh' | 'rangeText' | 'testMethod' | 'isFormula' | 'options' | 'order' | 'parentId' | 'createdAt' | 'updatedAt' | 'formulaString'> {}

export class TestParameter extends Model<TestParameterAttributes, TestParameterCreationAttributes> implements TestParameterAttributes {
  public declare id: CreationOptional<number>;
  public declare testId: ForeignKey<Test['id']>;
  public declare name: string;
  public declare fieldType: TestParameterFieldType;
  public declare units: CreationOptional<string | null>;
  public declare rangeLow: CreationOptional<number | null>;
  public declare rangeHigh: CreationOptional<number | null>;
  public declare rangeText: CreationOptional<string | null>;
  public declare testMethod: CreationOptional<string | null>;
  public declare isFormula: CreationOptional<boolean>;
  public declare options: CreationOptional<string | null>;
  public declare order: CreationOptional<number>;
  public declare createdAt: CreationOptional<Date>;
  public declare updatedAt: CreationOptional<Date>;
  public declare formulaString: CreationOptional<string | null>;
  public declare parentId: ForeignKey<TestParameter['id']> | null;


  public declare getTest: BelongsToGetAssociationMixin<Test>;
  public declare getParentParameter: BelongsToGetAssociationMixin<TestParameter>;

  public getOptionsArray(): string[] | null {
    if (this.fieldType === 'Option List') {
      const rawValue = this.getDataValue('options');
      try {
        if (rawValue) {
          const parsed = JSON.parse(rawValue);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Error parsing options for TestParameter (Option List):", e);
      }
    }
    return null;
  }

  public getOptionsHTML(): string | null {
    if (this.fieldType === 'Text Editor') {
      return this.getDataValue('options');
    }
    return null;
  }

  public static initModel(sequelizeInstance: Sequelize): typeof TestParameter {
    TestParameter.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        testId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'tests', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        name: { type: DataTypes.STRING, allowNull: false },
        fieldType: { type: DataTypes.ENUM('Numeric', 'Text', 'Option List', 'Formula', 'Group', 'Text Editor', 'Numeric Unbounded'), allowNull: false },
        units: { type: DataTypes.STRING, allowNull: true },
        rangeLow: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
        rangeHigh: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
        rangeText: { type: DataTypes.TEXT, allowNull: true },
        testMethod: { type: DataTypes.STRING, allowNull: true },
        isFormula: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        options: { type: DataTypes.TEXT, allowNull: true }, // For Option List (JSON string) or Text Editor (HTML string)
        order: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        formulaString: { type: DataTypes.TEXT, allowNull: true },
        parentId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'test_parameters', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'test_parameters',
        timestamps: false,
        hooks: {
          beforeUpdate: (instance: TestParameter) => {
            instance.setDataValue('updatedAt', new Date());
          },
          beforeBulkUpdate: (options: any) => {
            if (options.attributes && !options.attributes.updatedAt) {
                options.attributes.updatedAt = new Date();
            }
            if (options.fields && !options.fields.includes('updatedAt')) {
                options.fields.push('updatedAt');
            }
          }
        }
      }
    );
    return TestParameter;
  }

  public static associate(models: any) {
    TestParameter.belongsTo(models.Test, {
      foreignKey: 'testId',
      as: 'test',
    });
    TestParameter.belongsTo(models.TestParameter, {
      as: 'parentParameter',
      foreignKey: 'parentId',
      targetKey: 'id',
      constraints: false,
    });
    TestParameter.hasMany(models.TestParameter, {
      as: 'childParameters',
      foreignKey: 'parentId',
      sourceKey: 'id',
    });
  }
}

export default TestParameter;
