
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import LabCredential from '../models/LabCredential'; // For fetching tenant DB details
import { getTenantModels } from '../lib/connectionManager'; // For getting tenant models
import type { TenantModels } from '../models'; // Type for tenant models object

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; name: string; labCode: string };
  tenantModels?: TenantModels;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`[Protect] Middleware called for: ${req.method} ${req.originalUrl}`);
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('[Protect] Token found, attempting to verify...');

      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
        console.error('CRITICAL: JWT_SECRET is undefined or empty within protect middleware!');
        res.status(500).json({ success: false, message: 'Server configuration error: JWT secret missing.' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number; email: string; name: string; labCode: string; iat: number; exp: number };
      console.log('[Protect] Token verified. Decoded payload:', JSON.stringify(decoded));

      if (typeof decoded.id === 'undefined' || typeof decoded.email === 'undefined' || typeof decoded.name === 'undefined' || typeof decoded.labCode === 'undefined') {
        console.error('[Protect] CRITICAL: Decoded token is missing id, email, name, or labCode. Payload:', JSON.stringify(decoded));
        res.status(401).json({ success: false, message: 'Token payload invalid.' });
        return;
      }

      console.log(`[Protect] Fetching LabCredential for labCode: "${decoded.labCode}" from token.`);
      const labCredential = await LabCredential.findOne({ where: { labCode: decoded.labCode } });
      if (!labCredential) {
        console.error(`[Protect] LabCredential not found for labCode: ${decoded.labCode} from token.`);
        res.status(401).json({ success: false, message: 'Invalid lab context in token.' });
        return;
      }
      console.log(`[Protect] LabCredential found for labCode: "${decoded.labCode}". DB Name: ${labCredential.dbName}`);
      
      const tenantModels = await getTenantModels(labCredential);
      if (!tenantModels) { 
        console.error(`[Protect] Failed to get tenant models for labCode: ${decoded.labCode}. getTenantModels returned null/undefined.`);
        res.status(500).json({ success: false, message: 'Server error: Could not establish tenant context.' });
        return;
      }
      console.log(`[Protect] Tenant models obtained for labCode: "${decoded.labCode}". DB Name from tenantModels: ${tenantModels.sequelize.getDatabaseName()}`);

      req.user = { id: decoded.id, email: decoded.email, name: decoded.name, labCode: decoded.labCode };
      req.tenantModels = tenantModels;
      
      console.log(`[Protect] User and tenantModels set for labCode: ${req.user?.labCode ?? 'UNKNOWN_LABCODE'}. DB from req.tenantModels: ${req.tenantModels?.sequelize?.getDatabaseName() ?? 'UNKNOWN_DB'}. Calling next().`);
      next();
    } catch (error) {
      let errorMessage = 'Not authorized, token failed';
      if (error instanceof Error) {
        console.error(`[Protect] Token verification/tenant setup failed: ${error.name} - ${error.message}`, error.stack);
        if (error.name === 'TokenExpiredError') errorMessage = 'Not authorized, token expired';
        else if (error.name === 'JsonWebTokenError') errorMessage = `Not authorized, token malformed (${error.message})`;
        else if (error.message.startsWith('Failed to initialize database for tenant') || error.message.startsWith('Database configuration is missing required fields') || error.message.startsWith('Failed to connect to database for tenant')) {
             errorMessage = `Tenant database issue for lab code ${ (token ? (jwt.decode(token) as any)?.labCode : 'unknown')}. Please contact support.`;
             res.status(503).json({ success: false, message: errorMessage }); // Service Unavailable
             return;
        }
      } else {
        console.error('[Protect] Token verification/tenant setup failed with an unknown error type:', error);
      }
      res.status(401).json({ success: false, message: errorMessage });
    }
  } else {
    console.log('[Protect] No token found in Authorization header.');
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};
    
