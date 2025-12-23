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
  // 窗口设置
  window: {
    // 窗口宽度百分比（相对于屏幕宽度）
    widthPercent: number;
    // 窗口高度百分比（相对于屏幕高度）
    heightPercent: number;
    // 最小宽度百分比
    minWidthPercent: number;
    // 最小高度百分比
    minHeightPercent: number;
  };
}

/**
 * 默认设置
 */
const defaultSettings: AppSettings = {
  basic: {
    showDeleteConfirmation: true,
  },
  window: {
    widthPercent: 90,
    heightPercent: 85,
    minWidthPercent: 60,
    minHeightPercent: 50,
  },
};

/**
 * 设置 Store 接口
 */
interface SettingsStore {
  settings: AppSettings;
  
  // 更新基本设置
  updateBasicSettings: (settings: Partial<AppSettings['basic']>) => void;
  
  // 更新窗口设置
  updateWindowSettings: (settings: Partial<AppSettings['window']>) => void;
  
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

      updateBasicSettings: (basicSettings: any) => {
        set((state: any) => ({
          settings: {
            ...state.settings,
            basic: {
              ...state.settings.basic,
              ...basicSettings,
            },
          },
        }));
      },

      updateWindowSettings: (windowSettings: any) => {
        set((state: any) => ({
          settings: {
            ...state.settings,
            window: {
              ...state.settings.window,
              ...windowSettings,
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

      importSettings: (json: string) => {
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
            window: {
              ...defaultSettings.window,
              ...(importedSettings.window || {}),
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
      version: 2, // 增加版本号，触发迁移
      partialize: (state) => ({
        // 只持久化 settings 字段
        settings: state.settings,
      }),
      migrate: (persistedState: any, version: number) => {
        // 迁移函数：确保 window 字段存在
        if (version < 2) {
          return {
            ...persistedState,
            state: {
              ...persistedState?.state,
              settings: {
                ...defaultSettings,
                ...(persistedState?.state?.settings || {}),
                basic: {
                  ...defaultSettings.basic,
                  ...(persistedState?.state?.settings?.basic || {}),
                },
                window: {
                  ...defaultSettings.window,
                  ...(persistedState?.state?.settings?.window || {}),
                },
              },
            },
          };
        }
        return persistedState;
      },
      merge: (persistedState: any, currentState: any) => {
        // 合并函数：确保所有字段都存在
        // persistedState 可能是 { state: {...}, version: ... } 格式，也可能是直接的 state
        let persistedSettings = null;
        if (persistedState?.state) {
          // Zustand persist 格式：{ state: {...}, version: ... }
          persistedSettings = persistedState.state.settings;
        } else if (persistedState?.settings) {
          // 直接是 state 格式
          persistedSettings = persistedState.settings;
        }
        
        if (persistedSettings) {
          return {
            ...currentState,
            settings: {
              ...defaultSettings,
              ...persistedSettings,
              basic: {
                ...defaultSettings.basic,
                ...(persistedSettings.basic || {}),
              },
              window: {
                ...defaultSettings.window,
                ...(persistedSettings.window || {}),
              },
            },
          };
        }
        return currentState;
      },
    }
  )
);

