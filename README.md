# Temu 素材管理系统

基于 Electron + React + TypeScript 开发的现代化桌面应用。

## 技术栈

- **Electron 28+** - 桌面应用框架
- **React 18** - UI框架
- **TypeScript 5** - 类型安全
- **Vite 5** - 构建工具
- **Ant Design 5** - UI组件库
- **Zustand** - 状态管理

## 功能特性

- ✅ 现代化的暗色主题界面
- ✅ TypeScript 全栈类型安全
- ✅ 开发环境热重载
- ✅ IPC 进程间通信
- ✅ 文件系统操作
- ✅ 响应式布局

## 开发环境

### 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
```

这将同时启动：
- Vite 开发服务器 (端口 5173)
- Electron 应用窗口
- 开发者工具

### 构建生产版本

```bash
# 打包所有平台
npm run build

# 仅打包 Windows
npm run build:win

# 仅打包 macOS
npm run build:mac

# 仅打包 Linux
npm run build:linux
```

构建产物将输出到 `release/版本号/` 目录。

**注意**: 首次打包前需要准备图标文件，详见 [打包发布指南.md](./打包发布指南.md)

## 项目结构

```
temu-material-manager/
├── electron/              # Electron 主进程代码
│   ├── main.ts           # 主进程入口
│   └── preload.ts        # 预加载脚本
├── src/                  # React 渲染进程代码
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # React 入口
│   ├── index.css         # 全局样式
│   └── vite-env.d.ts     # 类型声明
├── dist/                 # React 构建输出
├── dist-electron/        # Electron 构建输出
├── release/              # 最终打包输出
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── electron-builder.json # 打包配置
```

## 开发说明

### IPC 通信

主进程和渲染进程通过 IPC 通信，已预置以下 API：

- `getAppVersion()` - 获取应用版本
- `getAppPath()` - 获取应用数据目录
- `readFile(path)` - 读取文件
- `writeFile(path, content)` - 写入文件
- `checkFileExists(path)` - 检查文件是否存在

### 添加新的 IPC API

1. 在 `electron/main.ts` 中添加 `ipcMain.handle()` 处理器
2. 在 `electron/preload.ts` 中暴露 API
3. 在 `src/vite-env.d.ts` 中添加类型声明

## 许可证

MIT

