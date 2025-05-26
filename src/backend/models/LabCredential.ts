
import { Model, DataTypes, Optional, CreationOptional } from 'sequelize';
import registrySequelize from '../config/registryDatabase'; // Import the specific Sequelize instance for the registry

export interface LabCredentialAttributes {
  labCode: string; // This will be the primary key
  dbHost: string;
  dbName: string;
  dbUser: string;
  dbPass: string; 
  createdAt?: Date;
  updatedAt?: Date;
}

// For creation, all attributes are required as it's seeding/manual entry
interface LabCredentialCreationAttributes extends LabCredentialAttributes {}

export class LabCredential extends Model<LabCredentialAttributes, LabCredentialCreationAttributes> implements LabCredentialAttributes {
  public declare labCode: string;
  public declare dbHost: string;
  public declare dbName: string;
  public declare dbUser: string;
  public declare dbPass: string;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;
}

LabCredential.init(
  {
    labCode: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    dbHost: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dbName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dbUser: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dbPass: {
      type: DataTypes.STRING, 
      allowNull: false,
    },
  },
  {
    sequelize: registrySequelize, 
    tableName: 'lab_credentials', 
    timestamps: true,
  }
);

export default LabCredential;
