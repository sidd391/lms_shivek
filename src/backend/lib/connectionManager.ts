
import { Sequelize } from 'sequelize';
import { createSequelizeConnection, type DbConfig } from '../config/database';
import { initModels as initializeTenantModels, type TenantModels } from '../models';
import type { LabCredentialAttributes } from '../models/LabCredential';
import { staffRoles } from '../models/User'; // For seeding

const tenantConnections = new Map<string, Sequelize>();
// const tenantModelsCache = new Map<string, TenantModels>(); // REMOVED: Models will be re-initialized per request on a (potentially cached) connection
const initializedTenants = new Set<string>(); // NEW: Track tenants that have been synced/seeded in this server session

async function getTenantSequelizeInstance(labCode: string, dbConfig: DbConfig): Promise<Sequelize> {
  console.log(`[CM][getTenantSequelizeInstance] Called for labCode: "${labCode}". Target DB: ${dbConfig.dbName}@${dbConfig.dbHost}`);
  if (tenantConnections.has(labCode)) {
    const existingConnection = tenantConnections.get(labCode)!;
    console.log(`[CM][getTenantSequelizeInstance] Found existing Sequelize instance in cache for tenant: "${labCode}". Verifying...`);
    if (existingConnection.getDatabaseName() !== dbConfig.dbName) {
      console.warn(`[CM][getTenantSequelizeInstance] STALE CONNECTION DB MISMATCH for tenant "${labCode}". Cached connection DB: "${existingConnection.getDatabaseName()}", Expected DB: "${dbConfig.dbName}". Closing and creating new.`);
      await existingConnection.close().catch(closeErr => console.error(`[CM][getTenantSequelizeInstance] Error closing stale connection for "${labCode}" (DB mismatch):`, closeErr));
      tenantConnections.delete(labCode); // Remove from connections cache
      initializedTenants.delete(labCode); // Also remove from initialized set if connection was bad
    } else {
      try {
        await existingConnection.authenticate();
        console.log(`[CM][getTenantSequelizeInstance] Reusing existing active Sequelize instance for tenant: "${labCode}" (DB: ${existingConnection.getDatabaseName()})`);
        return existingConnection;
      } catch (error) {
        console.warn(`[CM][getTenantSequelizeInstance] Existing connection for tenant "${labCode}" (DB: ${existingConnection.getDatabaseName()}) failed authentication. Closing and creating new one. Error:`, error);
        await existingConnection.close().catch(closeErr => console.error(`[CM][getTenantSequelizeInstance] Error closing stale connection for "${labCode}" (auth failure):`, closeErr));
        tenantConnections.delete(labCode);
        initializedTenants.delete(labCode); // Also remove from initialized set
      }
    }
  }

  console.log(`[CM][getTenantSequelizeInstance] Creating NEW Sequelize instance (DB Pool) for tenant: "${labCode}" targeting DB: ${dbConfig.dbName} on host: ${dbConfig.dbHost}`);
  const sequelizeInstance = createSequelizeConnection(dbConfig);
  try {
    await sequelizeInstance.authenticate();
    console.log(`[CM][getTenantSequelizeInstance] New Sequelize instance (DB Pool) AUTHENTICATED for tenant: "${labCode}" (DB: ${sequelizeInstance.getDatabaseName()})`);
    tenantConnections.set(labCode, sequelizeInstance);
    return sequelizeInstance;
  } catch (authError) {
    console.error(`[CM][getTenantSequelizeInstance] CRITICAL: Failed to authenticate new Sequelize instance for tenant "${labCode}":`, authError);
    throw new Error(`Failed to connect to database for tenant ${labCode}.`);
  }
}

