/**
 * 路径工具函数（兼容渲染进程）
 */
const pathUtils = {
  basename: (filePath: string): string => {
    return filePath.split(/[\\/]/).pop() || '';
  },
  join: (...parts: string[]): string => {
    return parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
  },
  dirname: (filePath: string): string => {
    const parts = filePath.split(/[\\/]/);
    parts.pop();
    return parts.join('/');
  }
};

/**
 * 产品类型
 */
export type ProductType = 'ST' | 'CD';

/**
 * 标准子文件夹
 */
export const STANDARD_FOLDERS = [
  '01_Ref_Images',
  '02_Ai_Raw',
  '03_AI_Handle',
  '04_Final_Goods_Images'
];

/**
 * 产品创建选项
 */
export interface CreateProductOptions {
  /** 产品类型 */
  type: ProductType;
  /** 产品名称 */
  name: string;
  /** 目标分类 */
  category: string;
  /** 根目录路径 */
  rootPath: string;
  /** 是否创建标准子文件夹 */
  createSubFolders?: boolean;
}

/**
 * 产品信息
 */
export interface ProductInfo {
  /** 产品ID */
  id: string;
  /** 产品编号（如 ST001） */
  code: string;
  /** 产品类型 */
  type: ProductType;
  /** 产品名称 */
  name: string;
  /** 所属分类 */
  category: string;
  /** 产品路径 */
  path: string;
  /** 子文件夹路径 */
  subFolders: {
    ref_images: string;
    ai_raw: string;
    ai_handle: string;
    final_goods: string;
  };
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 生成产品编号
 * 格式: ST001, ST002, CD001, CD002
 */
export async function generateProductCode(
  type: ProductType,
  rootPath: string,
  category: string
): Promise<string> {
  try {
    const categoryPath = pathUtils.join(rootPath, category);
    
    // 列出分类文件夹下的所有文件夹
    const files = await window.electronAPI?.listFiles?.(categoryPath);
    
    if (!files) return `${type}001`;
    
    // 提取同类型产品的最大编号
    let maxNum = 0;
    const prefix = type;
    const regex = new RegExp(`^${prefix}(\\d+)_`, 'i');
    
    files.forEach((file: { name: string }) => {
      const match = file.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    // 生成新编号
    const newNum = maxNum + 1;
    return `${prefix}${newNum.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('生成产品编号失败:', error);
    return `${type}001`;
  }
}

/**
 * 创建产品
 */
export async function createProduct(
  options: CreateProductOptions
): Promise<{ success: boolean; product?: ProductInfo; error?: string }> {
  const { type, name, category, rootPath, createSubFolders = true } = options;

  try {
    // 生成产品编号
    const code = await generateProductCode(type, rootPath, category);
    
    // 构建产品路径
    const productFolderName = `${code}_${name}`;
    const productPath = pathUtils.join(rootPath, category, productFolderName);
    
    // 创建产品主文件夹
    const dirResult = await window.electronAPI?.createDirectory?.(productPath);
    if (!dirResult?.success) {
      throw new Error(`创建产品文件夹失败: ${dirResult?.error}`);
    }

    // 构建子文件夹路径
    const subFolders = {
      ref_images: pathUtils.join(productPath, STANDARD_FOLDERS[0]),
      ai_raw: pathUtils.join(productPath, STANDARD_FOLDERS[1]),
      ai_handle: pathUtils.join(productPath, STANDARD_FOLDERS[2]),
      final_goods: pathUtils.join(productPath, STANDARD_FOLDERS[3])
    };

    // 创建标准子文件夹
    if (createSubFolders && window.electronAPI?.createDirectory) {
      for (const folderPath of Object.values(subFolders)) {
        const result = await window.electronAPI.createDirectory(folderPath);
        if (!result.success) {
          console.warn(`创建子文件夹失败: ${folderPath}`, result.error);
        }
      }
    }

    // 构建产品信息
    const product: ProductInfo = {
      id: `${code}_${Date.now()}`,
      code,
      type,
      name,
      category,
      path: productPath,
      subFolders,
      createdAt: new Date()
    };

    return { success: true, product };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 重命名产品
 */
export async function renameProduct(
  oldPath: string,
  newName: string
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  try {
    // 提取产品编号
    const oldName = pathUtils.basename(oldPath);
    const codeMatch = oldName.match(/^(ST|CD\d{3})_/);
    
    if (!codeMatch) {
      throw new Error('无法识别产品编号');
    }

    const code = codeMatch[1];
    const parentDir = pathUtils.dirname(oldPath);
    const newFolderName = `${code}_${newName}`;
    const newPath = pathUtils.join(parentDir, newFolderName);

    // 检查新路径是否已存在
    const existsResult = await window.electronAPI.checkFileExists(newPath);
    if (existsResult.success && existsResult.exists) {
      throw new Error('目标路径已存在');
    }

    // TODO: 实现重命名功能（需要在 IPC 中添加）
    // const result = await window.electronAPI.renameFolder(oldPath, newPath);

    return {
      success: true,
      newPath
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 移动产品到不同分类
 */
export async function moveProduct(
  productPath: string,
  targetCategory: string,
  rootPath: string
): Promise<{ success: boolean; newPath?: string; error?: string }> {
  try {
    const productName = pathUtils.basename(productPath);
    const newPath = pathUtils.join(rootPath, targetCategory, productName);

    // 检查目标路径是否已存在
    const existsResult = await window.electronAPI.checkFileExists(newPath);
    if (existsResult.success && existsResult.exists) {
      throw new Error('目标位置已存在同名产品');
    }

    // 确保目标分类文件夹存在
    const targetCategoryPath = pathUtils.join(rootPath, targetCategory);
    const dirResult = await window.electronAPI?.createDirectory?.(targetCategoryPath);
    if (!dirResult?.success) {
      throw new Error(`创建目标分类文件夹失败: ${dirResult?.error}`);
    }

    // TODO: 实现移动功能（需要在 IPC 中添加）
    // const result = await window.electronAPI.moveFolder(productPath, newPath);

    return {
      success: true,
      newPath
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 删除产品
 */
export async function deleteProduct(
  _productPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: 实现删除文件夹功能（需要在 IPC 中添加）
    // const result = await window.electronAPI.deleteFolder(productPath);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * 验证产品名称
 */
export function validateProductName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '产品名称不能为空' };
  }

  if (name.length < 2) {
    return { valid: false, error: '产品名称至少2个字符' };
  }

  if (name.length > 50) {
    return { valid: false, error: '产品名称最多50个字符' };
  }

  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: '产品名称包含非法字符' };
  }

  return { valid: true };
}

