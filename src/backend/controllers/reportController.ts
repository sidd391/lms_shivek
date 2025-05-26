
import type { Response } from 'express';
import { Op } from 'sequelize';
import type { ReportAttributes, ReportStatusType } from '../models/Report';
import type { ReportParameterResultAttributes, ReportParameterResultCreationAttributes } from '../models/ReportParameterResult';
import type { TestAttributes } from '../models/Test';
import type { TestParameterAttributes, TestParameterFieldType } from '../models/TestParameter';
import type { PatientAttributes } from '../models/Patient';
import type { DoctorAttributes } from '../models/Doctor';
import type { BillAttributes } from '../models/Bill';
import type { ReportItemAttributes } from '../models/ReportItem';
import exceljs from 'exceljs';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendReportViaWhatsApp, sendReportViaEmail } from '../services/notificationService'; // Import new services

interface ReportItemForEditing extends ReportItemAttributes {
  testDetails?: (TestAttributes & { parameters?: TestParameterAttributes[] });
}
interface ReportForEditing extends ReportAttributes {
  items?: Array<ReportItemForEditing>;
  patient?: PatientAttributes;
  doctor?: DoctorAttributes;
  bill?: BillAttributes;
  parameterResults?: ReportParameterResultAttributes[];
}

// ... (getAllReports, getReportByIdForEditing, saveReportResults, updateReportStatus, deleteReport, exportAllReports remain the same) ...
export const getAllReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Report, Patient, Doctor, Bill } = req.tenantModels;
  try {
    const { search = '', page = 1, limit = 10, status, date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const baseWhereConditions: any = {};
    if (status && typeof status === 'string') baseWhereConditions.status = status;
    if (date && typeof date === 'string') {
        const startDate = new Date(date); startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date); endDate.setHours(23, 59, 59, 999);
        baseWhereConditions.reportDate = { [Op.between]: [startDate, endDate] };
    }
    const queryOptions: any = {
      where: baseWhereConditions,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'title', 'firstName', 'lastName', 'phone', 'email', 'age', 'gender'], required: false },
        { model: Doctor, as: 'doctor', attributes: ['id', 'title', 'firstName', 'lastName', 'specialty'], required: false },
        { model: Bill, as: 'bill', attributes: ['id', 'billNumber'], required: false },
      ],
      limit: Number(limit), offset: offset, order: [['reportDate', 'DESC'], ['createdAt', 'DESC']], distinct: true,
    };
    if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTermLike = `%${search}%`;
        queryOptions.where = { ...queryOptions.where, [Op.or]: [
            { reportIdNumber: { [Op.like]: searchTermLike } }, { '$patient.firstName$': { [Op.like]: searchTermLike } },
            { '$patient.lastName$': { [Op.like]: searchTermLike } }, { '$patient.phone$': { [Op.like]: searchTermLike } },
            { '$doctor.firstName$': { [Op.like]: searchTermLike } }, { '$doctor.lastName$': { [Op.like]: searchTermLike } },
            { '$bill.billNumber$': { [Op.like]: searchTermLike } },
        ]};
    }
    const { count, rows } = await Report.findAndCountAll(queryOptions);
    const formattedRows = rows.map(reportInstance => {
        const plainReport = reportInstance.get({ plain: true }) as ReportForEditing;
        if (!plainReport) return null;
        return { ...plainReport,
            patientName: plainReport.patient ? `${plainReport.patient.title || ''} ${plainReport.patient.firstName} ${plainReport.patient.lastName}`.trim() : 'N/A',
            doctorName: plainReport.doctor ? `${plainReport.doctor.title || ''} ${plainReport.doctor.firstName} ${plainReport.doctor.lastName}`.trim() : 'N/A',
            patientPhone: plainReport.patient ? plainReport.patient.phone : 'N/A',
            patientEmail: plainReport.patient ? plainReport.patient.email : 'N/A', // Added for Send Dialog
            billNumber: plainReport.bill ? plainReport.bill.billNumber : 'N/A',
        };
    }).filter(report => report !== null);
    res.status(200).json({ success: true, data: formattedRows, totalPages: Math.ceil(count / Number(limit)), currentPage: Number(page), totalReports: count });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching reports.' });
  }
};

