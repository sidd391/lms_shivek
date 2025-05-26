
import type { Response } from 'express';
import type { UserAttributes, StaffRole } from '../models/User';
import { staffRoles } from '../models/User';
import { Op } from 'sequelize';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const { title, firstName, lastName, email, phone, role, password } = req.body;

    if (!firstName || !lastName || !email || !role || !password) {
      res.status(400).json({ success: false, message: 'Missing required staff information (firstName, lastName, email, role, password).' });
      return;
    }
    if (!staffRoles.includes(role as StaffRole)) {
        res.status(400).json({ success: false, message: `Invalid role: ${role}. Must be one of ${staffRoles.join(', ')}` });
        return;
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) { res.status(409).json({ success: false, message: 'Email address is already in use.' }); return; }

    const userData: Partial<UserAttributes> = {
      title: title || null, firstName, lastName, email, phone: phone || null,
      role: role as StaffRole, passwordHash: password, status: 'Active',
    };
    const newStaff = await User.create(userData as UserAttributes);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...staffWithoutPassword } = newStaff.get({ plain: true });
    res.status(201).json({ success: true, message: 'Staff member created successfully.', data: staffWithoutPassword });
  } catch (error: any) { 
    console.error('Error creating staff member:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during staff creation.' }); }
  }
};

export const getAllStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const { search = '', page = 1, limit = 10, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') { 
      whereConditions[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }, { phone: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role && typeof role === 'string' && staffRoles.includes(role as StaffRole)) whereConditions.role = role;
    if (status && typeof status === 'string' && ['Active', 'Inactive'].includes(status)) whereConditions.status = status;

    const { count, rows } = await User.findAndCountAll({
      where: whereConditions, limit: Number(limit), offset: offset, order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash', 'age'] }
    });
    const staffWithFullName = rows.map(user => { 
        const plainUser = user.get({ plain: true });
        return { ...plainUser, fullName: user.fullName };
    });
    res.status(200).json({
      success: true, data: staffWithFullName, totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page), totalStaff: count,
    });
  } catch (error) { 
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching staff.' });
  }
};

export const getStaffById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const staffId = req.params.id;
    const staff = await User.findByPk(staffId, { attributes: { exclude: ['passwordHash'] } });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff member not found.' }); return; }
    const plainStaff = staff.get({ plain: true });
    res.status(200).json({ success: true, data: { ...plainStaff, fullName: staff.fullName } });
  } catch (error) { 
    console.error('Error fetching staff member by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching staff details.' });
  }
};

export const updateStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const id = req.params.id;
    const staff = await User.scope('withPassword').findByPk(id);
    if (!staff) { res.status(404).json({ success: false, message: 'Staff member not found for update.' }); return; }
    const { title, firstName, lastName, email, phone, role, status, password } = req.body;
    const updateData: Partial<UserAttributes> = {};
    if (title !== undefined) updateData.title = title;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined && staffRoles.includes(role as StaffRole)) updateData.role = role as StaffRole;
    else if (role !== undefined) { res.status(400).json({ success: false, message: `Invalid role: ${role}.` }); return; }
    if (status !== undefined && ['Active', 'Inactive'].includes(status)) updateData.status = status;
    if (password) updateData.passwordHash = password;

    await staff.update(updateData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...staffWithoutPassword } = staff.get({ plain: true });
    res.status(200).json({ success: true, message: 'Staff member updated successfully.', data: { ...staffWithoutPassword, fullName: staff.fullName } });
  } catch (error: any) { 
    console.error('Error updating staff member:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during staff update.' }); }
  }
};

export const deactivateStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const id = req.params.id;
    const staff = await User.findByPk(id);
    if (!staff) { res.status(404).json({ success: false, message: 'Staff member not found.' }); return; }
    if (staff.email === 'admin@quantumhook.dev') { res.status(403).json({ success: false, message: 'Default admin user cannot be deactivated.' }); return; }
    staff.status = 'Inactive'; await staff.save();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...staffWithoutPassword } = staff.get({ plain: true });
    res.status(200).json({ success: true, message: 'Staff member deactivated successfully.', data: { ...staffWithoutPassword, fullName: staff.fullName } });
  } catch (error) { 
    console.error('Error deactivating staff member:', error);
    res.status(500).json({ success: false, message: 'Server error during staff deactivation.' });
  }
};

export const deleteStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const User = req.tenantModels.User;
  try {
    const id = req.params.id;
    const staff = await User.findByPk(id);
    if (!staff) { res.status(404).json({ success: false, message: 'Staff member not found for deletion.' }); return; }
    if (staff.email === 'admin@quantumhook.dev') { res.status(403).json({ success: false, message: 'Default admin user cannot be deleted.' }); return; }
    await staff.destroy();
    res.status(200).json({ success: true, message: 'Staff member deleted successfully.' });
  } catch (error) { 
    console.error('Error deleting staff member:', error);
    res.status(500).json({ success: false, message: 'Server error during staff deletion.' });
  }
};
