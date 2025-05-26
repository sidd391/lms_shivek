
import { Model, DataTypes, Optional, CreationOptional, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
// Removed: import sequelize from '../config/database'; // No longer using global sequelize here

export const staffRoles = ["Admin", "Technician", "Receptionist", "Doctor", "Accountant", "Other"] as const;
export type StaffRole = typeof staffRoles[number];

export interface UserAttributes {
  id: CreationOptional<number>;
  email: string;
  passwordHash: string;
  title: CreationOptional<'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Other' | null>;
  firstName: string;
  lastName: string;
  phone: CreationOptional<string | null>;
  role: CreationOptional<StaffRole>;
  status: CreationOptional<'Active' | 'Inactive'>;
  age: CreationOptional<number | null>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'title' | 'phone' | 'role' | 'status' | 'age' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public declare id: CreationOptional<number>;
  public declare email: string;
  public declare passwordHash: string;
  public declare title: CreationOptional<'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Other' | null>;
  public declare firstName: string;
  public declare lastName: string;
  public declare phone: CreationOptional<string | null>;
  public declare role: CreationOptional<StaffRole>;
  public declare status: CreationOptional<'Active' | 'Inactive'>;
  public declare age: CreationOptional<number | null>;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public async validPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  public get fullName(): string {
    let name = '';
    if (this.getDataValue('title')) {
      name += this.getDataValue('title') + ' ';
    }
    name += `${this.getDataValue('firstName')} ${this.getDataValue('lastName')}`;
    return name.trim();
  }

  public static initModel(sequelizeInstance: Sequelize): typeof User {
    User.init(
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { name: 'unique_user_email_address', msg: 'Email address already in use.' },
          validate: { isEmail: true },
        },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other'), allowNull: true },
        firstName: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "First name cannot be empty."} } },
        lastName: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: "Last name cannot be empty."} } },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            is: { args: /^\+?[0-9\s-()]{7,}$/i, msg: "Phone number must be at least 7 digits and contain valid characters if provided."}
          }
        },
        role: { type: DataTypes.ENUM(...staffRoles), allowNull: false, defaultValue: 'Other' },
        status: { type: DataTypes.ENUM('Active', 'Inactive'), allowNull: false, defaultValue: 'Active' },
        age: { type: DataTypes.INTEGER, allowNull: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'users',
        hooks: {
          beforeSave: async (user: User) => {
            if (user.changed('passwordHash') && user.passwordHash) {
              const plainPassword = user.passwordHash;
              if (!plainPassword.startsWith('$2a$') && !plainPassword.startsWith('$2b$')) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(plainPassword, salt);
              }
            }
          },
        },
        defaultScope: { attributes: { exclude: ['passwordHash'] } },
        scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
      }
    );
    return User;
  }
}

export default User; // Export the class, not an instance
