
import type { Response } from 'express';
import type { TestAttributes } from '../models/Test';
import type { TestParameterAttributes }from '../models/TestParameter';
import { Op } from 'sequelize';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, TestCategory, TestParameter, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const { categoryId } = req.params;
    const { name, shortCode, price, turnAroundTime, sampleType, methodology, normalRange, description, parameters } = req.body;

    if (!name || !shortCode || price === undefined || !turnAroundTime || !sampleType) {
        await t.rollback(); res.status(400).json({ success: false, message: 'Missing required test information (name, shortCode, price, TAT, sampleType).' }); return;
    }

    const existingTestByName = await Test.findOne({ where: { name }, transaction: t });
    if (existingTestByName) {
      await t.rollback();
      res.status(409).json({ success: false, message: `A test with the name "${name}" already exists.` });
      return;
    }

    const numericCategoryId = parseInt(categoryId, 10);
    if (isNaN(numericCategoryId)) {
        await t.rollback(); res.status(400).json({ success: false, message: `Invalid category ID format: ${categoryId}. Must be a number.` }); return;
    }
    const category = await TestCategory.findByPk(numericCategoryId, { transaction: t });
    if (!category) {
        await t.rollback(); res.status(404).json({ success: false, message: `Category with ID ${numericCategoryId} not found.` }); return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
        await t.rollback(); res.status(400).json({ success: false, message: 'Invalid price format or value.' }); return;
    }
    const testData: Partial<TestAttributes> = {
      name, shortCode, price: parsedPrice, turnAroundTime, sampleType, methodology: methodology || null,
      normalRange: normalRange || null, description: description || null, categoryId: numericCategoryId,
    };
    const newTest = await Test.create(testData as TestAttributes, { transaction: t });
    if (parameters && Array.isArray(parameters) && parameters.length > 0) {
      const parametersToCreate = parameters.map((param: any, index: number) => {
        const isGroup = param.fieldType === 'Group';
        const isTextEditor = param.fieldType === 'Text Editor';
        const isNumericUnbounded = param.fieldType === 'Numeric Unbounded';
        const isFormula = param.fieldType === 'Formula';

        return {
            ...param, id: undefined, testId: newTest.id,
            parentId: param.parentId || null,
            order: param.order !== undefined ? param.order : index + 1,
            rangeLow: (isGroup || isTextEditor || isNumericUnbounded || isFormula || param.fieldType === 'Text' || param.fieldType === 'Option List') ? null : (param.rangeLow !== undefined && param.rangeLow !== null && param.rangeLow !== '' ? parseFloat(param.rangeLow) : null),
            rangeHigh: (isGroup || isTextEditor || isNumericUnbounded || isFormula || param.fieldType === 'Text' || param.fieldType === 'Option List') ? null : (param.rangeHigh !== undefined && param.rangeHigh !== null && param.rangeHigh !== '' ? parseFloat(param.rangeHigh) : null),
            isFormula: isFormula,
            options: (param.fieldType === 'Option List' && Array.isArray(param.options) ? JSON.stringify(param.options) : (typeof param.options === 'string' ? param.options : null)),
            formulaString: isFormula ? param.formulaString : null,
            units: (isGroup || isTextEditor ) ? null : param.units, // Numeric Unbounded can have units
            rangeText: (isGroup || isTextEditor || (isFormula && !param.rangeText) || (param.fieldType === 'Numeric' && !param.rangeText) ) ? null : param.rangeText, // Numeric Unbounded uses this
            testMethod: (isGroup || isTextEditor || isFormula) ? null : param.testMethod,
        };
      });
      await TestParameter.bulkCreate(parametersToCreate as TestParameterAttributes[], { transaction: t, validate: true });
    }
    await t.commit();
    const createdTestWithParams = await Test.findByPk(newTest.id, {
        include: [{ model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']]}]
    });
    res.status(201).json({ success: true, message: 'Test created successfully.', data: createdTestWithParams });
  } catch (error: any) {
    await t.rollback(); console.error('Error creating test:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
      res.status(400).json({ success: false, message: 'Validation Error or Constraint Violation', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test creation.' }); }
  }
};

export const getTestsByCategoryId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, TestCategory } = req.tenantModels;
  try {
    const { categoryId } = req.params; const { search = '' } = req.query;
    const numericCategoryId = parseInt(categoryId, 10);
    if (isNaN(numericCategoryId)) { res.status(400).json({ success: false, message: `Invalid category ID format: ${categoryId}. Must be a number.` }); return; }
    const category = await TestCategory.findByPk(numericCategoryId);
    if (!category) { res.status(404).json({ success: false, message: `Category with ID ${numericCategoryId} not found.` }); return; }
    const whereConditions: any = { categoryId: numericCategoryId };
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions[Op.or] = [ { name: { [Op.like]: `%${search}%` } }, { shortCode: { [Op.like]: `%${search}%` } }, ];
    }
    const tests = await Test.findAll({ where: whereConditions, order: [['name', 'ASC']] });
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching tests by category ID:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching tests.' });
  }
};

