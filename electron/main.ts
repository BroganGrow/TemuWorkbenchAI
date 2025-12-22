import { app, BrowserWindow, ipcMain, globalShortcut, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { registerIpcHandlers } from './ipc-handlers.js';

// 禁用 Electron 开发环境的安全警告（开发用）
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// 设置标准输出编码为 UTF-8（修复 Windows 终端中文乱码）
if (process.stdout && typeof process.stdout.setEncoding === 'function') {
  process.stdout.setEncoding('utf8');
}
if (process.stderr && typeof process.stderr.setEncoding === 'function') {
  process.stderr.setEncoding('utf8');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 开发环境判断
const isDev = process.env.NODE_ENV !== 'production';

// 窗口管理：使用 Set 存储所有窗口
const windows = new Set<BrowserWindow>();
// 窗口计数器，用于生成唯一的 appUserModelId
let windowCounter = 0;

// 创建新窗口
// separateInTaskbar: 是否在任务栏中独立显示（不合并），默认为 true
function createWindow(separateInTaskbar: boolean = true) {
  // 设置应用图标
  let appIcon;
  const iconPath = path.join(__dirname, '../build/icon.png');
  const iconSvgPath = path.join(__dirname, '../build/icon.svg');
  let finalIconPath = '';
  
  // 优先使用 PNG，如果不存在则使用 SVG
  if (fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
    finalIconPath = iconPath;
  } else if (fs.existsSync(iconSvgPath)) {
    // 从 SVG 创建图标（Electron 支持）
    const svgContent = fs.readFileSync(iconSvgPath, 'utf-8');
    appIcon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`);
    finalIconPath = iconSvgPath;
  }

  const newWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '',
    frame: false, // 使用无边框窗口，自定义标题栏
    icon: appIcon, // 设置窗口图标
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
  newWindow.once('ready-to-show', () => {
    newWindow.show();
    console.log('Window ready');
    console.log('Preload path:', path.join(__dirname, 'preload.cjs'));
  });

  // 监听 preload 脚本加载
  newWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    // 测试 API 是否可用
    newWindow.webContents.executeJavaScript('typeof window.electronAPI')
      .then(result => console.log('window.electronAPI type:', result))
      .catch(err => console.error('Failed to check API:', err));
  });

  newWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload script load failed:', preloadPath, error);
  });

  // 注册开发者工具快捷键
  newWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      if (newWindow.webContents.isDevToolsOpened()) {
        newWindow.webContents.closeDevTools();
      } else {
        newWindow.webContents.openDevTools();
      }
      event.preventDefault();
    }
  });

  // 加载应用
  if (isDev) {
    newWindow.loadURL('http://localhost:5173');
    // 开发环境不自动打开调试工具，需要时按 F12 打开
    // newWindow.webContents.openDevTools();
  } else {
    newWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口关闭时从集合中移除
  newWindow.on('closed', () => {
    windows.delete(newWindow);
  });

  // 将新窗口添加到集合中
  windows.add(newWindow);
  
  // 为每个窗口设置 appUserModelId
  // Windows 上，不同的 appUserModelId 会让窗口在任务栏中独立显示
  // 相同的 appUserModelId 会让窗口在任务栏中合并显示
  if (process.platform === 'win32') {
    try {
      // 检查 setAppDetails 方法是否可用（Electron 较新版本）
      if (typeof (newWindow as any).setAppDetails === 'function') {
        if (separateInTaskbar) {
          // 独立显示：为每个窗口设置不同的 appId
          windowCounter++;
          const appId = `com.temuworkbench.window.${windowCounter}`;
          (newWindow as any).setAppDetails({
            appId: appId
            // 不设置 appIconPath，让系统使用应用默认图标
          });
          console.log(`窗口 ${windowCounter} 已设置独立 appUserModelId: ${appId}`);
        } else {
          // 合并显示：使用应用级别的 appId（不设置窗口级别的 appId）
          // 这样窗口会使用应用级别的 appUserModelId，在任务栏中合并显示
          console.log('窗口将使用应用级别的 appUserModelId，在任务栏中合并显示');
        }
      } else {
        // 如果 setAppDetails 不可用，尝试使用 webContents 设置
        // 注意：这可能需要特定的 Electron 版本支持
        console.log('setAppDetails 方法不可用，窗口将使用默认的 appUserModelId');
      }
    } catch (error) {
      console.log('设置窗口 appUserModelId 失败:', error);
    }
  }
  
  return newWindow;
}

// 应用准备就绪
app.whenReady().then(() => {
  // 设置应用的基础 appUserModelId（Windows）
  // 这确保应用有正确的图标显示
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.temuworkbench');
  }
  
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

  // 注册 Ctrl+N / Cmd+N 创建新窗口
  globalShortcut.register('CommandOrControl+N', () => {
    createWindow();
  });
  
  createWindow();

  app.on('activate', () => {
    if (windows.size === 0) {
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

// IPC: 创建新窗口（独立显示）
ipcMain.handle('create-new-window', () => {
  const newWindow = createWindow(true);
  return { success: true, windowId: newWindow.id };
});

// IPC: 创建新窗口（合并显示）
ipcMain.handle('create-new-window-merged', () => {
  const newWindow = createWindow(false);
  return { success: true, windowId: newWindow.id };
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

// 窗口控制 IPC 处理器
ipcMain.on('window-minimize', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  return focusedWindow ? focusedWindow.isMaximized() : false;
});

// 产品管理相关（预留接口，暂未实现）
ipcMain.handle('get-next-serial-number', async (_event, rootPath: string, productType: string) => {
  // 此功能已在前端实现，此处为预留接口
  return 1;
});

ipcMain.on('update-menu-path', (_event, folderPath: string | null) => {
  // 预留接口，用于更新菜单路径
  console.log('Update menu path:', folderPath);
});

