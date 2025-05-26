
import type { Response } from 'express';
import type { DoctorAttributes } from '../models/Doctor';
import { Op } from 'sequelize';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

const generateDoctorId = async (DoctorModel: any): Promise<string> => {
  const prefix = 'DOC';
  let isUnique = false;
  let newId = '';
  let attempts = 0;
  const maxAttempts = 10;
  while (!isUnique && attempts < maxAttempts) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000).toString();
    newId = `${prefix}${randomNumber}`;
    const existingDoctor = await DoctorModel.findOne({ where: { doctorID: newId } });
    if (!existingDoctor) isUnique = true;
    attempts++;
  }
  if (!isUnique) {
    console.error('Failed to generate a unique doctor ID after multiple attempts.');
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }
  return newId;
};

export const createDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const Doctor = req.tenantModels.Doctor;
  try {
    const {
      title, firstName, lastName, gender, specialty, qualification,
      experienceYears, email, phone, address, consultationFee,
      doctorID: providedDoctorID,
    } = req.body;

    if (!title || !firstName || !lastName || !gender || !specialty || !phone) {
      res.status(400).json({ success: false, message: 'Missing required doctor information.' });
      return;
    }
    let finalDoctorID = providedDoctorID;
    if (!finalDoctorID || finalDoctorID.trim() === '') {
      finalDoctorID = await generateDoctorId(Doctor);
    } else {
      const existing = await Doctor.findOne({ where: { doctorID: finalDoctorID } });
      if (existing) {
        res.status(409).json({ success: false, message: `Doctor ID ${finalDoctorID} already exists.` });
        return;
      }
    }
    const doctorData: Partial<DoctorAttributes> = {
      title, firstName, lastName, gender, specialty,
      qualification: qualification || null,
      experienceYears: experienceYears !== undefined ? parseInt(experienceYears, 10) : null,
      consultationFee: consultationFee !== undefined ? parseFloat(consultationFee) : null,
      email: email || null, phone, address: address || null,
      doctorID: finalDoctorID, status: 'Active'
    };
    const newDoctor = await Doctor.create(doctorData as DoctorAttributes);
    res.status(201).json({ success: true, message: 'Doctor created successfully.', data: newDoctor });
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
      res.status(500).json({ success: false, message: 'Server error during doctor creation.' });
    }
  }
};

export const getAllDoctors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const Doctor = req.tenantModels.Doctor;
  try {
    const { search = '', page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }, { phone: { [Op.like]: `%${search}%` } },
        { specialty: { [Op.like]: `%${search}%` } }, { doctorID: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status && typeof status === 'string' && ['Active', 'On Leave', 'Inactive'].includes(status)) {
        whereConditions.status = status;
    }
    const { count, rows } = await Doctor.findAndCountAll({
      where: whereConditions, limit: Number(limit), offset: offset, order: [['createdAt', 'DESC']],
    });
    res.status(200).json({
      success: true, data: rows, totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page), totalDoctors: count,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching doctors.' });
  }
};

export const getDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const Doctor = req.tenantModels.Doctor;
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) { res.status(404).json({ success: false, message: 'Doctor not found.' }); return; }
    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctor details.' });
  }
};

export const updateDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const Doctor = req.tenantModels.Doctor;
  try {
    const id = req.params.id;
    const doctor = await Doctor.findByPk(id);
    if (!doctor) { res.status(404).json({ success: false, message: 'Doctor not found for update.' }); return; }
    const updateData = req.body;
    if (updateData.experienceYears !== undefined) {
      updateData.experienceYears = updateData.experienceYears === '' ? null : parseInt(updateData.experienceYears, 10);
    }
    if (updateData.consultationFee !== undefined) {
      updateData.consultationFee = updateData.consultationFee === '' ? null : parseFloat(updateData.consultationFee);
    }
    await doctor.update(updateData);
    res.status(200).json({ success: true, message: 'Doctor updated successfully.', data: doctor });
  } catch (error: any) {
    console.error('Error updating doctor:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
      res.status(500).json({ success: false, message: 'Server error during doctor update.' });
    }
  }
};

export const deleteDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const Doctor = req.tenantModels.Doctor;
  try {
    const id = req.params.id;
    const doctor = await Doctor.findByPk(id);
    if (!doctor) { res.status(404).json({ success: false, message: 'Doctor not found for deletion.' }); return; }
    await doctor.destroy();
    res.status(200).json({ success: true, message: 'Doctor deleted successfully.' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: 'Server error during doctor deletion.' });
  }
};