export const getAllTests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, TestParameter } = req.tenantModels;
  try {
    const { search = '' } = req.query; const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions[Op.or] = [ { name: { [Op.like]: `%${search}%` } }, { shortCode: { [Op.like]: `%${search}%` } }, ];
    }
    const tests = await Test.findAll({
      where: whereConditions, order: [['name', 'ASC']],
      include: [{ model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']] }]
    });
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching all tests:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching all tests.' });
  }
};

export const getTestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, TestParameter, TestCategory } = req.tenantModels;
  try {
    const { testId } = req.params; const numericTestId = parseInt(testId, 10);
    if(isNaN(numericTestId)){ res.status(400).json({ success: false, message: 'Invalid test ID format.' }); return; }
    const testInstance = await Test.findByPk(numericTestId, {
        include: [
            { model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']] },
            { model: TestCategory, as: 'category', attributes: ['name'] }
        ]
    });
    if (!testInstance) { res.status(404).json({ success: false, message: 'Test not found.' }); return; }

    const plainTestAttributes = testInstance.get({ plain: true }) as TestAttributes & { category?: { name: string }, parameters?: TestParameterAttributes[] };
    let processedParameters: TestParameterAttributes[] | undefined;

    if (plainTestAttributes.parameters && plainTestAttributes.parameters.length > 0) {
        processedParameters = plainTestAttributes.parameters.map(param => {
            const modifiedPlainParam = { ...param } as TestParameterAttributes;
            if (typeof modifiedPlainParam.options === 'string' && modifiedPlainParam.fieldType === 'Option List') {
                try {
                    const parsedOptions = JSON.parse(modifiedPlainParam.options);
                    if (Array.isArray(parsedOptions) && parsedOptions.every((opt: any) => typeof opt === 'string')) {
                        modifiedPlainParam.options = parsedOptions as any;
                    } else {
                        // If not an array of strings, might be newline separated or just a string
                        // For form display as newline separated, keep as string
                    }
                } catch (e) {
                    // If JSON.parse fails, assume it's a newline separated string or single string for Text Editor
                    // No change needed for options if it's meant to be HTML or newline
                }
            } else if (modifiedPlainParam.fieldType !== 'Text Editor' && modifiedPlainParam.fieldType !== 'Option List') {
                 modifiedPlainParam.options = null;
            }
            return modifiedPlainParam;
        });
    }
    res.status(200).json({ success: true, data: { ...plainTestAttributes, parameters: processedParameters } });
  } catch (error) {
    console.error('Error fetching test by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching test.' });
  }
};

