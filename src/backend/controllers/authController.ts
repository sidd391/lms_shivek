
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import LabCredential from '../models/LabCredential';
import { getTenantModels } from '../lib/connectionManager';
import type { UserAttributes } from '../models/User'; // Keep for attribute type
import type { TenantModels } from '../models'; // For req.tenantModels type

const generateToken = (idInput: number, emailInput: string, nameInput: string, labCode: string) => {
  const payload = { id: idInput, email: emailInput, name: nameInput, labCode };
  console.log(`[AuthCtrl] Generating token with payload: ${JSON.stringify(payload)} for labCode: ${labCode}`);
  if (!process.env.JWT_SECRET) {
    console.error("CRITICAL: JWT_SECRET is not defined in environment variables!");
    throw new Error("JWT_SECRET_NOT_DEFINED");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

export const validateLabCode = async (req: Request, res: Response): Promise<void> => {
  const { labCode } = req.body;
  console.log(`[AuthCtrl] Validating labCode: ${labCode}`);

  if (!labCode) {
    res.status(400).json({ success: false, message: 'Lab code is required.' });
    return;
  }
  try {
    const labCredential = await LabCredential.findOne({ where: { labCode } });
    if (labCredential) {
      console.log(`[AuthCtrl] Lab code "${labCode}" is valid.`);
      console.log(`[AuthCtrl] Note: Tenant DB setup (sync, admin seed) for "${labCode}" will occur on first login attempt for this lab.`);
      res.status(200).json({ success: true, message: 'Lab code is valid.' });
    } else {
      console.log(`[AuthCtrl] Lab code "${labCode}" is invalid.`);
      res.status(404).json({ success: false, message: 'Invalid lab code.' });
    }
  } catch (error) {
    console.error('[AuthCtrl] Error validating lab code:', error);
    res.status(500).json({ success: false, message: 'Server error during lab code validation.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, labCode } = req.body;
  console.log(`[AuthCtrl][LoginAttempt] Received login request. Email: ${email}, Lab Code: ${labCode}`);

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }
  if (!labCode) {
    console.log(`[AuthCtrl][LoginAttempt] Lab code missing in login request for email: ${email}`);
    res.status(400).json({ success: false, message: 'Lab code is required for login.' });
    return;
  }

  try {
    console.log(`[AuthCtrl][LoginAttempt] Fetching LabCredential for labCode: "${labCode}" from registry.`);
    const labCredential = await LabCredential.findOne({ where: { labCode } });
    if (!labCredential) {
      console.log(`[AuthCtrl][LoginAttempt] Login failed: Lab code "${labCode}" not found in registry.`);
      res.status(401).json({ success: false, message: 'Invalid lab code.' });
      return;
    }
    console.log(`[AuthCtrl][LoginAttempt] Found LabCredential for labCode "${labCode}": Target DB Host: ${labCredential.dbHost}, Target DB Name: ${labCredential.dbName}`);

    console.log(`[AuthCtrl][LoginAttempt] Attempting to get tenant models for labCode: "${labCode}" using fetched credentials.`);
    const tenantModels = await getTenantModels(labCredential); // Get tenant-specific models
    const User = tenantModels.User; // Use the tenant-specific User model
    console.log(`[AuthCtrl][LoginAttempt] Tenant models obtained for labCode: "${labCode}". User model is for DB: ${tenantModels.sequelize.getDatabaseName()}`);

    console.log(`[AuthCtrl][LoginAttempt] Attempting to find user: "${email}" in tenant DB: "${tenantModels.sequelize.getDatabaseName()}" for labCode: "${labCode}"`);
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      console.log(`[AuthCtrl][LoginAttempt] Login failed: User not found for email ${email} in tenant DB "${tenantModels.sequelize.getDatabaseName()}" for labCode: "${labCode}".`);
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    console.log(`[AuthCtrl][LoginAttempt] User "${email}" found in tenant DB "${tenantModels.sequelize.getDatabaseName()}" for labCode: "${labCode}". User ID: ${user.id}`);
    
    const storedHash = user.getDataValue('passwordHash');
    if (!storedHash) {
        console.error(`[AuthCtrl][LoginAttempt] Login error: User ${email} password data is missing in database for tenant ${labCode}.`);
        res.status(500).json({ success: false, message: 'User password data is missing.' });
        return;
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      console.log(`[AuthCtrl][LoginAttempt] Login failed: Password mismatch for email ${email} in tenant DB "${tenantModels.sequelize.getDatabaseName()}" for labCode: "${labCode}"`);
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }
    
    const userId = user.id; 
    const userEmail = user.email; 
    const userName = user.fullName;

    if (typeof userId === 'undefined' || typeof userEmail === 'undefined' || !userName || userName.trim() === '') {
        console.error(`[AuthCtrl][LoginAttempt] CRITICAL: User ID ("${userId}"), Email ("${userEmail}"), or FullName ("${userName}") is undefined or empty before token generation for tenant ${labCode}.`);
        res.status(500).json({ success: false, message: 'Internal server error preparing user data for session.' });
        return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user.get({ plain: true }) as UserAttributes & { fullName: string };

    const token = generateToken(userId, userEmail, userName, labCode); // Pass the current labCode
    console.log(`[AuthCtrl][LoginAttempt] Login successful for ${email} in tenant ${labCode}. Token generated.`);

    res.status(200).json({ 
      success: true, 
      message: 'Login successful.', 
      token,
      user: { ...userWithoutPassword, fullName: userName } 
    });

  } catch (error) {
    console.error(`[AuthCtrl][LoginAttempt] Login error for labCode ${labCode}, email ${email}:`, error);
    if (error instanceof Error && error.message === "JWT_SECRET_NOT_DEFINED") {
        res.status(500).json({ success: false, message: 'Server configuration error: JWT secret missing.' });
    } else if (error instanceof Error && error.message.startsWith('Failed to initialize database for tenant')) {
        res.status(503).json({ success: false, message: `Service temporarily unavailable setting up lab ${labCode}. Please try again later.` });
    } else {
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }
};

export const logout = (req: Request, res: Response): void => {
  console.log('[AuthCtrl] Logout endpoint called.');
  res.status(200).json({ success: true, message: 'Logout acknowledged. Please clear token on client-side.' });
};

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; name: string; labCode: string };
  tenantModels?: TenantModels; 
}

export const getAuthStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AuthCtrl] getAuthStatus controller called.');
  if (!req.tenantModels) {
    console.error("[AuthCtrl] Tenant context not available in getAuthStatus.");
    res.status(500).json({ success: false, message: "Server error: Tenant context missing." });
    return;
  }
  if (req.user) {
    console.log(`[AuthCtrl] User from token: ID: ${req.user.id}, Email: ${req.user.email}, Name: ${req.user.name}, LabCode: ${req.user.labCode}`);
    try {
      const tokenUser = req.user;
      const User = req.tenantModels.User;
      
      const freshUser = await User.findByPk(tokenUser.id);

      if (freshUser) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...userWithoutPassword } = freshUser.get({ plain: true }) as UserAttributes;
        const responseUser = { ...userWithoutPassword, fullName: freshUser.fullName }; // Use fullName
        console.log(`[AuthCtrl] Fresh user data found for ${tokenUser.email} in tenant ${tokenUser.labCode}, sending user data.`);
        res.status(200).json({ success: true, user: responseUser });
      } else {
        console.log(`[AuthCtrl] User with ID ${tokenUser.id} from token not found in tenant DB for ${tokenUser.labCode}.`);
        res.status(401).json({ success: false, message: 'User from token not found.' });
      }
    } catch (error) {
      console.error('[AuthCtrl] Error fetching user status:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching user status.' });
    }
  } else {
    console.log('[AuthCtrl] getAuthStatus called, but req.user is not populated.');
    res.status(401).json({ success: false, message: 'Not authenticated (user data missing).' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || typeof req.user.id === 'undefined' || !req.tenantModels) {
    res.status(401).json({ success: false, message: 'Not authenticated or tenant context missing.' });
    return;
  }

  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const User = req.tenantModels.User;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    return;
  }

  try {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const isMatch = await user.validPassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Incorrect current password.' });
      return;
    }
    user.passwordHash = newPassword; 
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('[AuthCtrl] Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error while changing password.' });
  }
};
