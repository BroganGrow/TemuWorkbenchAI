import { contextBridge, ipcRenderer } from 'electron';

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
}

// 定义API类型
export interface ElectronAPI {
  // 原有API
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  
  // 文件操作API
  importFiles: (files: string[], targetFolder: string, productId?: string) => Promise<ImportResult>;
  normalizeFileNames: (folderPath: string, productId: string) => Promise<{
    success: boolean;
    renamed: Array<{ oldName: string; newName: string }>;
    skipped: string[];
    failed: Array<{ file: string; error: string }>;
    error?: string;
  }>;
  selectFolder: () => Promise<string | null>;
  listFiles: (folder: string) => Promise<FileInfo[]>;
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  
  // 新增文件操作API
  renamePath: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  movePath: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
  copyFile: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
  batchCopyFiles: (files: Array<{ source: string; target: string }>) => Promise<ImportResult>;
  deleteFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  getFolderSize: (folderPath: string) => Promise<{ success: boolean; size?: number; error?: string }>;
  showInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  copyFileToClipboard: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getClipboardFiles: () => Promise<{ success: boolean; files?: string[]; error?: string }>;
  
  // 窗口控制 API
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowIsMaximized: () => Promise<boolean>;
  
  // 产品管理 API
  getNextSerialNumber: (rootPath: string, productType: string) => Promise<number>;
  updateMenuPath: (folderPath: string | null) => void;
  
  // 窗口管理 API
  createNewWindow: () => Promise<{ success: boolean; windowId?: number }>;
  createNewWindowMerged: () => Promise<{ success: boolean; windowId?: number }>;
  
  // 窗口设置 API
  updateWindowSettings: (settings: { widthPercent?: number; heightPercent?: number; minWidthPercent?: number; minHeightPercent?: number }) => Promise<{ success: boolean }>;
}

// 通过contextBridge暴露API到渲染进程
const electronAPI: ElectronAPI = {
  // 原有API
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // 文件操作API
  importFiles: (files: string[], targetFolder: string, productId?: string) => 
    ipcRenderer.invoke('import-files', files, targetFolder, productId),
  normalizeFileNames: (folderPath: string, productId: string) =>
    ipcRenderer.invoke('normalize-file-names', folderPath, productId),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  listFiles: (folder: string) => ipcRenderer.invoke('list-files', folder),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  
  // 新增文件操作API
  renamePath: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-path', oldPath, newPath),
  movePath: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('move-path', sourcePath, targetPath),
  copyFile: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('copy-file', sourcePath, targetPath),
  batchCopyFiles: (files: Array<{ source: string; target: string }>) => ipcRenderer.invoke('batch-copy-files', files),
  deleteFolder: (folderPath: string) => ipcRenderer.invoke('delete-folder', folderPath),
  getFolderSize: (folderPath: string) => ipcRenderer.invoke('get-folder-size', folderPath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  copyFileToClipboard: (filePath: string) => ipcRenderer.invoke('copy-file-to-clipboard', filePath),
  getClipboardFiles: () => ipcRenderer.invoke('get-clipboard-files'),
  
  // 窗口控制 API
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // 产品管理 API
  getNextSerialNumber: (rootPath: string, productType: string) => ipcRenderer.invoke('get-next-serial-number', rootPath, productType),
  updateMenuPath: (folderPath: string | null) => ipcRenderer.send('update-menu-path', folderPath),
  
  // 窗口管理 API
  createNewWindow: () => ipcRenderer.invoke('create-new-window'),
  createNewWindowMerged: () => ipcRenderer.invoke('create-new-window-merged'),
  
  // 窗口设置 API
  updateWindowSettings: (settings) => ipcRenderer.invoke('update-window-settings', settings)
};

// 暴露到window对象
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明（用于TypeScript）
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

