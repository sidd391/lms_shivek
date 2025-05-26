
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type TestPackage from './TestPackage';
import type Test from './Test';

export interface TestPackageTestAttributes {
  id: CreationOptional<number>;
  testPackageId: ForeignKey<TestPackage['id']>;
  testId: ForeignKey<Test['id']>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TestPackageTestCreationAttributes extends Optional<TestPackageTestAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class TestPackageTest extends Model<TestPackageTestAttributes, TestPackageTestCreationAttributes> implements TestPackageTestAttributes {
  public declare id: CreationOptional<number>;
  public declare testPackageId: ForeignKey<TestPackage['id']>;
  public declare testId: ForeignKey<Test['id']>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public static initModel(sequelizeInstance: Sequelize): typeof TestPackageTest {
    TestPackageTest.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        testPackageId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'test_packages', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        testId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'tests', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'test_package_tests',
        timestamps: true,
        indexes: [
          { unique: true, fields: ['testPackageId', 'testId'], name: 'unique_test_package_test_association' }
        ]
      }
    );
    return TestPackageTest;
  }
}

export default TestPackageTest;
