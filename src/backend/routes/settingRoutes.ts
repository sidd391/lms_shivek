
import { Router } from 'express';
import { getSetting, updateSetting } from '../controllers/settingController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect all setting routes

router.route('/:settingKey')
  .get(getSetting)
  .put(updateSetting);

export default router;
