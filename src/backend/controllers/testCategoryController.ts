
import type { Response } from 'express';
import type { TestCategoryAttributes } from '../models/TestCategory';
import { Op } from 'sequelize';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createTestCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const TestCategory = req.tenantModels.TestCategory;
  try {
    const { name, description, icon, imageSeed } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'Category name is required.' }); return; }
    const categoryData: Partial<TestCategoryAttributes> = {
      name, description: description || null, icon: icon || null,
      imageSeed: imageSeed || name.toLowerCase().replace(/\s+/g, '-'),
    };
    const newCategory = await TestCategory.create(categoryData as TestCategoryAttributes);
    res.status(201).json({ success: true, message: 'Test category created successfully.', data: newCategory });
  } catch (error: any) { 
    console.error('Error creating test category:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test category creation.' }); }
  }
};

export const getAllTestCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestCategory, Test, sequelize } = req.tenantModels;
  try {
    const { search = '' } = req.query;
    const whereConditions: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions[Op.or] = [ { name: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }, ];
    }
    const categoriesData = await TestCategory.findAll({
      attributes: [
        'id', 'name', 'description', 'icon', 'imageSeed', 'createdAt', 'updatedAt',
        [sequelize.fn('COUNT', sequelize.col('tests.id')), 'testCount']
      ],
      include: [{ model: Test, as: 'tests', attributes: [] }],
      where: whereConditions,
      group: ['TestCategory.id', 'TestCategory.name', 'TestCategory.description', 'TestCategory.icon', 'TestCategory.imageSeed', 'TestCategory.createdAt', 'TestCategory.updatedAt'],
      order: [['name', 'ASC']], raw: true,
    });
    const categoriesWithCount = categoriesData.map((cat: any) => ({
      ...cat, testCount: parseInt(cat.testCount as string, 10) || 0,
    }));
    res.status(200).json({ success: true, data: categoriesWithCount });
  } catch (error) { 
    console.error('Error fetching test categories:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching test categories.' });
  }
};

export const getTestCategoryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const { TestCategory, Test, sequelize } = req.tenantModels;
  try {
    const categoryId = req.params.id;
    const category = await TestCategory.findByPk(categoryId, {
      attributes: [
        'id', 'name', 'description', 'icon', 'imageSeed', 'createdAt', 'updatedAt',
        [sequelize.fn('COUNT', sequelize.col('tests.id')), 'testCount']
      ],
      include: [{ model: Test, as: 'tests', attributes: [] }],
      group: ['TestCategory.id', 'TestCategory.name', 'TestCategory.description', 'TestCategory.icon', 'TestCategory.imageSeed', 'TestCategory.createdAt', 'TestCategory.updatedAt'],
    });
    if (!category) { res.status(404).json({ success: false, message: 'Test category not found.' }); return; }
    const plainCategory = category.get({ plain: true }) as any;
    const categoryWithCount = { ...plainCategory, testCount: parseInt(plainCategory.testCount as string, 10) || 0 };
    res.status(200).json({ success: true, data: categoryWithCount });
  } catch (error) { 
    console.error('Error fetching test category by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching test category details.' });
  }
};

export const updateTestCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const TestCategory = req.tenantModels.TestCategory;
  try {
    const id = req.params.id;
    const category = await TestCategory.findByPk(id);
    if (!category) { res.status(404).json({ success: false, message: 'Test category not found for update.' }); return; }
    const { name, description, icon, imageSeed } = req.body;
    const updateData: Partial<TestCategoryAttributes> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (imageSeed !== undefined) updateData.imageSeed = imageSeed;
    await category.update(updateData);
    res.status(200).json({ success: true, message: 'Test category updated successfully.', data: category });
  } catch (error: any) { 
    console.error('Error updating test category:', error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map((e: any) => e.message);
      res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else { res.status(500).json({ success: false, message: 'Server error during test category update.' }); }
  }
};

export const deleteTestCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) { res.status(500).json({ success: false, message: "Tenant context not available." }); return; }
  const TestCategory = req.tenantModels.TestCategory;
  try {
    const id = req.params.id;
    const category = await TestCategory.findByPk(id);
    if (!category) { res.status(404).json({ success: false, message: 'Test category not found for deletion.' }); return; }
    await category.destroy();
    res.status(200).json({ success: true, message: 'Test category deleted successfully.' });
  } catch (error) { 
    console.error('Error deleting test category:', error);
    res.status(500).json({ success: false, message: 'Server error during test category deletion.' });
  }
};
