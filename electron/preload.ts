import { contextBridge, ipcRenderer } from 'electron';

// 定义API类型
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
}

// 通过contextBridge暴露API到渲染进程
const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath)
};

// 暴露到window对象
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明（用于TypeScript）
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

