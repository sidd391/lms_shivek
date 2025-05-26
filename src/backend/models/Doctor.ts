
import { Model, DataTypes, Optional, CreationOptional, Sequelize } from 'sequelize';

export interface DoctorAttributes {
  id: CreationOptional<number>;
  doctorID: CreationOptional<string | null>;
  title: 'Dr.' | 'Prof.' | 'Other';
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  specialty: string;
  qualification: CreationOptional<string | null>;
  experienceYears: CreationOptional<number | null>;
  consultationFee: CreationOptional<number | null>;
  email: CreationOptional<string | null>;
  phone: string;
  address: CreationOptional<string | null>;
  status: CreationOptional<'Active' | 'On Leave' | 'Inactive'>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DoctorCreationAttributes extends Optional<DoctorAttributes, 'id' | 'doctorID' | 'qualification' | 'experienceYears' | 'consultationFee' | 'email' | 'address' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Doctor extends Model<DoctorAttributes, DoctorCreationAttributes> implements DoctorAttributes {
  public declare id: CreationOptional<number>;
  public declare doctorID: CreationOptional<string | null>;
  public declare title: 'Dr.' | 'Prof.' | 'Other';
  public declare firstName: string;
  public declare lastName: string;
  public declare gender: 'Male' | 'Female' | 'Other';
  public declare specialty: string;
  public declare qualification: CreationOptional<string | null>;
  public declare experienceYears: CreationOptional<number | null>;
  public declare consultationFee: CreationOptional<number | null>;
  public declare email: CreationOptional<string | null>;
  public declare phone: string;
  public declare address: CreationOptional<string | null>;
  public declare status: CreationOptional<'Active' | 'On Leave' | 'Inactive'>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public static initModel(sequelizeInstance: Sequelize): typeof Doctor {
    Doctor.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        doctorID: { type: DataTypes.STRING, allowNull: true },
        title: { type: DataTypes.ENUM('Dr.', 'Prof.', 'Other'), allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
        specialty: { type: DataTypes.STRING, allowNull: false },
        qualification: { type: DataTypes.STRING, allowNull: true },
        experienceYears: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
        consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: { name: 'unique_doctor_email', msg: 'Email address already in use by another doctor!' },
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
        status: { type: DataTypes.ENUM('Active', 'On Leave', 'Inactive'), allowNull: false, defaultValue: 'Active' },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'doctors',
        timestamps: true,
      }
    );
    return Doctor;
  }
}

export default Doctor;
