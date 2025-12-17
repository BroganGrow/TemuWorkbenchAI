/**
 * 拖放文件信息
 */
export interface DroppedFile {
  /** 文件名 */
  name: string;
  /** 文件完整路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME类型 */
  type: string;
}

/**
 * 文件导入结果
 */
export interface ImportResult {
  /** 成功导入的文件路径列表 */
  success: string[];
  /** 失败的文件及错误信息 */
  failed: Array<{ file: string; error: string }>;
}

/**
 * 文件信息（用于文件列表显示）
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  /** 文件完整路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 创建时间 */
  createTime?: Date;
  /** 修改时间 */
  modifyTime?: Date;
  /** 是否是目录 */
  isDirectory?: boolean;
}

/**
 * Electron API类型扩展
 */
declare global {
  interface Window {
    electronAPI: {
      // 基础API
      getAppVersion: () => Promise<string>;
      getAppPath: () => Promise<string>;
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
      
      // 文件操作API
      importFiles: (files: string[], targetFolder: string) => Promise<ImportResult>;
      selectFolder: () => Promise<string | null>;
      listFiles: (folder: string) => Promise<FileInfo[]>;
      createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      
      // 高级文件操作API
      renamePath: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
      movePath: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
      copyFile: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
      batchCopyFiles: (files: Array<{ source: string; target: string }>) => Promise<ImportResult>;
      deleteFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
      getFolderSize: (folderPath: string) => Promise<{ success: boolean; size?: number; error?: string }>;
      showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      copyFileToClipboard: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      
      // 窗口控制API
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      isMaximized: () => Promise<boolean>;
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
      windowIsMaximized: () => Promise<boolean>;
      
      // 产品管理API
      getNextSerialNumber: (rootPath: string, productType: string) => Promise<number>;
      updateMenuPath: (folderPath: string | null) => void;
    };
  }
}

export {};

