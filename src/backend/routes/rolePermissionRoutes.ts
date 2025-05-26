
import { Router } from 'express';
import {
  getRolePermissions,
  updateRolePermissions,
  deleteRoleAndPermissions,
} from '../controllers/rolePermissionController';
import { protect } from '../middleware/authMiddleware'; // Assuming these actions are protected

const router = Router();

router.use(protect); // Protect all role-permission routes

router.route('/')
  .get(getRolePermissions);

router.route('/:roleName')
  .put(updateRolePermissions) // Using PUT to update/set permissions for a role
  .delete(deleteRoleAndPermissions); // To delete a custom role definition and its permissions

export default router;
