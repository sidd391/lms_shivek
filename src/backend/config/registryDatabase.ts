
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Assuming the .env file is at the project root, two levels up from src/backend/config
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configuration for the Lab Code Registry Database
// User explicitly stated: database name "lab_code", host "localhost", user "root", password "root"
const REGISTRY_DB_NAME = 'lab_code'; // As per user's request
const REGISTRY_DB_USER = 'root';     // As per user's request
const REGISTRY_DB_HOST = 'localhost';// As per user's request
const REGISTRY_DB_PASS = 'root';     // As per user's request
const REGISTRY_DB_DIALECT = 'mysql'; // Assuming MySQL, consistent with the main DB

if (!REGISTRY_DB_NAME || !REGISTRY_DB_USER || !REGISTRY_DB_HOST || REGISTRY_DB_PASS === undefined || !REGISTRY_DB_DIALECT) {
  console.error('Registry Database configuration details are hardcoded but one seems missing. This should not happen.');
  throw new Error('Hardcoded Registry Database configuration is incomplete.');
}

const registrySequelize = new Sequelize(REGISTRY_DB_NAME, REGISTRY_DB_USER, REGISTRY_DB_PASS, {
  host: REGISTRY_DB_HOST,
  dialect: REGISTRY_DB_DIALECT,
  logging: (msg: string) => console.log(`[RegistryDB LOG]: ${msg}`), // Differentiated logging
  pool: { 
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default registrySequelize;