export const getReportByIdForEditing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Report, Patient, Doctor, Bill, ReportItem, ReportParameterResult, Test, TestParameter, TestPackage, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid Report ID.' }); return; }
    const reportInstance = await Report.findByPk(reportId, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'patientId', 'title', 'firstName', 'lastName', 'age', 'gender', 'phone', 'email'] },
        { model: Doctor, as: 'doctor', attributes: ['id', 'doctorID', 'title', 'firstName', 'lastName', 'specialty'] },
        { model: Bill, as: 'bill', attributes: ['id', 'billNumber'] },
      ],
      transaction: t,
    });
    if (!reportInstance) { await t.rollback(); res.status(404).json({ success: false, message: 'Report not found.' }); return; }
    const reportPlain = reportInstance.get({ plain: true }) as ReportAttributes;
    const rawReportItems = await ReportItem.findAll({ where: { reportId }, transaction: t });
    const allParameterResults = await ReportParameterResult.findAll({ where: { reportId }, transaction: t });
    const processedReportItems: Array<ReportItemForEditing> = [];

    for (const rawItem of rawReportItems) {
      let testDetailsForProcessing: (TestAttributes & { parameters?: TestParameterAttributes[] }) | undefined = undefined;
      if (rawItem.itemType === 'Test' && rawItem.originalItemId) {
        const testDetailsInstance = await Test.findByPk(rawItem.originalItemId, {
          include: [{ model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']] }],
          transaction: t,
        });
        testDetailsForProcessing = testDetailsInstance ? testDetailsInstance.get({ plain: true }) as (TestAttributes & { parameters?: TestParameterAttributes[] }) : undefined;

      } else if (rawItem.itemType === 'Package' && rawItem.originalItemId) {
        const packageDetailsInstance = await TestPackage.findByPk(rawItem.originalItemId, {
          include: [{ model: Test, as: 'tests', include: [{ model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']] }] }],
          transaction: t,
        });
        if (packageDetailsInstance && packageDetailsInstance.tests) {
          for (const containedTest of packageDetailsInstance.tests) {
            const explodedTestDetails = containedTest.get({ plain: true }) as (TestAttributes & { parameters?: TestParameterAttributes[] });
             if (explodedTestDetails && explodedTestDetails.parameters) {
                explodedTestDetails.parameters = explodedTestDetails.parameters.map(param => {
                    const plainParam = { ...param } as TestParameterAttributes;
                    if (plainParam.rangeLow !== null && plainParam.rangeLow !== undefined) plainParam.rangeLow = parseFloat(String(plainParam.rangeLow));
                    if (plainParam.rangeHigh !== null && plainParam.rangeHigh !== undefined) plainParam.rangeHigh = parseFloat(String(plainParam.rangeHigh));
                    
                    if (plainParam.fieldType === 'Option List' && typeof plainParam.options === 'string') {
                        try { const parsed = JSON.parse(plainParam.options); if (Array.isArray(parsed)) { plainParam.options = parsed as any; } else { plainParam.options = null;}} catch (e) { plainParam.options = null; }
                    } else if (plainParam.fieldType === 'Text Editor') {
                        plainParam.options = typeof plainParam.options === 'string' ? plainParam.options : null;
                    } else { plainParam.options = null; }
                    return plainParam;
                });
            }
            if (explodedTestDetails) {
                processedReportItems.push({
                  id: rawItem.id, reportId: rawItem.reportId, itemName: `${containedTest.name} (from ${rawItem.itemName})`,
                  itemType: 'Test', originalItemId: containedTest.id, testDetails: explodedTestDetails,
                });
            }
          }
        }
        continue;
      }
      
      if (testDetailsForProcessing && testDetailsForProcessing.parameters) {
        testDetailsForProcessing.parameters = testDetailsForProcessing.parameters.map(param => {
            const plainParam = { ...param } as TestParameterAttributes;
            if (plainParam.rangeLow !== null && plainParam.rangeLow !== undefined) plainParam.rangeLow = parseFloat(String(plainParam.rangeLow));
            if (plainParam.rangeHigh !== null && plainParam.rangeHigh !== undefined) plainParam.rangeHigh = parseFloat(String(plainParam.rangeHigh));
            
            if (plainParam.fieldType === 'Option List' && typeof plainParam.options === 'string') {
                try { const parsed = JSON.parse(plainParam.options); if (Array.isArray(parsed)) { plainParam.options = parsed as any; } else { plainParam.options = null; } } catch (e) { plainParam.options = null; }
            } else if (plainParam.fieldType === 'Text Editor') {
                plainParam.options = typeof plainParam.options === 'string' ? plainParam.options : null;
            } else { plainParam.options = null; }
            return plainParam;
        });
      }
      if (testDetailsForProcessing) {
          processedReportItems.push({ ...rawItem.get({ plain: true }), testDetails: testDetailsForProcessing });
      } else if (rawItem.itemType !== 'Package') { 
          processedReportItems.push({ ...rawItem.get({ plain: true }), testDetails: undefined });
      }
    }
    await t.commit();
    const finalReportData = { ...reportPlain, items: processedReportItems, parameterResults: allParameterResults.map(r => r.get({ plain: true })) };
    res.status(200).json({ success: true, data: finalReportData });
  } catch (error) {
    await t.rollback(); console.error('Error fetching report for editing:', error);
    res.status(500).json({ success: false, message: 'Server error fetching report details for editing.' });
  }
};

export const saveReportResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Report, ReportParameterResult, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid Report ID.' }); return; }
    const { results, overallStatus, overallNotes } = req.body as {
        results: Array<Partial<ReportParameterResultAttributes> & { testParameterId: number }>; overallStatus?: ReportStatusType; overallNotes?: string;
    };
    const report = await Report.findByPk(reportId, { transaction: t });
    if (!report) { await t.rollback(); res.status(404).json({ success: false, message: 'Report not found.' }); return; }

    if (results && Array.isArray(results)) {
      for (const resultData of results) {
        if (!resultData.testParameterId) { console.warn('Skipping result save due to missing testParameterId:', resultData); continue; }
        if (report.id === null || report.id === undefined) {
            console.error('CRITICAL: Report ID is null or undefined during saveReportResults.'); await t.rollback();
            res.status(500).json({ success: false, message: 'Internal server error: Report ID missing.' }); return;
        }
        const dataToSave: ReportParameterResultCreationAttributes = {
          reportId: report.id!, testParameterId: resultData.testParameterId,
          resultValue: resultData.resultValue, isAbnormal: resultData.isAbnormal, notes: resultData.notes,
        };
        const [resultEntry, created] = await ReportParameterResult.findOrCreate({
          where: { reportId: report.id!, testParameterId: resultData.testParameterId }, defaults: dataToSave, transaction: t,
        });
        if (!created) await resultEntry.update(dataToSave, { transaction: t });
      }
    }
    if (overallStatus && ['Initial', 'Pending', 'Completed', 'Verified'].includes(overallStatus)) report.status = overallStatus;
    if (overallNotes !== undefined) report.notes = overallNotes;
    if(report.changed()) await report.save({ transaction: t });
    await t.commit();
    res.status(200).json({ success: true, message: 'Report results and status saved successfully.' });
  } catch (error: any) {
    await t.rollback(); console.error('Error saving report results:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error saving report results.' }); }
  }
};

