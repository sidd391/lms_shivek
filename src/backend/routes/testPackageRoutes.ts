
import { Router } from 'express';
import {
  createTestPackage,
  getAllTestPackages,
  getTestPackageById,
  updateTestPackage,
  deleteTestPackage,
} from '../controllers/testPackageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect all test package routes

router.route('/')
  .post(createTestPackage)
  .get(getAllTestPackages);

router.route('/:id')
  .get(getTestPackageById)
  .put(updateTestPackage)
  .delete(deleteTestPackage);

export default router;
