# 图标文件说明

本目录包含应用的图标资源。

## 文件清单

- `icon.png.svg` - 高清 SVG 源文件（用于生成各种尺寸）
- `icon.png` - 1024x1024 主图标（打包时使用）
- `icon.ico` - Windows 图标（打包时自动生成）
- `icon.icns` - macOS 图标（打包时自动生成）

## Logo 设计说明

**设计元素：** 字母 "T"
**主色调：** #fd7a45（橙红色）
**风格：** 现代、简洁、扁平化

### 标题栏 Logo
- 位置：`public/logo.svg`
- 尺寸：32x32px
- 显示位置：窗口左上角

### 应用图标
- 位置：`build/icon.png`
- 尺寸：1024x1024px
- 用途：打包时生成各平台图标

## 生成图标

如果需要重新生成不同尺寸的图标，请运行：

```bash
npm install sharp --save-dev
npm run generate-icons
```

这将从 SVG 源文件生成所有需要的 PNG 图标。

## 自定义图标

如需更换图标：

1. 替换 `build/icon.png.svg` 为新的 SVG 设计
2. 替换 `public/logo.svg` 为新的标题栏 logo
3. 运行 `npm run generate-icons` 重新生成图标
4. 重新打包应用

## 注意事项

- SVG 文件应使用透明背景
- 图标设计应简洁明了，小尺寸下依然清晰
- 建议图标边缘留 5-10% 空白
- electron-builder 会在打包时自动处理图标转换