async function seedAdminForTenant(tenantModels: TenantModels, labCode: string): Promise<void> {
  const adminEmail = 'admin@quantumhook.dev';
  const plainPassword = 'password123';

  console.log(`[CM][SeedAdmin][${labCode}] Checking/Seeding admin for tenant: ${labCode}...`);
  try {
    if (!tenantModels.User) {
      console.error(`[CM][SeedAdmin][${labCode}] CRITICAL ERROR: User model is not available for tenant: ${labCode}.`);
      throw new Error(`User model not available for tenant ${labCode}`);
    }
    const existingAdmin = await tenantModels.User.scope('withPassword').findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      console.log(`[CM][SeedAdmin][${labCode}] Admin user ${adminEmail} not found in tenant ${labCode}. Attempting to create...`);
      const adminData = {
        email: adminEmail, passwordHash: plainPassword, title: 'Mr.' as const,
        firstName: 'Admin', lastName: 'User', role: 'Admin' as typeof staffRoles[number], status: 'Active' as 'Active' | 'Inactive',
      };
      console.log(`[CM][SeedAdmin][${labCode}] Data for new admin:`, JSON.stringify(adminData));
      let createdAdmin;
      try {
        createdAdmin = await tenantModels.User.create(adminData);
        console.log(`[CM][SeedAdmin][${labCode}] User.create call completed. Resulting admin object:`, createdAdmin ? `Exists with ID ${createdAdmin.id}` : 'null/undefined');
      } catch (creationError) {
        console.error(`[CM][SeedAdmin][${labCode}] FAILED to create admin user ${adminEmail}. Error:`, creationError);
        throw creationError;
      }
      if (!createdAdmin || typeof createdAdmin.id === 'undefined') {
        console.error(`[CM][SeedAdmin][${labCode}] FAILED to retrieve ID for admin user ${adminEmail}. User.create returned:`, createdAdmin);
        throw new Error(`Failed to create or retrieve ID for admin user ${adminEmail} in tenant ${labCode}`);
      }
      console.log(`[CM][SeedAdmin][${labCode}] Default admin user ${adminEmail} CREATED successfully. ID: ${createdAdmin.id}`);
    } else {
      console.log(`[CM][SeedAdmin][${labCode}] Admin user ${adminEmail} already exists in tenant ${labCode}. Ensuring role and status.`);
      // ... (existing logic for ensuring role/status) ...
    }
    const adminRoleName: typeof staffRoles[number] = 'Admin';
    console.log(`[CM][SeedAdmin][${labCode}] Checking/Seeding admin permissions for role ${adminRoleName} in tenant ${labCode}...`);
    if (!tenantModels.StaffRolePermission) {
        console.error(`[CM][SeedAdmin][${labCode}] CRITICAL ERROR: StaffRolePermission model is not available for tenant ${labCode}.`);
        throw new Error(`StaffRolePermission model not available for tenant ${labCode}`);
    }
    const allPerms = [
        "dashboard.view", "patients.view", "patients.create", "patients.edit", "patients.delete",
        "bills.view", "bills.create", "bills.edit", "bills.delete", "reports.view", "reports.generate",
        "doctors.view", "doctors.create", "doctors.edit", "doctors.delete", "tests.view.categories",
        "tests.manage.categories", "tests.view.tests", "tests.manage.tests", "testpackages.view",
        "testpackages.create", "testpackages.edit", "testpackages.delete", "staff.view", "staff.create",
        "staff.edit", "staff.manage.roles", "settings.access"
    ];
    const currentAdminPermissionsCount = await tenantModels.StaffRolePermission.count({ where: { roleName: adminRoleName }});
    if (currentAdminPermissionsCount < allPerms.length) {
        console.log(`[CM][SeedAdmin][${labCode}] Admin permissions for tenant ${labCode} are incomplete. Re-seeding...`);
        await tenantModels.StaffRolePermission.destroy({ where: { roleName: adminRoleName }});
        const adminPermMappings = allPerms.map(p => ({ roleName: adminRoleName, permissionId: p }));
        await tenantModels.StaffRolePermission.bulkCreate(adminPermMappings);
        console.log(`[CM][SeedAdmin][${labCode}] Admin role permissions re-seeded successfully for tenant ${labCode}.`);
    } else {
        console.log(`[CM][SeedAdmin][${labCode}] Admin role permissions appear complete for tenant ${labCode}.`);
    }
    console.log(`[CM][SeedAdmin][${labCode}] Seeding process completed successfully for tenant ${labCode}.`);
  } catch (seedError: any) {
    console.error(`[CM][SeedAdmin][${labCode}] CRITICAL ERROR during seeding process for tenant ${labCode}:`, seedError.message, seedError.stack);
    throw new Error(`Failed to seed admin user or permissions for tenant ${labCode}. Original error: ${(seedError as Error).message}`);
  }
}

