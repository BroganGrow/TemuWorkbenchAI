# 更新日志

所有重要的项目更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划功能
- 图片预览功能
- 批量重命名工具
- 云端同步
- 文件夹拖放支持

## [1.0.0] - 2024-12-17

### 新增
- ✨ VSCode风格的现代化UI界面
- 📁 6个产品生命周期分类管理
- 🎯 自动产品编号生成（ST001, CD001...）
- 📂 标准子文件夹自动创建
- 🖱️ 文件拖放导入功能
- 🔄 智能文件重命名（前缀_序号_文件名）
- 🎨 深色/浅色主题切换
- 💾 配置持久化存储
- 🔍 产品搜索功能
- 📊 列表/网格视图切换
- ⚙️ IPC进程间通信
- 🗂️ 文件树导航
- ✏️ 产品重命名/移动/删除
- 📋 右键菜单快捷操作

### 功能特性
- 完整的TypeScript类型支持
- Electron 28 + React 18 + Vite 5
- Ant Design 5 组件库
- Zustand 状态管理
- 热重载开发环境
- 响应式布局设计

### 技术架构
- 主进程：Electron + Node.js + fs-extra
- 渲染进程：React + TypeScript + Ant Design
- 状态管理：Zustand + persist middleware
- 构建工具：Vite + electron-builder
- IPC通信：contextBridge + ipcRenderer

## [0.1.0] - 2024-12-15

### 新增
- 项目初始化
- 基础框架搭建
- 开发环境配置

---

## 版本说明

- **主版本号（Major）**: 不兼容的API更改
- **次版本号（Minor）**: 向后兼容的功能新增
- **修订号（Patch）**: 向后兼容的问题修复

[未发布]: https://github.com/your-username/super-tools/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/super-tools/releases/tag/v1.0.0
[0.1.0]: https://github.com/your-username/super-tools/releases/tag/v0.1.0

