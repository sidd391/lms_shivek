
import type { Response } from 'express';
import { staffRoles as predefinedStaffRoles } from '../models/User';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const StaffRolePermission = req.tenantModels.StaffRolePermission;
  try {
    const allMappings = await StaffRolePermission.findAll();
    const permissionsByRole: Record<string, string[]> = {};
    predefinedStaffRoles.forEach(role => {
        if (!permissionsByRole[role]) permissionsByRole[role] = [];
    });
    allMappings.forEach(mapping => {
      if (!permissionsByRole[mapping.roleName]) permissionsByRole[mapping.roleName] = [];
      permissionsByRole[mapping.roleName].push(mapping.permissionId);
    });
    res.status(200).json({ success: true, data: permissionsByRole });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching role permissions.' });
  }
};

export const updateRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const { StaffRolePermission, sequelize } = req.tenantModels;
  const { roleName } = req.params;
  const { permissions } = req.body;

  if (!roleName || !Array.isArray(permissions)) {
    res.status(400).json({ success: false, message: 'Role name and permissions array are required.' });
    return;
  }

  const t = await sequelize.transaction();
  try {
    await StaffRolePermission.destroy({ where: { roleName }, transaction: t });
    if (permissions.length > 0) {
      const newMappings = permissions.map((permissionId: string) => ({ roleName, permissionId }));
      await StaffRolePermission.bulkCreate(newMappings, { transaction: t });
    }
    await t.commit();
    res.status(200).json({ success: true, message: `Permissions for role "${roleName}" updated successfully.` });
  } catch (error) {
    await t.rollback();
    console.error(`Error updating permissions for role ${roleName}:`, error);
    res.status(500).json({ success: false, message: 'Server error while updating role permissions.' });
  }
};

export const deleteRoleAndPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const { StaffRolePermission, sequelize } = req.tenantModels;
  const { roleName } = req.params;

  if (!roleName) { res.status(400).json({ success: false, message: 'Role name is required.' }); return; }
  if (roleName.toLowerCase() === 'admin' || roleName.toLowerCase() === 'administrator') {
      res.status(403).json({ success: false, message: 'The Administrator role cannot be deleted.' }); return;
  }

  const t = await sequelize.transaction();
  try {
    const deletedCount = await StaffRolePermission.destroy({ where: { roleName }, transaction: t });
    await t.commit();
    if (deletedCount > 0 || !predefinedStaffRoles.map(r => r.toLowerCase()).includes(roleName.toLowerCase())) {
      res.status(200).json({ success: true, message: `Role "${roleName}" and its permissions deleted successfully.` });
    } else {
      res.status(404).json({ success: false, message: `Role "${roleName}" not found or had no permissions to delete.` });
    }
  } catch (error) {
    await t.rollback();
    console.error(`Error deleting role ${roleName}:`, error);
    res.status(500).json({ success: false, message: 'Server error while deleting role.' });
  }
};
