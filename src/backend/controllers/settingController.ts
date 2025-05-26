
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

const LAB_NAME_KEY = 'LAB_NAME';
const LAB_ADDRESS_KEY = 'LAB_ADDRESS';
const DEFAULT_LAB_NAME = 'QuantumHook Diagnostics';
const DEFAULT_LAB_ADDRESS = '123 Lab Lane, Science City, ST 54321\nPhone: (555) 123-4567 | Email: contact@quantumhook.dev';

export const getSetting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Setting = req.tenantModels.Setting;
  const { settingKey } = req.params;

  try {
    const setting = await Setting.findByPk(settingKey);
    if (setting) {
      res.status(200).json({ success: true, data: { key: setting.key, value: setting.value } });
    } else {
      if (settingKey === LAB_NAME_KEY) {
        res.status(200).json({ success: true, data: { key: LAB_NAME_KEY, value: DEFAULT_LAB_NAME }, message: 'Default lab name returned.' });
      } else if (settingKey === LAB_ADDRESS_KEY) {
        res.status(200).json({ success: true, data: { key: LAB_ADDRESS_KEY, value: DEFAULT_LAB_ADDRESS }, message: 'Default lab address returned.' });
      } else {
        res.status(404).json({ success: false, message: `Setting with key "${settingKey}" not found.` });
      }
    }
  } catch (error) {
    console.error(`Error fetching setting ${settingKey}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching setting.' });
  }
};

export const updateSetting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.tenantModels) {
    res.status(500).json({ success: false, message: "Tenant context not available." });
    return;
  }
  const Setting = req.tenantModels.Setting;
  const { settingKey } = req.params;
  const { value } = req.body;

  if (value === undefined || value === null) {
    res.status(400).json({ success: false, message: 'Setting value is required.' });
    return;
  }

  try {
    const [setting, created] = await Setting.findOrCreate({
      where: { key: settingKey },
      defaults: { key: settingKey, value: String(value) },
    });

    if (!created) {
      setting.value = String(value);
      await setting.save();
    }
    res.status(200).json({ success: true, message: `Setting "${settingKey}" updated successfully.`, data: { key: setting.key, value: setting.value } });
  } catch (error: any) {
    console.error(`Error updating setting ${settingKey}:`, error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map((e: any) => e.message);
        res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    } else {
        res.status(500).json({ success: false, message: 'Server error while updating setting.' });
    }
  }
};
