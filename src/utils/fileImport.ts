/**
 * 路径工具函数（兼容渲染进程）
 */
const pathUtils = {
  basename: (filePath: string): string => {
    return filePath.split(/[\\/]/).pop() || '';
  },
  extname: (filePath: string): string => {
    const basename = pathUtils.basename(filePath);
    const lastDot = basename.lastIndexOf('.');
    return lastDot === -1 ? '' : basename.substring(lastDot);
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
 * 导入文件选项
 */
export interface ImportFileOptions {
  /** 源文件路径列表 */
  sourcePaths: string[];
  /** 目标文件夹路径 */
  targetFolder: string;
  /** 产品前缀（如 ST001） */
  prefix: string;
  /** 是否覆盖已存在文件 */
  overwrite?: boolean;
}

/**
 * 导入结果
 */
export interface ImportResult {
  /** 成功导入的文件 */
  success: Array<{
    originalPath: string;
    newPath: string;
    newName: string;
  }>;
  /** 导入失败的文件 */
  failed: Array<{
    originalPath: string;
    error: string;
  }>;
  /** 总文件数 */
  total: number;
}

/**
 * 从文件名中提取序号
 * 格式: PREFIX_001_filename.ext
 */
function extractSequenceNumber(filename: string, prefix: string): number {
  const regex = new RegExp(`^${prefix}_(\\d+)_`, 'i');
  const match = filename.match(regex);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 获取目标文件夹中的最大序号
 */
export async function getMaxSequenceNumber(
  targetFolder: string,
  prefix: string
): Promise<number> {
  try {
    const files = await window.electronAPI?.listFiles?.(targetFolder);
    
    if (!files) return 0;
    
    let maxSeq = 0;
    files.forEach((file: { name: string }) => {
      const seq = extractSequenceNumber(file.name, prefix);
      if (seq > maxSeq) {
        maxSeq = seq;
      }
    });
    
    return maxSeq;
  } catch (error) {
    console.error('获取最大序号失败:', error);
    return 0;
  }
}

/**
 * 生成新文件名
 * 格式: {prefix}_{序号}_{原名}.{扩展名}
 */
export function generateNewFileName(
  originalName: string,
  prefix: string,
  sequence: number
): string {
  const ext = pathUtils.extname(originalName);
  const nameWithoutExt = pathUtils.basename(originalName).replace(ext, '');
  
  // 格式化序号为3位数字
  const seqStr = sequence.toString().padStart(3, '0');
  
  return `${prefix}_${seqStr}_${nameWithoutExt}${ext}`;
}

/**
 * 批量导入文件
 */
export async function importFiles(
  options: ImportFileOptions
): Promise<ImportResult> {
  const { sourcePaths, targetFolder, prefix, overwrite = false } = options;
  
  const result: ImportResult = {
    success: [],
    failed: [],
    total: sourcePaths.length
  };

  try {
    // 确保目标文件夹存在
    const dirResult = await window.electronAPI?.createDirectory?.(targetFolder);
    if (!dirResult?.success) {
      throw new Error(`无法创建目标文件夹: ${dirResult?.error}`);
    }

    // 获取起始序号
    let currentSeq = await getMaxSequenceNumber(targetFolder, prefix) + 1;

    // 逐个处理文件
    for (const sourcePath of sourcePaths) {
      try {
        const originalName = pathUtils.basename(sourcePath);
        const newName = generateNewFileName(originalName, prefix, currentSeq);
        const newPath = pathUtils.join(targetFolder, newName);

        // 检查文件是否存在
        if (!overwrite) {
          const existsResult = await window.electronAPI.checkFileExists(newPath);
          if (existsResult.success && existsResult.exists) {
            // 文件已存在，递增序号
            currentSeq++;
            const retryName = generateNewFileName(originalName, prefix, currentSeq);
            const retryPath = pathUtils.join(targetFolder, retryName);
            
            // 复制文件
            const copyResult = await window.electronAPI.writeFile(
              retryPath,
              await window.electronAPI.readFile(sourcePath).then(r => r.data || '')
            );

            if (copyResult.success) {
              result.success.push({
                originalPath: sourcePath,
                newPath: retryPath,
                newName: retryName
              });
              currentSeq++;
            } else {
              throw new Error(copyResult.error || '复制失败');
            }
            continue;
          }
        }

        // 读取源文件
        const readResult = await window.electronAPI.readFile(sourcePath);
        if (!readResult.success || !readResult.data) {
          throw new Error(readResult.error || '读取文件失败');
        }

        // 写入目标文件
        const writeResult = await window.electronAPI.writeFile(newPath, readResult.data);
        if (!writeResult.success) {
          throw new Error(writeResult.error || '写入文件失败');
        }

        result.success.push({
          originalPath: sourcePath,
          newPath: newPath,
          newName: newName
        });

        currentSeq++;
      } catch (error) {
        result.failed.push({
          originalPath: sourcePath,
          error: (error as Error).message
        });
      }
    }
  } catch (error) {
    // 整体失败，所有文件都标记为失败
    sourcePaths.forEach(sourcePath => {
      result.failed.push({
        originalPath: sourcePath,
        error: (error as Error).message
      });
    });
  }

  return result;
}

/**
 * 验证文件类型
 */
export function validateFileType(
  filePath: string,
  allowedExtensions: string[]
): boolean {
  const ext = pathUtils.extname(filePath).toLowerCase().substring(1);
  return allowedExtensions.includes(ext);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

