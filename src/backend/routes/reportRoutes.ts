
import { Router } from 'express';
import {
  getAllReports,
  getReportByIdForEditing, 
  updateReportStatus,
  deleteReport,
  saveReportResults, 
  exportAllReports,
  sendReportViaChannel, // Import new controller
} from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect all report routes

router.route('/')
  .get(getAllReports);

router.route('/export') 
  .get(exportAllReports);

router.route('/:id')
  .get(getReportByIdForEditing) 
  .delete(deleteReport);

router.route('/:reportId/send') // New route for sending report
  .post(sendReportViaChannel);

router.route('/:id/status') 
    .put(updateReportStatus);

router.route('/:id/results') 
    .put(saveReportResults);


export default router;
