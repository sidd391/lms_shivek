
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';

import registrySequelize from './config/registryDatabase';
import LabCredential from './models/LabCredential';
import { getDefaultDbConfig } from './config/database';
import { closeAllTenantConnections } from './lib/connectionManager';

import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import testCategoryRoutes from './routes/testCategoryRoutes';
import { testRoutes as topLevelTestRoutes } from './routes/testRoutes';
import testPackageRoutes from './routes/testPackageRoutes';
import staffRoutes from './routes/staffRoutes';
import rolePermissionRoutes from './routes/rolePermissionRoutes';
import billRoutes from './routes/billRoutes';
import reportRoutes from './routes/reportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import settingRoutes from './routes/settingRoutes';

const app = express();
const port = process.env.BACKEND_PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.trim() === "") {
  console.error("FATAL ERROR: JWT_SECRET is not set or is empty in .env file.");
  process.exit(1);
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-production-frontend-url.com' : 'http://localhost:9002',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/test-categories', testCategoryRoutes);
app.use('/api/tests', topLevelTestRoutes);
app.use('/api/test-packages', testPackageRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);

app.get('/', (req, res) => {
  res.send('QuantumHook LMS Backend is running with JWT Auth and Multi-Tenancy Support!');
});

const startServer = async () => {
  try {
    console.log('[Server] Attempting to connect to Lab Code Registry Database...');
    await registrySequelize.authenticate();
    console.log('[Server] Lab Code Registry Database connection established successfully.');
    
    // Ensure LabCredential model/table exists in the registry
    if (LabCredential && typeof LabCredential.sync === 'function') {
        await LabCredential.sync({ alter: true });
        console.log('[Server] LabCredential model synchronized with the registry database.');
    } else {
        console.error("[Server] CRITICAL: LabCredential model not available for sync.");
        process.exit(1); // Critical if model isn't there
    }
    
    // Ensure the default QUANTUM001 entry exists in lab_credentials if it doesn't already.
    // The actual DB for QUANTUM001 will be set up on first login for that lab code.
    const defaultTenantLabCode = 'QUANTUM001';
    const defaultTenantDbConfig = getDefaultDbConfig();

    if (LabCredential && typeof LabCredential.findByPk === 'function' && typeof LabCredential.create === 'function') {
        let exampleLabCredential = await LabCredential.findByPk(defaultTenantLabCode);

        if (!exampleLabCredential) {
            if (defaultTenantDbConfig.dbName && defaultTenantDbConfig.dbHost && defaultTenantDbConfig.dbUser && defaultTenantDbConfig.dbPassword !== undefined) {
                exampleLabCredential = await LabCredential.create({
                    labCode: defaultTenantLabCode,
                    dbHost: defaultTenantDbConfig.dbHost,
                    dbName: defaultTenantDbConfig.dbName,
                    dbUser: defaultTenantDbConfig.dbUser,
                    dbPass: defaultTenantDbConfig.dbPassword,
                });
                console.log(`[Server] Seeded default LabCredential for ${defaultTenantLabCode} into the registry.`);
            } else {
                console.warn(`[Server] Default DB config from .env is incomplete. Cannot seed ${defaultTenantLabCode} into registry.`);
            }
        } else {
            console.log(`[Server] Lab credential for ${defaultTenantLabCode} already exists in the registry.`);
        }
    } else {
        console.error("[Server] CRITICAL: LabCredential model not available for QUANTUM001 check/seed or does not have expected methods.");
    }

    console.log(`[Server] Registry setup complete. Tenant databases will be initialized on-demand for ALL tenants, including QUANTUM001, upon their first login or API request requiring DB access.`);

    app.listen(port, () => {
      console.log(`[Server] Backend server is listening on port ${port}`);
    });
  } catch (error) {
    console.error('[Server] CRITICAL: Unable to connect to the database(s) or start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM signal received: closing connections.');
  await closeAllTenantConnections();
  await registrySequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT signal received: closing connections.');
  await closeAllTenantConnections();
  await registrySequelize.close();
  process.exit(0);
});
