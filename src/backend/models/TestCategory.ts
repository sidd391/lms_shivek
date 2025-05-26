
import { Model, DataTypes, Optional, CreationOptional, Sequelize, HasManyGetAssociationsMixin, HasManyAddAssociationMixin } from 'sequelize';
// Removed: import sequelize from '../config/database';
import type Test from './Test'; // For association type hinting

export interface TestCategoryAttributes {
  id: CreationOptional<number>;
  name: string;
  description: CreationOptional<string | null>;
  icon: CreationOptional<string | null>;
  imageSeed: CreationOptional<string | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TestCategoryCreationAttributes
  extends Optional<TestCategoryAttributes, 'id' | 'description' | 'icon' | 'imageSeed' | 'createdAt' | 'updatedAt'> {}

export class TestCategory extends Model<TestCategoryAttributes, TestCategoryCreationAttributes> implements TestCategoryAttributes {
  public declare id: CreationOptional<number>;
  public declare name: string;
  public declare description: CreationOptional<string | null>;
  public declare icon: CreationOptional<string | null>;
  public declare imageSeed: CreationOptional<string | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getTests: HasManyGetAssociationsMixin<Test>;
  public declare addTest: HasManyAddAssociationMixin<Test, number>;

  public static initModel(sequelizeInstance: Sequelize): typeof TestCategory {
    TestCategory.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { name: 'unique_test_category_name', msg: 'Test category name already exists.' },
        },
        description: { type: DataTypes.TEXT, allowNull: true },
        icon: { type: DataTypes.STRING, allowNull: true },
        imageSeed: { type: DataTypes.STRING, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'test_categories',
        timestamps: true,
      }
    );
    return TestCategory;
  }

  public static associate(models: any) { // `models` will be of type TenantModels
    TestCategory.hasMany(models.Test, {
      foreignKey: 'categoryId',
      as: 'tests',
    });
  }
}

export default TestCategory;