export const updateReportStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
    const Report = req.tenantModels.Report;
    const { id } = req.params; const { status } = req.body as { status: ReportStatusType };
    if (!status || !['Initial', 'Pending', 'Completed', 'Verified'].includes(status)) { res.status(400).json({ success: false, message: 'Invalid status provided.' }); return; }
    try {
        const report = await Report.findByPk(id);
        if (!report) { res.status(404).json({ success: false, message: 'Report not found for status update.' }); return; }
        report.status = status; await report.save();
        res.status(200).json({ success: true, message: 'Report status updated successfully.', data: report });
    } catch (error) { console.error('Error updating report status:', error); res.status(500).json({ success: false, message: 'Server error updating report status.' }); }
};
export const deleteReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
    const { Report, ReportItem, ReportParameterResult, sequelize } = req.tenantModels; 
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; const report = await Report.findByPk(id, { transaction: t });
        if (!report) { await t.rollback(); res.status(404).json({ success: false, message: 'Report not found for deletion.' }); return; }
        await ReportParameterResult.destroy({ where: { reportId: report.id }, transaction: t});
        await ReportItem.destroy({ where: { reportId: report.id }, transaction: t });
        await report.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ success: true, message: 'Report and its items/results deleted successfully.' });
    } catch (error) { await t.rollback(); console.error('Error deleting report:', error); res.status(500).json({ success: false, message: 'Server error during report deletion.' }); }
};

