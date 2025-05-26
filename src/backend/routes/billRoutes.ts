import { Router } from 'express';
import {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
} from '../controllers/billController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect all bill routes

router.route('/')
  .post(createBill)
  .get(getAllBills);

router.route('/:id')
  .get(getBillById)
  .put(updateBill) // Placeholder
  .delete(deleteBill); // Placeholder

export default router;
