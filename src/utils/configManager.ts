/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 根目录路径 */
  rootPath: string;
  /** 产品前缀配置 */
  productPrefixes: {
    ST: string;  // Studio
    CD: string;  // Commercial Design
  };
  /** 标准子文件夹列表 */
  standardFolders: string[];
  /** 主题 */
  theme: 'light' | 'dark';
  /** 上次选择的分类 */
  lastCategory: string;
  /** 视图模式 */
  viewMode: 'list' | 'grid';
  /** 窗口配置 */
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  rootPath: '',
  productPrefixes: {
    ST: 'ST',
    CD: 'CD'
  },
  standardFolders: [
    '01_Ref_Images',
    '02_Ai_Raw',
    '03_AI_Handle',
    '04_Final_Goods_Images'
  ],
  theme: 'dark',
  lastCategory: '01_In_Progress',
  viewMode: 'list',
  window: {
    width: 1400,
    height: 900
  }
};

/**
 * 配置文件名
 */
const CONFIG_FILE_NAME = 'super-tools-config.json';

/**
 * 读取配置
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    // 获取应用数据目录
    const appPath = await window.electronAPI.getAppPath();
    const configPath = `${appPath}/${CONFIG_FILE_NAME}`;

    // 检查配置文件是否存在
    const existsResult = await window.electronAPI.checkFileExists(configPath);
    
    if (!existsResult.success || !existsResult.exists) {
      // 配置文件不存在，返回默认配置
      return { ...DEFAULT_CONFIG };
    }

    // 读取配置文件
    const readResult = await window.electronAPI.readFile(configPath);
    
    if (!readResult.success || !readResult.data) {
      console.warn('读取配置文件失败，使用默认配置');
      return { ...DEFAULT_CONFIG };
    }

    // 解析配置
    const config = JSON.parse(readResult.data) as AppConfig;
    
    // 合并默认配置（确保新增字段有默认值）
    return {
      ...DEFAULT_CONFIG,
      ...config,
      productPrefixes: {
        ...DEFAULT_CONFIG.productPrefixes,
        ...config.productPrefixes
      },
      window: {
        ...DEFAULT_CONFIG.window,
        ...config.window
      }
    };
  } catch (error) {
    console.error('加载配置失败:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: AppConfig): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 获取应用数据目录
    const appPath = await window.electronAPI.getAppPath();
    const configPath = `${appPath}/${CONFIG_FILE_NAME}`;

    // 序列化配置
    const configJson = JSON.stringify(config, null, 2);

    // 写入配置文件
    const writeResult = await window.electronAPI.writeFile(configPath, configJson);

    if (!writeResult.success) {
      throw new Error(writeResult.error || '写入配置文件失败');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 更新配置（部分更新）
 */
export async function updateConfig(
  updates: Partial<AppConfig>
): Promise<{
  success: boolean;
  config?: AppConfig;
  error?: string;
}> {
  try {
    // 读取当前配置
    const currentConfig = await loadConfig();

    // 合并更新
    const newConfig: AppConfig = {
      ...currentConfig,
      ...updates,
      productPrefixes: {
        ...currentConfig.productPrefixes,
        ...(updates.productPrefixes || {})
      },
      window: {
        ...currentConfig.window,
        ...(updates.window || {})
      }
    };

    // 保存配置
    const saveResult = await saveConfig(newConfig);

    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    return {
      success: true,
      config: newConfig
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 重置配置为默认值
 */
export async function resetConfig(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await saveConfig({ ...DEFAULT_CONFIG });
    return result;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 导出配置
 */
export async function exportConfig(
  targetPath: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const config = await loadConfig();
    const configJson = JSON.stringify(config, null, 2);

    const writeResult = await window.electronAPI.writeFile(targetPath, configJson);

    if (!writeResult.success) {
      throw new Error(writeResult.error || '导出配置失败');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 导入配置
 */
export async function importConfig(
  sourcePath: string
): Promise<{
  success: boolean;
  config?: AppConfig;
  error?: string;
}> {
  try {
    // 读取配置文件
    const readResult = await window.electronAPI.readFile(sourcePath);

    if (!readResult.success || !readResult.data) {
      throw new Error(readResult.error || '读取配置文件失败');
    }

    // 解析配置
    const config = JSON.parse(readResult.data) as AppConfig;

    // 验证配置
    if (!config.rootPath || !config.theme) {
      throw new Error('配置文件格式不正确');
    }

    // 保存配置
    const saveResult = await saveConfig(config);

    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    return {
      success: true,
      config
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: Partial<AppConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证根目录路径
  if (config.rootPath !== undefined) {
    if (typeof config.rootPath !== 'string') {
      errors.push('根目录路径必须是字符串');
    }
  }

  // 验证主题
  if (config.theme !== undefined) {
    if (config.theme !== 'light' && config.theme !== 'dark') {
      errors.push('主题必须是 light 或 dark');
    }
  }

  // 验证视图模式
  if (config.viewMode !== undefined) {
    if (config.viewMode !== 'list' && config.viewMode !== 'grid') {
      errors.push('视图模式必须是 list 或 grid');
    }
  }

  // 验证标准文件夹
  if (config.standardFolders !== undefined) {
    if (!Array.isArray(config.standardFolders)) {
      errors.push('标准文件夹必须是数组');
    } else if (config.standardFolders.length === 0) {
      errors.push('至少需要一个标准文件夹');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

