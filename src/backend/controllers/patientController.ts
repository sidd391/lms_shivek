
import type { Response } from 'express'; // Removed Request as it's part of AuthenticatedRequest
import type { PatientAttributes } from '../models/Patient';
import { Op } from 'sequelize';
import exceljs from 'exceljs';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

const generatePatientId = async (PatientModel: any): Promise<string> => {
  const prefix = 'PAT';
  let isUnique = false;
  let newId = '';
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    const randomNumber = Math.floor(10000 + Math.random() * 90000).toString();
    newId = `${prefix}${randomNumber}`;
    const existingPatient = await PatientModel.findOne({ where: { patientId: newId } });
    if (!existingPatient) {
      isUnique = true;
    }
    attempts++;
  }
  if (!isUnique) {
    console.error('Failed to generate a unique patient ID after multiple attempts.');
    return `${prefix}${Date.now().toString().slice(-7)}`; 
  }
  return newId;
};

export const createPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;

  try {
    const {
      title, firstName, lastName, gender, bloodGroup, age,
      dobDay, dobMonth, dobYear, email, phone, address,
      patientId: providedPatientId,
    } = req.body;

    if (!title || !firstName || !lastName || !gender || !bloodGroup || age === undefined || !phone) {
      res.status(400).json({ success: false, message: 'Missing required patient information.' });
      return;
    }
    
    let dob: string | null = null;
    if (dobYear && dobMonth && dobDay) {
        const monthStr = dobMonth.toString().padStart(2, '0');
        const dayStr = dobDay.toString().padStart(2, '0');
        if (parseInt(dobYear, 10) > 1900 && parseInt(monthStr, 10) >= 1 && parseInt(monthStr, 10) <= 12 && parseInt(dayStr, 10) >= 1 && parseInt(dayStr, 10) <= 31) {
            dob = `${dobYear}-${monthStr}-${dayStr}`;
        } else {
            console.warn('Invalid date components received for DOB:', { dobYear, dobMonth, dobDay });
        }
    }

    let finalPatientId = providedPatientId;
    if (!finalPatientId || finalPatientId.trim() === '') {
      finalPatientId = await generatePatientId(Patient);
    } else {
      const existing = await Patient.findOne({ where: { patientId: finalPatientId } });
      if (existing) {
        res.status(409).json({ success: false, message: `Patient ID ${finalPatientId} already exists.` });
        return;
      }
    }
    
    const patientData: Partial<PatientAttributes> = {
      title, firstName, lastName, gender, bloodGroup,
      age: parseInt(age, 10),
      dob: dob ? new Date(dob) : null,
      email: email || null, phone, address: address || null,
      patientId: finalPatientId, status: 'Active'
    };

    const newPatient = await Patient.create(patientData as PatientAttributes);
    res.status(201).json({ success: true, message: 'Patient created successfully.', data: newPatient });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
      res.status(500).json({ success: false, message: 'Server error during patient creation.' });
    }
  }
};

export const getAllPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;

  try {
    const { search = '', page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { patientId: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status && typeof status === 'string' && ['Active', 'Closed'].includes(status)) {
        whereConditions.status = status;
    }

    const { count, rows } = await Patient.findAndCountAll({
      where: whereConditions,
      limit: Number(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json({
      success: true, data: rows, totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page), totalPatients: count,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching patients.' });
  }
};

export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;
  try {
    const patientId = req.params.id;
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found.' });
      return;
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching patient details.' });
  }
};

export const updatePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;
  try {
    const id = req.params.id;
    const patient = await Patient.findByPk(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found for update.' });
      return;
    }
    const { dobDay, dobMonth, dobYear, ...updateData } = req.body;
    if (dobYear && dobMonth && dobDay) {
        const monthStr = dobMonth.toString().padStart(2, '0');
        const dayStr = dobDay.toString().padStart(2, '0');
        if (parseInt(dobYear, 10) > 1900 && parseInt(monthStr, 10) >= 1 && parseInt(monthStr, 10) <= 12 && parseInt(dayStr, 10) >= 1 && parseInt(dayStr, 10) <= 31) {
            updateData.dob = `${dobYear}-${monthStr}-${dayStr}`;
        } else {
            console.warn('Invalid date components received for DOB update:', { dobYear, dobMonth, dobDay });
        }
    } else if (Object.keys(req.body).some(key => ['dobDay', 'dobMonth', 'dobYear'].includes(key) && !req.body[key])) {
      updateData.dob = null;
    }
    if (updateData.age !== undefined) updateData.age = parseInt(updateData.age, 10);

    await patient.update(updateData);
    res.status(200).json({ success: true, message: 'Patient updated successfully.', data: patient });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
      res.status(500).json({ success: false, message: 'Server error during patient update.' });
    }
  }
};

export const deletePatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;
  try {
    const id = req.params.id;
    const patient = await Patient.findByPk(id);
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found for deletion.' });
      return;
    }
    await patient.destroy();
    res.status(200).json({ success: true, message: 'Patient deleted successfully.' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ success: false, message: 'Server error during patient deletion.' });
  }
};

export const exportAllPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Patient = req.tenantModels.Patient;
  try {
    const patients = await Patient.findAll({
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Patients');
    worksheet.columns = [
      { header: 'Patient ID', key: 'patientId', width: 15 },
      { header: 'Title', key: 'title', width: 10 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Blood Group', key: 'bloodGroup', width: 12 },
      { header: 'Age', key: 'age', width: 8 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Registered On', key: 'createdAt', width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };
    patients.forEach(patientInstance => {
      const patient = patientInstance.get({ plain: true });
      worksheet.addRow({ 
        patientId: patient.patientId || 'N/A', title: patient.title, firstName: patient.firstName, lastName: patient.lastName,
        gender: patient.gender, bloodGroup: patient.bloodGroup, age: patient.age,
        dob: patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A',
        email: patient.email || 'N/A', phone: patient.phone, address: patient.address || 'N/A',
        status: patient.status, createdAt: patient.createdAt ? new Date(patient.createdAt).toLocaleString() : 'N/A',
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="patients_export_${timestamp}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting patients to Excel:', error);
    res.status(500).json({ success: false, message: 'Server error while exporting patients.' });
  }
};
