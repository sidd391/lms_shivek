
import { Router } from 'express';
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  exportAllPatients, // Import the new controller
} from '../controllers/patientController';
import { protect } from '../middleware/authMiddleware'; // Assuming you want to protect these routes

const router = Router();

// Apply protect middleware to all patient routes
router.use(protect);

router.route('/')
  .post(createPatient)
  .get(getAllPatients);

router.route('/export') // New route for Excel export
  .get(exportAllPatients);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient)
  .delete(deletePatient);

export default router;
