
import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deactivateStaff, // Using deactivate instead of hard delete for user accounts
  // deleteStaff, // Uncomment if hard delete is preferred
} from '../controllers/staffController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Apply protect middleware to all staff routes
router.use(protect);

router.route('/')
  .post(createStaff)
  .get(getAllStaff);

router.route('/:id')
  .get(getStaffById)
  .put(updateStaff)
  .delete(deactivateStaff); // Or use deleteStaff for hard delete

export default router;
