
import { Router } from 'express';
import {
  createTest,
  getTestsByCategoryId,
  getTestById, 
  updateTest, 
  deleteTest, 
  getAllTests, // Import new controller function
} from '../controllers/testController';
import { protect } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true }); // Handles /api/test-categories/:categoryId/tests

router.use(protect);

router.route('/')
  .post(createTest)
  .get(getTestsByCategoryId);


// Router for top-level test management (e.g., /api/tests)
const topLevelTestRouter = Router();
topLevelTestRouter.use(protect);

topLevelTestRouter.route('/') // Corresponds to GET /api/tests
    .get(getAllTests); 

topLevelTestRouter.route('/:testId') // Corresponds to /api/tests/:testId
    .get(getTestById)
    .put(updateTest)
    .delete(deleteTest);


export { router as categoryTestRoutes, topLevelTestRouter as testRoutes };
