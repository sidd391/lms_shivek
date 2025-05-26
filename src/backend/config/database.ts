
import { Sequelize, type Dialect } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Ensure .env is loaded from project root

export interface DbConfig {
  dbName?: string;
  dbUser?: string;
  dbHost?: string;
  dbPassword?: string;
  dbDialect?: Dialect;
}

// Function to get default DB config from .env
export const getDefaultDbConfig = (): DbConfig => {
  const dbName = process.env.DB_NAME as string;
  const dbUser = process.env.DB_USER as string;
  const dbHost = process.env.DB_HOST;
  const dbPassword = process.env.DB_PASS;
  const dbDialect = process.env.DB_DIALECT as Dialect;

  if (!dbName || !dbUser || !dbHost || dbPassword === undefined || !dbDialect) {
    console.warn('Default database configuration is missing some parts in .env file. This might be okay if all tenants provide full credentials.');
    return {}; // Return empty or minimal config if parts are missing
  }
  return { dbName, dbUser, dbHost, dbPassword, dbDialect };
};

// Function to create a Sequelize connection based on provided config
export const createSequelizeConnection = (config: DbConfig): Sequelize => {
  const { dbName, dbUser, dbHost, dbPassword, dbDialect } = config;

  if (!dbName || !dbUser || !dbHost || dbPassword === undefined || !dbDialect) {
    throw new Error('Database configuration is missing required fields (dbName, dbUser, dbHost, dbPassword, dbDialect) for creating a connection.');
  }

  return new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: dbDialect,
    logging: (msg: string) => console.log(`[TenantDB: ${dbName}] ${msg}`), // Differentiated logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
};

// For any global/default operations if still needed, or as a fallback for the first tenant.
// However, direct usage of this global `sequelize` instance for tenant data is being phased out.
const defaultGlobalSequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT as Dialect,
    logging: false, // Main app default logging
  }
);

export default defaultGlobalSequelize; // This default export might become less relevant.
