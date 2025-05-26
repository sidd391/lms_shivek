
import type { Response } from 'express';
import { Op } from 'sequelize';
import type { BillAttributes, BillStatus, PaymentMode } from '../models/Bill';
import type { BillItemCreationAttributes } from '../models/BillItem';
import type { ReportAttributes } from '../models/Report';
import type { ReportItemAttributes } from '../models/ReportItem';
import type { PatientAttributes } from '../models/Patient';
import type { DoctorAttributes } from '../models/Doctor';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

const generateBillNumber = async (BillModel: any): Promise<string> => {
  const prefix = 'INV';
  let lastBill = await BillModel.findOne({
    order: [['billNumber', 'DESC']], attributes: ['billNumber'],
  });
  let nextNumber = 1;
  if (lastBill && lastBill.billNumber && lastBill.billNumber.startsWith(prefix)) {
    const lastNumberStr = lastBill.billNumber.substring(prefix.length);
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

const generateReportIdNumber = async (ReportModel: any): Promise<string> => {
  const prefix = 'REP';
  let lastReport = await ReportModel.findOne({
    order: [['reportIdNumber', 'DESC']], attributes: ['reportIdNumber'],
  });
  let nextNumber = 1;
  if (lastReport && lastReport.reportIdNumber && lastReport.reportIdNumber.startsWith(prefix)) {
    const lastNumberStr = lastReport.reportIdNumber.substring(prefix.length);
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }
  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

interface CreateBillRequestBody {
  patientId: number; doctorId?: number | null;
  selectedTests: Array<{ id: string; dbId: number; name: string; price: number; isPackage?: boolean; }>;
  amountReceived?: number; paymentMode?: PaymentMode; discountAmount?: number;
  notes?: string; billDate?: string; status?: BillStatus;
}
interface UpdateBillRequestBody {
  amountReceived?: number; paymentMode?: PaymentMode; discountAmount?: number; notes?: string;
}

const parseBillNumerics = (billData: any) => {
    if (!billData) return null;
    const plainBill = billData.get ? billData.get({ plain: true }) : billData;
    return {
        ...plainBill,
        subTotal: parseFloat(String(plainBill.subTotal)),
        discountAmount: parseFloat(String(plainBill.discountAmount)),
        grandTotal: parseFloat(String(plainBill.grandTotal)),
        amountReceived: parseFloat(String(plainBill.amountReceived)),
        amountDue: parseFloat(String(plainBill.amountDue)),
        items: plainBill.items ? plainBill.items.map((item: any) => ({
            ...item, itemPrice: parseFloat(String(item.itemPrice))
        })) : []
    };
};

export const createBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Bill, BillItem, Patient, Doctor, Report, ReportItem, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const {
      patientId, doctorId, selectedTests, amountReceived = 0, paymentMode = null,
      discountAmount = 0, notes, billDate,
    } = req.body as CreateBillRequestBody;

    if (!patientId || !selectedTests || selectedTests.length === 0) {
        await t.rollback(); res.status(400).json({ success: false, message: 'Patient ID and at least one test/package are required.' }); return;
    }
    const patientExists = await Patient.findByPk(patientId, { transaction: t });
    if (!patientExists) {
        await t.rollback(); res.status(404).json({ success: false, message: `Patient with ID ${patientId} not found.` }); return;
    }
    if (doctorId) {
      const doctorExists = await Doctor.findByPk(doctorId, { transaction: t });
      if (!doctorExists) {
          await t.rollback(); res.status(404).json({ success: false, message: `Doctor with ID ${doctorId} not found.` }); return;
      }
    }

    const subTotal = selectedTests.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = subTotal - discountAmount;
    const amountDue = grandTotal - amountReceived;
    const finalBillNumber = await generateBillNumber(Bill);
    let calculatedStatus: BillStatus;
    if (amountDue <= 0) calculatedStatus = 'Done';
    else if (amountReceived > 0 && amountReceived < grandTotal) calculatedStatus = 'Partial';
    else calculatedStatus = 'Pending';

    const billData: Partial<BillAttributes> = {
      billNumber: finalBillNumber, patientId, doctorId: doctorId || null,
      billDate: billDate ? new Date(billDate) : new Date(), subTotal, discountAmount,
      grandTotal, amountReceived, amountDue, paymentMode, status: calculatedStatus, notes: notes || null,
    };
    const newBill = await Bill.create(billData as BillAttributes, { transaction: t });
    const billItemsData: BillItemCreationAttributes[] = selectedTests.map(item => ({ 
      billId: newBill.id, itemName: item.name,
      itemType: item.isPackage ? 'Package' : 'Test', itemPrice: item.price,
      originalItemId: item.dbId, 
    }));
    const createdBillItems = await BillItem.bulkCreate(billItemsData, { transaction: t });

    const finalReportIdNumber = await generateReportIdNumber(Report);
    const reportData: Partial<ReportAttributes> = {
      reportIdNumber: finalReportIdNumber, patientId: newBill.patientId, doctorId: newBill.doctorId,
      billId: newBill.id, reportDate: newBill.billDate, status: 'Initial',
      notes: `Report automatically generated for Bill #${newBill.billNumber}.`,
    };
    const newReport = await Report.create(reportData as ReportAttributes, { transaction: t });
    const reportItemsData: Partial<ReportItemAttributes>[] = createdBillItems.map(billItem => ({
      reportId: newReport.id, itemName: billItem.itemName,
      itemType: billItem.itemType as 'Test' | 'Package', originalItemId: billItem.originalItemId, 
    }));
    await ReportItem.bulkCreate(reportItemsData as ReportItemAttributes[], { transaction: t });
    await t.commit();
    const createdBillWithDetails = await Bill.findByPk(newBill.id, {
      include: [ { model: BillItem, as: 'items' }, { model: Patient, as: 'patient' }, { model: Doctor, as: 'doctor' }, { model: Report, as: 'report' } ],
    });
    res.status(201).json({ success: true, message: 'Bill and corresponding Report created successfully.', data: parseBillNumerics(createdBillWithDetails) });
  } catch (error: any) {
    await t.rollback(); console.error('Error creating bill and report:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
      res.status(500).json({ success: false, message: 'Server error during bill and report creation.' });
    }
  }
};

export const getAllBills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Bill, Patient, Doctor } = req.tenantModels;
  try {
    const { search = '', page = 1, limit = 10, status, date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const baseWhereConditions: any = {};
    if (status && typeof status === 'string' && ['Done', 'Pending', 'Partial', 'Cancelled'].includes(status)) baseWhereConditions.status = status;
    if (date && typeof date === 'string') {
        const startDate = new Date(date); startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date); endDate.setHours(23, 59, 59, 999);
        baseWhereConditions.billDate = { [Op.between]: [startDate, endDate] };
    }
    const queryOptions: any = {
      where: baseWhereConditions,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'title', 'firstName', 'lastName', 'phone'], required: false },
        { model: Doctor, as: 'doctor', attributes: ['id', 'title', 'firstName', 'lastName', 'specialty'], required: false },
      ],
      limit: Number(limit), offset: offset, order: [['billDate', 'DESC'], ['createdAt', 'DESC']], distinct: true, 
    };
    if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTermLike = `%${search}%`;
        queryOptions.where = { ...queryOptions.where, [Op.or]: [
            { billNumber: { [Op.like]: searchTermLike } }, { '$patient.firstName$': { [Op.like]: searchTermLike } },
            { '$patient.lastName$': { [Op.like]: searchTermLike } }, { '$patient.phone$': { [Op.like]: searchTermLike } },
            { '$doctor.firstName$': { [Op.like]: searchTermLike } }, { '$doctor.lastName$': { [Op.like]: searchTermLike } },
        ]};
    }
    const { count, rows } = await Bill.findAndCountAll(queryOptions);
    const formattedRows = rows.map(bill => {
        const plainBill = parseBillNumerics(bill); if (!plainBill) return null; 
        const patientData = bill.get('patient') as PatientAttributes | null;
        const doctorData = bill.get('doctor') as DoctorAttributes | null;
        return { ...plainBill,
            patientName: patientData ? `${patientData.title || ''} ${patientData.firstName} ${patientData.lastName}`.trim() : 'N/A',
            doctorName: doctorData ? `${doctorData.title || ''} ${doctorData.firstName} ${doctorData.lastName}`.trim() : 'N/A',
            patientPhone: patientData ? patientData.phone : 'N/A',
        };
    }).filter(bill => bill !== null);
    res.status(200).json({ success: true, data: formattedRows, totalPages: Math.ceil(count / Number(limit)), currentPage: Number(page), totalBills: count });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching bills.' });
  }
};

