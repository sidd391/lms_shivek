
import { Router } from 'express';
import { login, logout, getAuthStatus, changePassword, validateLabCode } from '../controllers/authController'; // Added validateLabCode
import { protect } from '../middleware/authMiddleware'; 

const router = Router();

router.post('/login', login);
router.post('/logout', logout); 
router.post('/validate-lab-code', validateLabCode); // New route for lab code validation
router.get('/status', protect, getAuthStatus); 
router.post('/change-password', protect, changePassword); // New route for changing password

export default router;

