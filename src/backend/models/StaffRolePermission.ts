
import { Model, DataTypes, Sequelize, CreationOptional } from 'sequelize';

export interface StaffRolePermissionAttributes {
  roleName: string;
  permissionId: string;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface StaffRolePermissionCreationAttributes extends StaffRolePermissionAttributes {}

export class StaffRolePermission extends Model<StaffRolePermissionAttributes, StaffRolePermissionCreationAttributes> implements StaffRolePermissionAttributes {
  public declare roleName: string;
  public declare permissionId: string;

  public declare readonly createdAt: CreationOptional<Date>;
  public declare readonly updatedAt: CreationOptional<Date>;

  public static initModel(sequelizeInstance: Sequelize): typeof StaffRolePermission {
    StaffRolePermission.init(
      {
        roleName: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
        permissionId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      },
      {
        sequelize: sequelizeInstance,
        tableName: 'staff_role_permissions',
        timestamps: true,
      }
    );
    return StaffRolePermission;
  }
}

export default StaffRolePermission;