export const updateTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, TestCategory, TestParameter, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const { testId } = req.params; const numericTestId = parseInt(testId, 10);
    if(isNaN(numericTestId)){ await t.rollback(); res.status(400).json({ success: false, message: 'Invalid test ID format for update.' }); return; }

    const test = await Test.findByPk(numericTestId, { transaction: t });
    if (!test) { await t.rollback(); res.status(404).json({ success: false, message: 'Test not found for update.' }); return; }

    const { parameters, ...testUpdateData } = req.body;

    if (testUpdateData.name && testUpdateData.name !== test.name) {
      const conflictingTest = await Test.findOne({
        where: {
          name: testUpdateData.name,
          id: { [Op.ne]: numericTestId }
        },
        transaction: t
      });
      if (conflictingTest) {
        await t.rollback();
        res.status(409).json({ success: false, message: `A test with the name "${testUpdateData.name}" already exists.` });
        return;
      }
    }

    if (testUpdateData.price !== undefined) {
        const parsedPrice = parseFloat(testUpdateData.price);
        if (isNaN(parsedPrice) || parsedPrice < 0) { await t.rollback(); res.status(400).json({ success: false, message: 'Invalid price format or value for update.' }); return; }
        testUpdateData.price = parsedPrice;
    }
    if (testUpdateData.categoryId !== undefined && testUpdateData.categoryId !== test.categoryId) {
        const numericNewCategoryId = parseInt(testUpdateData.categoryId, 10);
        if(isNaN(numericNewCategoryId)){ await t.rollback(); res.status(400).json({ success: false, message: 'Invalid new category ID format.' }); return; }
        const categoryExists = await TestCategory.findByPk(numericNewCategoryId, { transaction: t });
        if(!categoryExists){ await t.rollback(); res.status(400).json({ success: false, message: `New category with ID ${numericNewCategoryId} does not exist.` }); return; }
        testUpdateData.categoryId = numericNewCategoryId;
    }
    await test.update(testUpdateData, { transaction: t });

    if (parameters && Array.isArray(parameters)) {
        await TestParameter.destroy({ where: { testId: numericTestId }, transaction: t });
        if (parameters.length > 0) {
            const parametersToCreate = parameters.map((param: any, index: number) => {
              const isGroup = param.fieldType === 'Group';
              const isTextEditor = param.fieldType === 'Text Editor';
              const isNumericUnbounded = param.fieldType === 'Numeric Unbounded';
              const isFormula = param.fieldType === 'Formula';

              return {
                ...param, id: undefined, testId: numericTestId,
                parentId: null, // Forcing parentId to null during re-creation to avoid stale ID issues with bulk op
                order: param.order !== undefined ? param.order : index + 1,
                rangeLow: (isGroup || isTextEditor || isNumericUnbounded || isFormula || param.fieldType === 'Text' || param.fieldType === 'Option List') ? null : (param.rangeLow !== undefined && param.rangeLow !== null && param.rangeLow !== '' ? parseFloat(param.rangeLow) : null),
                rangeHigh: (isGroup || isTextEditor || isNumericUnbounded || isFormula || param.fieldType === 'Text' || param.fieldType === 'Option List') ? null : (param.rangeHigh !== undefined && param.rangeHigh !== null && param.rangeHigh !== '' ? parseFloat(param.rangeHigh) : null),
                isFormula: isFormula,
                options: (param.fieldType === 'Option List' && Array.isArray(param.options) ? JSON.stringify(param.options) : (typeof param.options === 'string' ? param.options : null)),
                formulaString: isFormula ? param.formulaString : null,
                units: (isGroup || isTextEditor ) ? null : param.units,
                rangeText: (isGroup || isTextEditor || (isFormula && !param.rangeText) || (param.fieldType === 'Numeric' && !param.rangeText) ) ? null : param.rangeText,
                testMethod: (isGroup || isTextEditor || isFormula) ? null : param.testMethod,
              };
            });
            await TestParameter.bulkCreate(parametersToCreate as TestParameterAttributes[], { transaction: t, validate: true });
        }
    }
    await t.commit();
    const updatedTestWithParams = await Test.findByPk(numericTestId, {
         include: [{ model: TestParameter, as: 'parameters', order: [['parentId', 'ASC NULLS FIRST'], ['order', 'ASC'], ['id', 'ASC']] }]
    });
    res.status(200).json({ success: true, message: 'Test updated successfully.', data: updatedTestWithParams });
  } catch (error: any) {
    await t.rollback(); console.error('Error updating test:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError' || error.name === 'SequelizeUniqueConstraintError') {
        const messages = error.errors ? error.errors.map((e: any) => e.message) : [error.message];
        res.status(400).json({ success: false, message: 'Validation Error or Constraint Violation', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test update.' }); }
  }
};

export const deleteTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { Test, sequelize } = req.tenantModels;
  const t = await sequelize.transaction();
  try {
    const { testId } = req.params; const numericTestId = parseInt(testId, 10);
    if(isNaN(numericTestId)){ await t.rollback(); res.status(400).json({ success: false, message: 'Invalid test ID format for deletion.' }); return; }
    const test = await Test.findByPk(numericTestId, { transaction: t });
    if (!test) { await t.rollback(); res.status(404).json({ success: false, message: 'Test not found for deletion.' }); return; }
    await test.destroy({ transaction: t }); await t.commit();
    res.status(200).json({ success: true, message: 'Test and its parameters deleted successfully.' });
  } catch (error) {
    await t.rollback(); console.error('Error deleting test:', error);
    res.status(500).json({ success: false, message: 'Server error during test deletion.' });
  }
};