export async function getTenantModels(labCredential: LabCredentialAttributes): Promise<TenantModels> {
  const { labCode, dbHost, dbName, dbUser, dbPass } = labCredential;
  console.log(`[CM][getTenantModels] Called for labCode: "${labCode}". Target DB: ${dbName}@${dbHost}`);

  const dbConfig: DbConfig = { dbHost, dbName, dbUser, dbPassword: dbPass, dbDialect: 'mysql' };
  let sequelizeInstance: Sequelize;

  try {
    sequelizeInstance = await getTenantSequelizeInstance(labCode, dbConfig); // Gets from cache or creates new connection
  } catch (connError) {
    console.error(`[CM][getTenantModels] Failed to establish Sequelize instance for tenant "${labCode}". Error:`, connError);
    throw connError;
  }

  console.log(`[CM][getTenantModels] Initializing application models for tenant: "${labCode}" on database: "${dbName}" (using sequelize instance for DB: ${sequelizeInstance.getDatabaseName()})`);
  // ALWAYS re-initialize models on the (potentially cached) sequelizeInstance to ensure correct binding
  const models = initializeTenantModels(sequelizeInstance);

  // Check if this tenant's schema has been synced and admin seeded in this server session
  if (!initializedTenants.has(labCode)) {
    console.log(`[CM][getTenantModels] Tenant "${labCode}" (DB: ${dbName}) not yet fully initialized in this session. Proceeding with SYNC & SEED.`);
    try {
      console.log(`[CM][getTenantModels] Attempting to SYNC SCHEMA for tenant: "${labCode}" on database: "${dbName}"`);
      await sequelizeInstance.sync({ alter: true });
      console.log(`[CM][getTenantModels] SUCCESS: Schema synced for tenant: "${labCode}" on database: "${dbName}"`);

      console.log(`[CM][getTenantModels] Attempting to SEED ADMIN USER & PERMISSIONS for tenant: "${labCode}"`);
      await seedAdminForTenant(models, labCode);
      initializedTenants.add(labCode); // Mark as initialized for this session
      console.log(`[CM][getTenantModels] SUCCESS: Tenant "${labCode}" fully initialized (synced & seeded).`);
    } catch (error: any) {
      console.error(`[CM][getTenantModels] CRITICAL ERROR during sync or seed for tenant "${labCode}" on database "${dbName}":`, error.message, error.stack);
      // If sync or seed fails, we should probably not consider the tenant initialized
      // and maybe even close/remove the connection from cache to force a full retry next time.
      if (tenantConnections.has(labCode)) {
        const conn = tenantConnections.get(labCode)!;
        await conn.close().catch(e => console.error(`[CM][getTenantModels] Error closing connection for "${labCode}" after setup failure:`, e));
        tenantConnections.delete(labCode);
        console.log(`[CM][getTenantModels] Closed and cleared connection for tenant "${labCode}" due to setup error.`);
      }
      initializedTenants.delete(labCode); // Ensure it's not marked as initialized if it failed
      throw new Error(`Failed to initialize database for tenant ${labCode}. Original error: ${(error as Error).message}`);
    }
  } else {
    console.log(`[CM][getTenantModels] Tenant "${labCode}" (DB: ${dbName}) already initialized in this session. Skipping sync & seed.`);
  }

  console.log(`[CM][getTenantModels] Models RE-INITIALIZED and context prepared for tenant: "${labCode}" (DB: ${models.sequelize.getDatabaseName()})`);
  return models;
}

export async function closeAllTenantConnections(): Promise<void> {
  console.log('[CM][closeAllTenantConnections] Attempting to close all tenant connections...');
  for (const [labCode, sequelizeInstance] of tenantConnections.entries()) {
    try {
        await sequelizeInstance.close();
        console.log(`[CM][closeAllTenantConnections] Closed connection for tenant: ${labCode}`);
    } catch (error) {
        console.error(`[CM][closeAllTenantConnections] Error closing connection for tenant ${labCode}:`, error);
    }
  }
  tenantConnections.clear();
  initializedTenants.clear(); // Clear this on server shutdown too
  console.log('[CM][closeAllTenantConnections] All tenant connections processed for closure. Set of initialized tenants cleared.');
}
