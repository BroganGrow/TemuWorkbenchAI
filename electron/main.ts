import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { registerIpcHandlers } from './ipc-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 开发环境判断
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null = null;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false  // 开发环境禁用web安全检查
    },
    backgroundColor: '#1f1f1f',
    show: false,
    autoHideMenuBar: true
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('✓ 窗口已准备就绪');
    console.log('✓ Preload 路径:', path.join(__dirname, 'preload.cjs'));
  });

  // 监听 preload 脚本加载
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✓ 页面加载完成');
    // 测试 API 是否可用
    mainWindow?.webContents.executeJavaScript('typeof window.electronAPI')
      .then(result => console.log('✓ window.electronAPI 类型:', result))
      .catch(err => console.error('✗ 检查 API 失败:', err));
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('✗ Preload 脚本加载失败:', preloadPath, error);
  });

  // 注册开发者工具快捷键
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      if (mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow?.webContents.closeDevTools();
      } else {
        mainWindow?.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 开发环境自动打开调试工具（暂时启用以便调试）
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  // 注册IPC处理器
  registerIpcHandlers();
  
  // 注册全局快捷键
  globalShortcut.register('F12', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      if (focusedWindow.webContents.isDevToolsOpened()) {
        focusedWindow.webContents.closeDevTools();
      } else {
        focusedWindow.webContents.openDevTools();
      }
    }
  });

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      if (focusedWindow.webContents.isDevToolsOpened()) {
        focusedWindow.webContents.closeDevTools();
      } else {
        focusedWindow.webContents.openDevTools();
      }
    }
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时清理全局快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC通信处理示例
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('check-file-exists', async (_event, filePath: string) => {
  try {
    const exists = await fs.pathExists(filePath);
    return { success: true, exists };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

