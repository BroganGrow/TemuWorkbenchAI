import { app, BrowserWindow, ipcMain, globalShortcut, nativeImage, Tray, Menu, screen } from 'electron';
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
// 系统托盘
let tray: Tray | null = null;

// 创建新窗口
// separateInTaskbar: 是否在任务栏中独立显示（不合并），默认为 true
function createWindow(separateInTaskbar: boolean = true): BrowserWindow {
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

  // 获取主显示器尺寸
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // 读取窗口设置（从 JSON 文件）
  // 我们使用一个简单的 JSON 文件来存储窗口设置，便于主进程读取
  let widthPercent = 90;
  let heightPercent = 85;
  let minWidthPercent = 60;
  let minHeightPercent = 50;
  
  try {
    const userDataPath = app.getPath('userData');
    const windowSettingsPath = path.join(userDataPath, 'window-settings.json');
    if (fs.existsSync(windowSettingsPath)) {
      const settingsData = fs.readFileSync(windowSettingsPath, 'utf-8');
      const parsed = JSON.parse(settingsData);
      if (parsed) {
        widthPercent = parsed.widthPercent ?? 90;
        heightPercent = parsed.heightPercent ?? 85;
        minWidthPercent = parsed.minWidthPercent ?? 60;
        minHeightPercent = parsed.minHeightPercent ?? 50;
      }
    }
  } catch (error) {
    console.log('读取窗口设置失败，使用默认值:', error);
  }
  
  // 使用屏幕尺寸的百分比
  const windowWidth = Math.floor(screenWidth * (widthPercent / 100));
  const windowHeight = Math.floor(screenHeight * (heightPercent / 100));
  const minWidth = Math.floor(screenWidth * (minWidthPercent / 100));
  const minHeight = Math.floor(screenHeight * (minHeightPercent / 100));

  const newWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWidth,
    minHeight: minHeight,
    title: '',
    frame: false, // 使用无边框窗口，自定义标题栏
    icon: appIcon, // 设置窗口图标
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,  // 开发环境禁用web安全检查
      // 禁用 GPU 缓存以避免缓存创建错误（如果不需要 GPU 加速可以禁用）
      // enableWebSQL: false,
      // 使用应用级别的缓存目录，而不是窗口级别的
      partition: 'persist:main'  // 所有窗口共享同一个 session partition
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

  // 窗口关闭时隐藏到托盘，而不是真正关闭
  newWindow.on('close', (event) => {
    // 如果不是退出应用，则隐藏窗口到托盘
    if (!(app as any).isQuitting) {
      event.preventDefault();
      newWindow.hide();
      // 更新托盘菜单
      updateTrayMenu();
    } else {
      // 真正关闭窗口
      windows.delete(newWindow);
    }
  });

  // 窗口关闭后从集合中移除
  newWindow.on('closed', () => {
    windows.delete(newWindow);
    // 更新托盘菜单
    updateTrayMenu();
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

// 创建系统托盘
function createTray() {
  // 设置托盘图标
  let trayIcon;
  const iconPath = path.join(__dirname, '../build/icon.png');
  const iconSvgPath = path.join(__dirname, '../build/icon.svg');
  
  // 优先使用 PNG，如果不存在则使用 SVG
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else if (fs.existsSync(iconSvgPath)) {
    const svgContent = fs.readFileSync(iconSvgPath, 'utf-8');
    trayIcon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`);
  } else {
    // 如果没有图标，创建一个简单的图标
    trayIcon = nativeImage.createEmpty();
  }
  
  // 调整图标大小（系统托盘通常需要 16x16 或 32x32）
  if (trayIcon && !trayIcon.isEmpty()) {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Temu工作台');
  
  // 更新托盘菜单
  updateTrayMenu();
  
  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    showAllWindows();
  });
}

// 关闭指定窗口
function closeWindow(windowId: number) {
  const windowToClose = Array.from(windows).find(win => win.id === windowId);
  if (windowToClose && !windowToClose.isDestroyed()) {
    // 设置退出标志，允许窗口真正关闭
    (app as any).isQuitting = true;
    windowToClose.destroy();
    (app as any).isQuitting = false;
    // 更新托盘菜单
    updateTrayMenu();
  }
}

// 更新托盘菜单
function updateTrayMenu() {
  if (!tray) return;
  
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '显示所有窗口',
      click: () => {
        showAllWindows();
      }
    },
    { type: 'separator' },
    {
      label: '新建窗口',
      click: () => {
        createWindow(true);
      }
    },
    {
      label: '新建窗口（合并）',
      click: () => {
        createWindow(false);
      }
    },
  ];
  
  // 如果有多个窗口，显示窗口列表
  if (windows.size > 1) {
    template.push({ type: 'separator' });
    template.push({
      label: '窗口列表',
      enabled: false
    });
    
    // 为每个窗口添加菜单项
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        const windowTitle = win.getTitle() || `窗口 ${win.id}`;
        template.push({
          label: windowTitle,
          submenu: [
            {
              label: '显示',
              click: () => {
                if (!win.isDestroyed()) {
                  win.show();
                  if (win.isMinimized()) {
                    win.restore();
                  }
                  win.focus();
                }
              }
            },
            {
              label: '关闭',
              click: () => {
                closeWindow(win.id);
              }
            }
          ]
        });
      }
    });
  }
  
  template.push({ type: 'separator' });
  template.push({
    label: '退出',
    click: () => {
      (app as any).isQuitting = true;
      app.quit();
    }
  });
  
  const contextMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(contextMenu);
}

// 显示所有窗口
function showAllWindows() {
  windows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.show();
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  // 初始化退出标志
  (app as any).isQuitting = false;
  
  // 设置应用的基础 appUserModelId（Windows）
  // 这确保应用有正确的图标显示
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.temuworkbench');
    
    // 设置统一的缓存目录，避免多窗口缓存冲突
    // 确保所有窗口共享同一个缓存目录，而不是每个窗口创建独立的缓存
    try {
      const userDataPath = app.getPath('userData');
      const cachePath = path.join(userDataPath, 'Cache');
      const gpuCachePath = path.join(userDataPath, 'GPUCache');
      
      // 确保缓存目录存在且有正确的权限
      if (!fs.existsSync(cachePath)) {
        fs.ensureDirSync(cachePath);
      }
      if (!fs.existsSync(gpuCachePath)) {
        fs.ensureDirSync(gpuCachePath);
      }
      
      // 设置环境变量，让 Chromium 使用统一的缓存目录
      process.env.CHROME_USER_DATA_DIR = userDataPath;
    } catch (error) {
      console.warn('设置缓存目录失败，使用默认缓存:', error);
    }
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
  
  // 创建系统托盘
  createTray();

  app.on('activate', () => {
    if (windows.size === 0) {
      createWindow();
    } else {
      // 如果有窗口但都隐藏了，显示它们
      showAllWindows();
    }
  });
});

// 所有窗口关闭时，不退出应用，而是隐藏到托盘
app.on('window-all-closed', () => {
  // 不退出应用，让窗口隐藏到托盘
  // 只有在 macOS 上才退出（因为 macOS 有 Dock）
  // 但我们已经有了托盘，所以也不退出
  // 用户可以通过托盘菜单退出
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

// IPC: 关闭指定窗口
ipcMain.handle('close-window', (_event, windowId: number) => {
  closeWindow(windowId);
  return { success: true };
});

// IPC: 获取当前窗口 ID（通过 webContents 获取）
ipcMain.handle('get-current-window-id', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.id : 0;
});

// IPC: 更新窗口设置（保存到文件，供下次创建窗口时使用）
ipcMain.handle('update-window-settings', async (_event, settings: { widthPercent?: number; heightPercent?: number; minWidthPercent?: number; minHeightPercent?: number }) => {
  try {
    const userDataPath = app.getPath('userData');
    const windowSettingsPath = path.join(userDataPath, 'window-settings.json');
    
    // 读取现有设置
    let existingSettings: any = {};
    if (fs.existsSync(windowSettingsPath)) {
      try {
        const data = fs.readFileSync(windowSettingsPath, 'utf-8');
        existingSettings = JSON.parse(data);
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    // 合并新设置
    const mergedSettings = {
      ...existingSettings,
      ...settings
    };
    
    // 保存到文件
    await fs.writeFile(windowSettingsPath, JSON.stringify(mergedSettings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('保存窗口设置失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

// 应用退出时清理全局快捷键和托盘
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
    tray = null;
  }
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

