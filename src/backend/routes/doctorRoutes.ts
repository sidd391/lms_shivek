
import { Router } from 'express';
import {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Apply protect middleware to all doctor routes
router.use(protect);

router.route('/')
  .post(createDoctor)
  .get(getAllDoctors);

router.route('/:id')
  .get(getDoctorById)
  .put(updateDoctor)
  .delete(deleteDoctor);

export default router;
