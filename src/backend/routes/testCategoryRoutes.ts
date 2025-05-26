
import { Router } from 'express';
import {
  createTestCategory,
  getAllTestCategories,
  getTestCategoryById,
  updateTestCategory,
  deleteTestCategory,
} from '../controllers/testCategoryController';
import { protect } from '../middleware/authMiddleware';
import { categoryTestRoutes } from './testRoutes'; // Corrected import

const router = Router();
router.use(protect);

router.route('/')
  .post(createTestCategory)
  .get(getAllTestCategories);

router.route('/:id')
  .get(getTestCategoryById)
  .put(updateTestCategory)
  .delete(deleteTestCategory);

// Mount test routes nested under a specific category
// This means requests to /api/test-categories/:categoryId/tests/... will be handled by categoryTestRoutes
router.use('/:categoryId/tests', categoryTestRoutes); // Use the correctly imported router

export default router;

