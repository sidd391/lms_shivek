
import type { Response } from 'express';
import { Op } from 'sequelize';
import type { TestPackageAttributes } from '../models/TestPackage';
import type Test from '../models/Test'; 
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createTestPackage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestPackage, Test: TestModel, TestPackageTest, sequelize } = req.tenantModels; 
  const t = await sequelize.transaction();
  try {
    const { name, packageCode, price, description, selectedTests, status, imageSeed } = req.body;
    if (!name || price === undefined) { 
        await t.rollback(); res.status(400).json({ success: false, message: 'Package name and price are required.' }); return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) { 
        await t.rollback(); res.status(400).json({ success: false, message: 'Invalid price format or value.' }); return;
    }
    const testDbIds: number[] = Array.isArray(selectedTests) ? selectedTests.filter(id => typeof id === 'number' && !isNaN(id)) : [];
    
    const packageData: Partial<TestPackageAttributes> = { 
      name, packageCode: packageCode || null, price: parsedPrice, description: description || null,
      status: status || 'Active', imageSeed: imageSeed || name.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
    };
    const newPackage = await TestPackage.create(packageData as TestPackageAttributes, { transaction: t });
    if (!newPackage || !newPackage.id) { 
      await t.rollback(); console.error('CRITICAL: newPackage is null or newPackage.id is null after creation.');
      res.status(500).json({ success: false, message: 'Failed to retrieve new package ID after creation.' }); return;
    }
    if (testDbIds && testDbIds.length > 0) {
      const existingTestInstances = await TestModel.findAll({ where: { id: { [Op.in]: testDbIds } }, attributes: ['id'], transaction: t });
      if (existingTestInstances.length !== testDbIds.length) { 
        await t.rollback(); const foundDbIdsFromQuery = existingTestInstances.map(eti => eti.id);
        const notFoundIds = testDbIds.filter(id => !foundDbIdsFromQuery.includes(id));
        res.status(400).json({ success: false, message: `Some tests for association not found. Invalid IDs: ${notFoundIds.join(', ')}` }); return;
      }
      const joinTableRecords = existingTestInstances.map(test => ({ testPackageId: newPackage.id, testId: test.id }));
      await TestPackageTest.bulkCreate(joinTableRecords, { transaction: t });
    }
    await t.commit();
    const createdPackageWithTests = await TestPackage.findByPk(newPackage.id, {
      include: [{ model: TestModel, as: 'tests', through: { attributes: [] } }] 
    });
    res.status(201).json({ success: true, message: 'Test package created successfully.', data: createdPackageWithTests });
  } catch (error: any) { 
    await t.rollback(); console.error('Error creating test package:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError' || error.name === 'AggregateError' || error.name === 'SequelizeBulkRecordError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error or Association Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test package creation.' }); }
  }
};

export const getAllTestPackages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestPackage, Test: TestModel } = req.tenantModels;
  try {
    const { search = '', page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') { 
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }, { packageCode: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status && typeof status === 'string' && ['Active', 'Archived'].includes(status)) whereConditions.status = status;
    const { count, rows } = await TestPackage.findAndCountAll({
      where: whereConditions, limit: Number(limit), offset: offset, order: [['name', 'ASC']],
      include: [{ model: TestModel, as: 'tests', attributes: ['id'], through: { attributes: [] } }],
    });
    const packagesWithTestCount = rows.map(pkg => { 
        const plainPackage = pkg.get({ plain: true }) as TestPackageAttributes & { tests?: Test[] };
        return { ...plainPackage, testCount: plainPackage.tests?.length || 0, tests: undefined };
    });
    res.status(200).json({ success: true, data: packagesWithTestCount, totalPages: Math.ceil(count / Number(limit)), currentPage: Number(page), totalPackages: count });
  } catch (error) { 
    console.error('Error fetching test packages:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching test packages.' });
  }
};

