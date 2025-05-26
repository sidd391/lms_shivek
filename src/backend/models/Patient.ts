
import { Model, DataTypes, Optional, CreationOptional, Sequelize } from 'sequelize';

export interface PatientAttributes {
  id: CreationOptional<number>;
  title: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Other';
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  age: number;
  dob?: CreationOptional<Date | null>;
  email?: CreationOptional<string | null>;
  phone: string;
  address?: CreationOptional<string | null>;
  patientId: CreationOptional<string | null>;
  status: CreationOptional<'Active' | 'Closed'>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PatientCreationAttributes extends Optional<PatientAttributes, 'id' | 'dob' | 'email' | 'address' | 'patientId' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Patient extends Model<PatientAttributes, PatientCreationAttributes> implements PatientAttributes {
  public declare id: CreationOptional<number>;
  public declare title: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Other';
  public declare firstName: string;
  public declare lastName: string;
  public declare gender: 'Male' | 'Female' | 'Other';
  public declare bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  public declare age: number;
  public declare dob: CreationOptional<Date | null>;
  public declare email: CreationOptional<string | null>;
  public declare phone: string;
  public declare address: CreationOptional<string | null>;
  public declare patientId: CreationOptional<string | null>;
  public declare status: CreationOptional<'Active' | 'Closed'>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public static initModel(sequelizeInstance: Sequelize): typeof Patient {
    Patient.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        title: { type: DataTypes.ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other'), allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
        bloodGroup: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'), allowNull: false },
        age: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
        dob: { type: DataTypes.DATEONLY, allowNull: true },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: { name: 'unique_patient_email', msg: 'Email address already in use by another patient!' },
          validate: {
            isEmail: true, // Standard Sequelize email validation
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            is: { args: /^\+?[0-9\s-()]{10,}$/i, msg: "Phone number must be at least 10 digits and contain valid characters."}
          }
        },
        address: { type: DataTypes.TEXT, allowNull: true },
        patientId: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.ENUM('Active', 'Closed'), allowNull: false, defaultValue: 'Active' },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'patients',
        timestamps: true,
      }
    );
    return Patient;
  }
}

export default Patient;