export const getBillById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Bill, BillItem, Patient, Doctor, Report } = req.tenantModels;
  try {
    const billId = req.params.id;
    const bill = await Bill.findByPk(billId, {
      include: [ { model: BillItem, as: 'items' }, { model: Patient, as: 'patient' }, { model: Doctor, as: 'doctor' }, { model: Report, as: 'report' } ],
    });
    if (!bill) { res.status(404).json({ success: false, message: 'Bill not found.' }); return; }
    res.status(200).json({ success: true, data: parseBillNumerics(bill) });
  } catch (error) {
    console.error('Error fetching bill by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bill details.' });
  }
};

export const updateBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Bill, BillItem, Patient, Doctor, Report, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const billId = parseInt(req.params.id, 10);
    if (isNaN(billId)) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid Bill ID format.' }); return; }
    const bill = await Bill.findByPk(billId, { transaction: t });
    if (!bill) { await t.rollback(); res.status(404).json({ success: false, message: 'Bill not found.' }); return; }
    if (bill.status === 'Done') { await t.rollback(); res.status(403).json({ success: false, message: 'Bill is finalized (Paid) and cannot be edited.' }); return; }
    
    const { amountReceived, paymentMode, discountAmount, notes } = req.body as UpdateBillRequestBody;
    let currentSubTotal = parseFloat(String(bill.subTotal)); 
    let currentDiscountAmount = parseFloat(String(bill.discountAmount));
    let currentAmountReceived = parseFloat(String(bill.amountReceived));
    const updateData: Partial<BillAttributes> = {};
    let newGrandTotal = currentSubTotal - currentDiscountAmount; 

    if (discountAmount !== undefined) {
        const parsedDiscount = parseFloat(String(discountAmount));
        if (!isNaN(parsedDiscount) && parsedDiscount >= 0) { updateData.discountAmount = parsedDiscount; newGrandTotal = currentSubTotal - parsedDiscount; }
        else { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid discount amount.' }); return; }
    }
    updateData.grandTotal = newGrandTotal; 
    if (amountReceived !== undefined) {
        const parsedAmountReceived = parseFloat(String(amountReceived));
        if (!isNaN(parsedAmountReceived) && parsedAmountReceived >=0) { updateData.amountReceived = parsedAmountReceived; currentAmountReceived = parsedAmountReceived; }
        else { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid amount received.' }); return; }
    }
    const newAmountDue = newGrandTotal - currentAmountReceived;
    updateData.amountDue = newAmountDue;
    let newStatus: BillStatus;
    if (newAmountDue <= 0) newStatus = 'Done';
    else if (currentAmountReceived > 0 && currentAmountReceived < newGrandTotal) newStatus = 'Partial';
    else newStatus = 'Pending';
    updateData.status = newStatus;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (notes !== undefined) updateData.notes = notes;
    if (Object.keys(updateData).length > 0) await bill.update(updateData, { transaction: t });
    await t.commit();
    const updatedBillWithDetails = await Bill.findByPk(billId, {
      include: [ { model: BillItem, as: 'items' }, { model: Patient, as: 'patient' }, { model: Doctor, as: 'doctor' }, { model: Report, as: 'report' } ],
    });
    res.status(200).json({ success: true, message: 'Bill updated successfully.', data: parseBillNumerics(updatedBillWithDetails) });
  } catch (error: any) {
    await t.rollback(); console.error('Error updating bill:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during bill update.' }); }
  }
};

export const deleteBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Bill, BillItem, Report, ReportItem, ReportParameterResult, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const billId = parseInt(req.params.id, 10);
    if (isNaN(billId)) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid Bill ID format.' }); return; }
    const bill = await Bill.findByPk(billId, { transaction: t });
    if (!bill) { await t.rollback(); res.status(404).json({ success: false, message: 'Bill not found for deletion.' }); return; }
    const report = await Report.findOne({ where: { billId: bill.id }, transaction: t });
    if (report) {
      await ReportParameterResult.destroy({ where: { reportId: report.id }, transaction: t});
      await ReportItem.destroy({where: {reportId: report.id}, transaction: t});
      await report.destroy({ transaction: t });
    }
    await BillItem.destroy({where: {billId: bill.id}, transaction: t});
    await bill.destroy({ transaction: t });
    await t.commit();
    res.status(200).json({ success: true, message: 'Bill and associated report deleted successfully.' });
  } catch (error) {
    await t.rollback(); console.error('Error deleting bill:', error);
    res.status(500).json({ success: false, message: 'Server error during bill deletion.' });
  }
};