export const getTestPackageById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestPackage, Test: TestModel } = req.tenantModels;
  try {
    const packageId = req.params.id;
    const pkg = await TestPackage.findByPk(packageId, {
      include: [{ model: TestModel, as: 'tests', attributes: ['id', 'name', 'price'], through: { attributes: [] } }]
    });
    if (!pkg) { res.status(404).json({ success: false, message: 'Test package not found.' }); return; }
    res.status(200).json({ success: true, data: pkg });
  } catch (error) { 
    console.error('Error fetching test package by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching test package details.' });
  }
};

export const updateTestPackage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestPackage, Test: TestModel, TestPackageTest, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const pkg = await TestPackage.findByPk(id, { transaction: t });
    if (!pkg) { await t.rollback(); res.status(404).json({ success: false, message: 'Test package not found for update.' }); return; }
    if (!pkg.id) { await t.rollback(); res.status(500).json({ success: false, message: 'Package ID missing during update.' }); return; }
    const { name, packageCode, price, description, selectedTests, status, imageSeed } = req.body;
    const testDbIds: number[] | undefined = Array.isArray(selectedTests) ? selectedTests.filter(id => typeof id === 'number' && !isNaN(id)) : undefined; 
    const updateData: Partial<TestPackageAttributes> = {};
    if (name !== undefined) updateData.name = name;
    if (packageCode !== undefined) updateData.packageCode = packageCode;
    if (price !== undefined) { 
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid price format or value for update.' }); return; }
        updateData.price = parsedPrice;
    }
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (imageSeed !== undefined) updateData.imageSeed = imageSeed;
    await pkg.update(updateData, { transaction: t });

    if (testDbIds !== undefined) { 
      const existingTestInstances = await TestModel.findAll({ where: { id: { [Op.in]: testDbIds } }, attributes: ['id'], transaction: t });
      if (testDbIds.length > 0 && existingTestInstances.length !== testDbIds.length) { 
        await t.rollback(); const foundDbIdsFromQuery = existingTestInstances.map(eti => eti.id);
        const notFoundIds = testDbIds.filter(id => !foundDbIdsFromQuery.includes(id));
        res.status(400).json({ success: false, message: `Some tests for update not found. Invalid IDs: ${notFoundIds.join(', ')}` }); return;
      }
      const idsToSet = existingTestInstances.map(test => test.id);
      await TestPackageTest.destroy({ where: { testPackageId: pkg.id }, transaction: t });
      if (idsToSet.length > 0) {
        if (idsToSet.some(testId => testId === null || testId === undefined)) { 
            await t.rollback(); res.status(500).json({ success: false, message: 'Internal error: Invalid test IDs prepared for association update.'}); return;
        }
        const joinTableRecords = idsToSet.map(testId => ({ testPackageId: pkg.id!, testId: testId! }));
        await TestPackageTest.bulkCreate(joinTableRecords, { transaction: t });
      }
    }
    await t.commit();
    const updatedPackage = await TestPackage.findByPk(id, { include: [{ model: TestModel, as: 'tests', through: {attributes: []} }] });
    res.status(200).json({ success: true, message: 'Test package updated successfully.', data: updatedPackage });
  } catch (error: any) { 
    await t.rollback(); console.error('Error updating test package:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError' || error.name === 'AggregateError' || error.name === 'SequelizeBulkRecordError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error or Association Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test package update.' }); }
  }
};

export const deleteTestPackage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestPackage, TestPackageTest, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const pkg = await TestPackage.findByPk(id, { transaction: t });
    if (!pkg) { await t.rollback(); res.status(404).json({ success: false, message: 'Test package not found for deletion.' }); return; }
    await TestPackageTest.destroy({ where: { testPackageId: pkg.id }, transaction: t });
    await pkg.destroy({ transaction: t }); 
    await t.commit();
    res.status(200).json({ success: true, message: 'Test package deleted successfully.' });
  } catch (error) { 
    await t.rollback(); console.error('Error deleting test package:', error);
    res.status(500).json({ success: false, message: 'Server error during test package deletion.' });
  }
};
