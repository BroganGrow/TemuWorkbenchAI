/// <reference types="vite/client" />

// Electron API类型声明
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
}

interface Window {
  electronAPI: ElectronAPI;
}

