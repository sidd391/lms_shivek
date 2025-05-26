
import { Model, DataTypes, Optional, CreationOptional, ForeignKey, Sequelize, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyCreateAssociationMixin, BelongsToGetAssociationMixin } from 'sequelize';
import type TestCategory from './TestCategory';
import type TestParameter from './TestParameter';
import type { TestParameterAttributes } from './TestParameter'; // Ensure this import is correct

export interface TestAttributes {
  id: CreationOptional<number>;
  name: string;
  shortCode: string;
  price: number;
  turnAroundTime: string;
  sampleType: string;
  methodology: CreationOptional<string | null>;
  normalRange: CreationOptional<string | null>; // Overall normal range
  description: CreationOptional<string | null>;
  categoryId: ForeignKey<TestCategory['id']>;
  createdAt?: Date;
  updatedAt?: Date;
  parameters?: TestParameterAttributes[]; // For when parameters are included as plain objects
}

interface TestCreationAttributes
  extends Optional<TestAttributes, 'id' | 'methodology' | 'normalRange' | 'description' | 'createdAt' | 'updatedAt' | 'parameters'> {}

export class Test extends Model<TestAttributes, TestCreationAttributes> implements TestAttributes {
  public declare id: CreationOptional<number>;
  public declare name: string;
  public declare shortCode: string;
  public declare price: number;
  public declare turnAroundTime: string;
  public declare sampleType: string;
  public declare methodology: CreationOptional<string | null>;
  public declare normalRange: CreationOptional<string | null>;
  public declare description: CreationOptional<string | null>;
  public declare categoryId: ForeignKey<TestCategory['id']>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public declare getParameters: HasManyGetAssociationsMixin<TestParameter>;
  public declare addParameter: HasManyAddAssociationMixin<TestParameter, number>;
  public declare createParameter: HasManyCreateAssociationMixin<TestParameter>;
  public declare getCategory: BelongsToGetAssociationMixin<TestCategory>;

  // This is the Sequelize association. When eager loading, it will be TestParameter instances.
  public declare readonly parameters?: TestParameter[]; // Sequelize instances if eager loaded

  public static initModel(sequelizeInstance: Sequelize): typeof Test {
    Test.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            name: 'unique_test_name', // Named unique constraint
            msg: 'A test with this name already exists.',
          },
          validate: { notEmpty: { msg: "Test name cannot be empty."} }
        },
        shortCode: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Short code cannot be empty."} } },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { isDecimal: { msg: "Price must be a decimal number."}, min: { args: [0], msg: "Price cannot be negative." } },
        },
        turnAroundTime: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Turnaround time cannot be empty."} } },
        sampleType: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Sample type cannot be empty."} } },
        methodology: { type: DataTypes.STRING, allowNull: true },
        normalRange: { type: DataTypes.TEXT, allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        categoryId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'test_categories', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'tests',
        timestamps: true,
      }
    );
    return Test;
  }

  public static associate(models: any) { // `models` will be of type TenantModels
    Test.belongsTo(models.TestCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });
    Test.hasMany(models.TestParameter, {
      foreignKey: 'testId',
      as: 'parameters',
      onDelete: 'CASCADE',
    });
    Test.belongsToMany(models.TestPackage, {
      through: models.TestPackageTest,
      foreignKey: 'testId',
      otherKey: 'testPackageId',
      as: 'packages',
    });
  }
}

export default Test;
