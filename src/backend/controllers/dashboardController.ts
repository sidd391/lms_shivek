
import type { Response } from 'express';
import { Op } from 'sequelize'; // Op is fine to import globally
// Type-only imports are okay.
import type { BillAttributes } from '../models/Bill';
import type { PatientAttributes } from '../models/Patient';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

interface PlainBillWithPatient extends BillAttributes {
  patient?: PatientAttributes;
}

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    console.error("[DashboardCtrl] CRITICAL: Tenant context not available in getDashboardSummary.");
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }

  // Destructure models and sequelize from the request-specific tenant context
  const { Patient, Doctor, Bill, Report, sequelize } = req.tenantModels;

  // Diagnostic Log
  console.log(`[DashboardCtrl] Inside controller. req.tenantModels.sequelize DB: ${sequelize.getDatabaseName()}. Patient model's sequelize DB: ${Patient.sequelize?.getDatabaseName()}`);

  console.log(`[DashboardCtrl] Using DB: ${sequelize.getDatabaseName()} for dashboard summary for labCode: ${req.user?.labCode}.`);

  try {
    const totalPatients = await Patient.count();
    const totalDoctors = await Doctor.count();
    const pendingBills = await Bill.count({ where: { status: 'Pending' } });
    const partialBills = await Bill.count({ where: { status: 'Partial' } });
    const reportsToVerify = await Report.count({ where: { status: 'Completed' } });
    const reportsVerified = await Report.count({ where: { status: 'Verified' } });

    const recentBillsFromDb = await Bill.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Patient, as: 'patient', attributes: ['firstName', 'lastName', 'title'] }],
      attributes: ['id', 'billNumber', 'grandTotal', 'status', 'billDate', 'createdAt'],
    });

    const formattedRecentBills = recentBillsFromDb.map(billInstance => {
      const plainBill = billInstance.get({ plain: true }) as PlainBillWithPatient;
      return {
        id: plainBill.id,
        billNumber: plainBill.billNumber,
        patientName: plainBill.patient ? `${plainBill.patient.title || ''} ${plainBill.patient.firstName} ${plainBill.patient.lastName}`.trim() : 'N/A',
        grandTotal: parseFloat(String(plainBill.grandTotal)).toFixed(2),
        status: plainBill.status,
        billDate: plainBill.billDate,
        createdAt: plainBill.createdAt,
      };
    });

    const billStatusCounts = await Bill.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true,
    });
    
    const allStatuses: ['Pending', 'Partial', 'Done', 'Cancelled'] = ['Pending', 'Partial', 'Done', 'Cancelled'];
    const billStatusSummary = allStatuses.map(statusName => {
        const found = billStatusCounts.find((s: any) => s.status === statusName) as { status: string; count: string | number } | undefined;
        return { name: statusName, value: found ? parseInt(String(found.count), 10) : 0 };
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients, totalDoctors, pendingBills, partialBills,
        reportsToVerify, reportsVerified, recentBills: formattedRecentBills,
        billStatusSummary,
      },
    });

  } catch (error) {
    console.error(`[DashboardCtrl] Error fetching dashboard summary for DB ${sequelize.getDatabaseName()}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching dashboard summary.' });
  }
};
    