
import {
  Model, DataTypes, Optional, CreationOptional, Sequelize, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManySetAssociationsMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyRemoveAssociationsMixin, BelongsToManyHasAssociationMixin, BelongsToManyHasAssociationsMixin, BelongsToManyCountAssociationsMixin, BelongsToManyCreateAssociationMixin,
} from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Test from './Test';
import type { TestAttributes } from './Test';

export interface TestPackageAttributes {
  id: CreationOptional<number>;
  name: string;
  packageCode: CreationOptional<string | null>;
  price: number;
  description: CreationOptional<string | null>;
  status: CreationOptional<'Active' | 'Archived'>;
  imageSeed: CreationOptional<string | null>;
  createdAt?: Date;
  updatedAt?: Date;
  tests?: TestAttributes[];
}

interface TestPackageCreationAttributes
  extends Optional<TestPackageAttributes, 'id' | 'packageCode' | 'description' | 'status' | 'imageSeed' | 'createdAt' | 'updatedAt' | 'tests'> {}

export class TestPackage extends Model<TestPackageAttributes, TestPackageCreationAttributes> implements TestPackageAttributes {
  public declare id: CreationOptional<number>;
  public declare name: string;
  public declare packageCode: CreationOptional<string | null>;
  public declare price: number;
  public declare description: CreationOptional<string | null>;
  public declare status: CreationOptional<'Active' | 'Archived'>;
  public declare imageSeed: CreationOptional<string | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getTests: BelongsToManyGetAssociationsMixin<Test>;
  public declare addTest: BelongsToManyAddAssociationMixin<Test, number>;
  public declare addTests: BelongsToManyAddAssociationsMixin<Test, number[]>;
  public declare setTests: BelongsToManySetAssociationsMixin<Test, number[]>;
  public declare removeTest: BelongsToManyRemoveAssociationMixin<Test, number>;
  public declare removeTests: BelongsToManyRemoveAssociationsMixin<Test, number[]>;
  public declare hasTest: BelongsToManyHasAssociationMixin<Test, number>;
  public declare hasTests: BelongsToManyHasAssociationsMixin<Test, number[]>;
  public declare countTests: BelongsToManyCountAssociationsMixin;
  public declare createTest: BelongsToManyCreateAssociationMixin<Test>;

  public declare readonly tests?: Test[]; // Sequelize instances

  public static initModel(sequelizeInstance: Sequelize): typeof TestPackage {
    TestPackage.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Package name cannot be empty." } } },
        packageCode: { type: DataTypes.STRING, allowNull: true },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { isDecimal: { msg: "Price must be a decimal number." }, min: { args: [0], msg: "Price cannot be negative." } },
        },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('Active', 'Archived'), allowNull: false, defaultValue: 'Active' },
        imageSeed: { type: DataTypes.STRING, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'test_packages',
        timestamps: true,
      }
    );
    return TestPackage;
  }

  public static associate(models: any) { // `models` will be of type TenantModels
    TestPackage.belongsToMany(models.Test, {
      through: models.TestPackageTest, // Use the initialized join table model
      foreignKey: 'testPackageId',
      otherKey: 'testId',
      as: 'tests',
    });
  }
}

export default TestPackage;
