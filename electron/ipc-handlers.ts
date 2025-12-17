import { ipcMain, dialog } from 'electron';
import fs from 'fs-extra';
import path from 'path';
// 修复：返回文件夹和文件

/**
 * 文件导入结果
 */
interface ImportResult {
  success: string[];
  failed: Array<{ file: string; error: string }>;
}

/**
 * 文件信息
 */
interface FileInfo {
  name: string;
  path: string;
  size: number;
  createTime?: Date;
  modifyTime?: Date;
  isDirectory?: boolean;
}

/**
 * 生成唯一的文件名（避免重名）
 * 格式: 序号_原文件名
 */
function generateUniqueFileName(targetDir: string, originalName: string): string {
  let counter = 1;
  let newName = originalName;
  let newPath = path.join(targetDir, newName);

  // 检查文件是否存在，如果存在则添加序�?
  while (fs.existsSync(newPath)) {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    newName = `${counter}_${nameWithoutExt}${ext}`;
    newPath = path.join(targetDir, newName);
    counter++;
  }

  return newName;
}

/**
 * 注册所有IPC处理�?
 */
export function registerIpcHandlers() {
  /**
   * 导入文件到目标文件夹
   */
  ipcMain.handle('import-files', async (_event, files: string[], targetFolder: string): Promise<ImportResult> => {
    const result: ImportResult = {
      success: [],
      failed: []
    };

    try {
      // 确保目标文件夹存�?
      await fs.ensureDir(targetFolder);

      // 逐个处理文件
      for (const filePath of files) {
        try {
          // 检查源文件是否存在
          if (!await fs.pathExists(filePath)) {
            result.failed.push({
              file: path.basename(filePath),
              error: 'Source file does not exist'
            });
            continue;
          }

          // 获取原始文件�?
          const originalName = path.basename(filePath);
          
          // 生成唯一文件�?
          const uniqueName = generateUniqueFileName(targetFolder, originalName);
          const targetPath = path.join(targetFolder, uniqueName);

          // 复制文件
          await fs.copy(filePath, targetPath, { overwrite: false });

          result.success.push(uniqueName);
        } catch (error) {
          result.failed.push({
            file: path.basename(filePath),
            error: (error as Error).message
          });
        }
      }
    } catch (error) {
      console.error('Import files failed:', error);
      throw error;
    }

    return result;
  });

  /**
   * 打开文件夹选择对话�?
   */
  ipcMain.handle('select-folder', async (): Promise<string | null> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Folder',
        buttonLabel: 'Select'
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('Failed to select folder:', error);
      throw error;
    }
  });

  /**
   * 列出文件夹中的所有文�?
   */
  ipcMain.handle('list-files', async (_event, folder: string): Promise<FileInfo[]> => {
    try {
      // 检查文件夹是否存在
      if (!await fs.pathExists(folder)) {
        return [];
      }

      const files = await fs.readdir(folder);
      const fileInfos: FileInfo[] = [];

      // 获取每个文件/文件夹的详细信息
      for (const file of files) {
        const filePath = path.join(folder, file);
        try {
          const stats = await fs.stat(filePath);

          // 返回文件和文件夹
          fileInfos.push({
            name: file,
            path: filePath,
            size: stats.size,
            createTime: stats.birthtime,
            modifyTime: stats.mtime,
            isDirectory: stats.isDirectory()  // 标记是否为目�?
          });
        } catch (error) {
          console.error(`Failed to get file info: ${file}`, error);
        }
      }

      return fileInfos;
    } catch (error) {
      console.error('List files failed:', error);
      throw error;
    }
  });

  /**
   * 创建目录
   */
  ipcMain.handle('create-directory', async (_event, dirPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await fs.ensureDir(dirPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 删除文件
   */
  ipcMain.handle('delete-file', async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查文件是否存�?
      if (!await fs.pathExists(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }

      await fs.remove(filePath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 重命名文件或文件�?
   */
  ipcMain.handle('rename-path', async (_event, oldPath: string, newPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查源路径是否存在
      if (!await fs.pathExists(oldPath)) {
        return {
          success: false,
          error: 'Source path does not exist'
        };
      }

      // 检查目标路径是否已存在
      if (await fs.pathExists(newPath)) {
        return {
          success: false,
          error: 'Target path already exists'
        };
      }

      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 移动文件或文件夹
   */
  ipcMain.handle('move-path', async (_event, sourcePath: string, targetPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查源路径是否存在
      if (!await fs.pathExists(sourcePath)) {
        return {
          success: false,
          error: 'Source path does not exist'
        };
      }

      // 检查目标路径是否已存在
      if (await fs.pathExists(targetPath)) {
        return {
          success: false,
          error: 'Target path already exists'
        };
      }

      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetPath));

      // 移动文件或文件夹
      await fs.move(sourcePath, targetPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 复制文件
   */
  ipcMain.handle('copy-file', async (_event, sourcePath: string, targetPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查源文件是否存在
      if (!await fs.pathExists(sourcePath)) {
        return {
          success: false,
          error: '源文件不存在'
        };
      }

      // 确保目标目录存在
      await fs.ensureDir(path.dirname(targetPath));

      // 复制文件
      await fs.copy(sourcePath, targetPath, { overwrite: false });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 批量复制文件（优化版导入�?
   */
  ipcMain.handle('batch-copy-files', async (_event, files: Array<{ source: string; target: string }>): Promise<ImportResult> => {
    const result: ImportResult = {
      success: [],
      failed: []
    };

    for (const { source, target } of files) {
      try {
        // 检查源文件是否存在
        if (!await fs.pathExists(source)) {
          result.failed.push({
            file: path.basename(source),
            error: '源文件不存在'
          });
          continue;
        }

        // 确保目标目录存在
        await fs.ensureDir(path.dirname(target));

        // 复制文件
        await fs.copy(source, target, { overwrite: false });
        
        result.success.push(path.basename(target));
      } catch (error) {
        result.failed.push({
          file: path.basename(source),
          error: (error as Error).message
        });
      }
    }

    return result;
  });

  /**
   * 删除文件�?
   */
  ipcMain.handle('delete-folder', async (_event, folderPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 检查文件夹是否存在
      if (!await fs.pathExists(folderPath)) {
        return {
          success: false,
          error: 'Folder does not exist'
        };
      }

      // 删除文件夹及其内�?
      await fs.remove(folderPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 获取文件夹大�?
   */
  ipcMain.handle('get-folder-size', async (_event, folderPath: string): Promise<{ success: boolean; size?: number; error?: string }> => {
    try {
      if (!await fs.pathExists(folderPath)) {
        return {
          success: false,
          error: 'Folder does not exist'
        };
      }

      let totalSize = 0;
      
      const calculateSize = async (dirPath: string) => {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            await calculateSize(filePath);
          } else {
            totalSize += stats.size;
          }
        }
      };

      await calculateSize(folderPath);

      return {
        success: true,
        size: totalSize
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 打开文件管理器并选中文件
   */
  ipcMain.handle('show-in-folder', async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { shell } = await import('electron');
      
      if (!await fs.pathExists(filePath)) {
        return {
          success: false,
          error: 'Path does not exist'
        };
      }

      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 在默认应用中打开文件
   */
  ipcMain.handle('open-file', async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { shell } = await import('electron');
      
      if (!await fs.pathExists(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }

      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });

  /**
   * 复制文件到系统剪贴板
   */
  ipcMain.handle('copy-file-to-clipboard', async (_event, filePath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { clipboard } = await import('electron');
      
      if (!await fs.pathExists(filePath)) {
        return {
          success: false,
          error: '文件不存在'
        };
      }

      // 将文件路径写入剪贴板
      // 在 Windows 上使用标准格式
      if (process.platform === 'win32') {
        // Windows: 使用 CF_HDROP 格式
        const nullChar = '\0';
        const doubleNullChar = '\0\0';
        // 格式: 文件路径列表，以 \0 分隔，以 \0\0 结尾
        const filesString = filePath + nullChar + doubleNullChar;
        clipboard.writeBuffer('FileNameW', Buffer.from(filesString, 'ucs2'));
      } else {
        // macOS/Linux: 使用文件 URI
        clipboard.writeText(`file://${filePath}`);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  });
}


