import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 应用设置接口
 */
export interface AppSettings {
  // 基本设置
  basic: {
    // 文件删除时是否显示确认提示
    showDeleteConfirmation: boolean;
  };
}

/**
 * 默认设置
 */
const defaultSettings: AppSettings = {
  basic: {
    showDeleteConfirmation: true,
  },
};

/**
 * 设置 Store 接口
 */
interface SettingsStore {
  settings: AppSettings;
  
  // 更新基本设置
  updateBasicSettings: (settings: Partial<AppSettings['basic']>) => void;
  
  // 重置所有设置为默认值
  resetSettings: () => void;
  
  // 导出设置（返回 JSON 字符串）
  exportSettings: () => string;
  
  // 导入设置（从 JSON 字符串）
  importSettings: (json: string) => boolean;
}

/**
 * 设置 Store
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateBasicSettings: (basicSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            basic: {
              ...state.settings.basic,
              ...basicSettings,
            },
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      exportSettings: () => {
        const { settings } = get();
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (json) => {
        try {
          const importedSettings = JSON.parse(json) as AppSettings;
          
          // 验证导入的设置结构
          if (!importedSettings || typeof importedSettings !== 'object') {
            return false;
          }
          
          // 合并导入的设置与默认设置，确保所有字段都存在
          const mergedSettings: AppSettings = {
            basic: {
              ...defaultSettings.basic,
              ...(importedSettings.basic || {}),
            },
          };
          
          set({ settings: mergedSettings });
          return true;
        } catch (error) {
          console.error('Failed to import settings:', error);
          return false;
        }
      },
    }),
    {
      name: 'app-settings-storage',
      version: 1,
    }
  )
);