export const sendReportViaChannel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const { Report, Patient } = req.tenantModels;
  const { reportId } = req.params;
  const { channel, recipient } = req.body as { channel: 'whatsapp' | 'email', recipient: string };

  if (!reportId || !channel || !recipient) {
    res.status(400).json({ success: false, message: "Report ID, channel, and recipient are required." });
    return;
  }

  try {
    const numericReportId = parseInt(reportId, 10);
    if (isNaN(numericReportId)) {
        res.status(400).json({ success: false, message: "Invalid Report ID format." });
        return;
    }

    const report = await Report.findByPk(numericReportId, {
      include: [{ model: Patient, as: 'patient', attributes: ['firstName', 'lastName', 'title', 'email', 'phone'] }]
    });

    if (!report) {
      res.status(404).json({ success: false, message: "Report not found." });
      return;
    }
    
    const patientData = report.get('patient') as PatientAttributes | undefined;
    const reportDataForNotification = {
        reportIdNumber: report.reportIdNumber,
        patientName: patientData ? `${patientData.title || ''} ${patientData.firstName} ${patientData.lastName}`.trim() : 'Patient',
        // TODO: Add more relevant report data here if needed by notification templates
    };


    let result;
    if (channel === 'whatsapp') {
      result = await sendReportViaWhatsApp(recipient, report.reportIdNumber, reportDataForNotification);
    } else if (channel === 'email') {
      result = await sendReportViaEmail(recipient, report.reportIdNumber, reportDataForNotification);
    } else {
      res.status(400).json({ success: false, message: "Invalid channel specified." });
      return;
    }

    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }

  } catch (error: any) {
    console.error(`Error sending report ${reportId} via ${channel}:`, error);
    res.status(500).json({ success: false, message: error.message || "Server error while sending report." });
  }
};


export const exportAllReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Report, Patient, Doctor, Bill } = req.tenantModels;
  try {
    const reports = await Report.findAll({
      include: [
        { model: Patient, as: 'patient', attributes: ['title', 'firstName', 'lastName', 'patientId'] },
        { model: Doctor, as: 'doctor', attributes: ['title', 'firstName', 'lastName', 'doctorID'] },
        { model: Bill, as: 'bill', attributes: ['billNumber'] },
      ],
      order: [['reportDate', 'DESC']],
    });
    const workbook = new exceljs.Workbook(); const worksheet = workbook.addWorksheet('Reports');
    worksheet.columns = [
      { header: 'Report ID', key: 'reportIdNumber', width: 15 }, { header: 'Report Date', key: 'reportDate', width: 15 },
      { header: 'Patient Name', key: 'patientName', width: 30 }, { header: 'Patient ID', key: 'patientIdentifier', width: 15 },
      { header: 'Doctor Name', key: 'doctorName', width: 30 }, { header: 'Doctor ID', key: 'doctorIdentifier', width: 15 },
      { header: 'Bill Number', key: 'billNumber', width: 15 }, { header: 'Status', key: 'status', width: 15 },
      { header: 'Notes', key: 'notes', width: 50 },
    ];
    worksheet.getRow(1).font = { bold: true };
    reports.forEach(reportInstance => {
      const report = reportInstance.get({ plain: true }) as ReportForEditing; 
      worksheet.addRow({ reportIdNumber: report.reportIdNumber, reportDate: report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A',
        patientName: report.patient ? `${report.patient.title || ''} ${report.patient.firstName} ${report.patient.lastName}`.trim() : 'N/A',
        patientIdentifier: report.patient?.patientId || 'N/A',
        doctorName: report.doctor ? `${report.doctor.title || ''} ${report.doctor.firstName} ${report.doctor.lastName}`.trim() : 'N/A',
        doctorIdentifier: report.doctor?.doctorID || 'N/A',
        billNumber: report.bill?.billNumber || 'N/A', status: report.status, notes: report.notes || '',
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="reports_export_${timestamp}.xlsx"`);
    await workbook.xlsx.write(res); res.end();
  } catch (error) {
    console.error('Error exporting reports to Excel:', error);
    res.status(500).json({ success: false, message: 'Server error while exporting reports.' });
  }
};
