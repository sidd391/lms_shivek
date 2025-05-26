
import { Sequelize } from 'sequelize'; // Import Sequelize type
import { User } from './User';
import { Patient } from './Patient';
import { Doctor } from './Doctor';
import { TestCategory } from './TestCategory';
import { Test } from './Test';
import { TestPackage } from './TestPackage';
import { TestPackageTest } from './TestPackageTest';
import { StaffRolePermission } from './StaffRolePermission';
import { TestParameter } from './TestParameter';
import { Bill } from './Bill';
import { BillItem } from './BillItem';
import { Report } from './Report';
import { ReportItem } from './ReportItem';
import { ReportParameterResult } from './ReportParameterResult';
import { Setting } from './Setting';

// Define a type for the collection of initialized models for a tenant
export interface TenantModels {
  sequelize: Sequelize;
  User: typeof User;
  Patient: typeof Patient;
  Doctor: typeof Doctor;
  TestCategory: typeof TestCategory;
  Test: typeof Test;
  TestPackage: typeof TestPackage;
  TestPackageTest: typeof TestPackageTest;
  StaffRolePermission: typeof StaffRolePermission;
  TestParameter: typeof TestParameter;
  Bill: typeof Bill;
  BillItem: typeof BillItem;
  Report: typeof Report;
  ReportItem: typeof ReportItem;
  ReportParameterResult: typeof ReportParameterResult;
  Setting: typeof Setting;
  // Add other models here
}

export function initModels(sequelizeInstance: Sequelize): TenantModels {
  const models: Partial<TenantModels> = {};

  models.sequelize = sequelizeInstance;

  // Initialize each model with the provided Sequelize instance
  models.User = User.initModel(sequelizeInstance);
  models.Patient = Patient.initModel(sequelizeInstance);
  models.Doctor = Doctor.initModel(sequelizeInstance);
  models.TestCategory = TestCategory.initModel(sequelizeInstance);
  models.Test = Test.initModel(sequelizeInstance);
  models.TestParameter = TestParameter.initModel(sequelizeInstance);
  models.TestPackage = TestPackage.initModel(sequelizeInstance);
  models.TestPackageTest = TestPackageTest.initModel(sequelizeInstance);
  models.StaffRolePermission = StaffRolePermission.initModel(sequelizeInstance);
  models.Bill = Bill.initModel(sequelizeInstance);
  models.BillItem = BillItem.initModel(sequelizeInstance);
  models.Report = Report.initModel(sequelizeInstance);
  models.ReportItem = ReportItem.initModel(sequelizeInstance);
  models.ReportParameterResult = ReportParameterResult.initModel(sequelizeInstance);
  models.Setting = Setting.initModel(sequelizeInstance);

  // Define associations after all models are initialized
  // Pass the `models` object (which will be fully populated TenantModels) to associate methods
  const fullModels = models as TenantModels; // Cast to full type for association calls

  // Call associate methods if they exist
  Object.values(fullModels).forEach((model: any) => {
    if (model && typeof model.associate === 'function') {
      model.associate(fullModels);
    }
  });

  return fullModels;
}

// The global `db` object is no longer exported as the primary way to access models
// for tenant-specific operations. This ensures controllers use the request-scoped tenant models.
// If there were truly global models (not tenant-specific), they could be handled differently,
// but all application models are being treated as tenant-specific.
