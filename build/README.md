# 构建资源目录

此目录包含应用打包所需的资源文件。

## 📁 必需文件

### 图标文件

请在此目录放置以下图标文件：

#### 1. icon.png
- **尺寸**: 512x512 像素
- **格式**: PNG
- **用途**: 通用图标，Linux AppImage

#### 2. icon.ico  
- **尺寸**: 256x256 像素（推荐包含多个尺寸）
- **格式**: ICO
- **用途**: Windows 应用图标、安装程序图标

#### 3. icon.icns
- **尺寸**: 512x512 像素
- **格式**: ICNS
- **用途**: macOS 应用图标

## 🎨 图标设计建议

### 设计要点
- 简洁明了，易于识别
- 在小尺寸下清晰可见
- 使用品牌颜色
- 避免过多细节

### 推荐尺寸
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256
- 512x512
- 1024x1024

## 🛠️ 图标制作工具

### 在线工具
1. **Favicon.io** - https://favicon.io/
   - 免费，快速生成多种格式

2. **IcoConverter** - https://www.icoconverter.com/
   - PNG 转 ICO/ICNS

3. **CloudConvert** - https://cloudconvert.com/
   - 支持多种格式转换

### 桌面软件
1. **GIMP** (免费)
   - 跨平台图像编辑器
   - 支持 ICO 导出

2. **IcoFX** (Windows)
   - 专业图标编辑软件

3. **Image2icon** (macOS)
   - Mac 图标制作工具

### 命令行工具 (macOS)

从 PNG 创建 ICNS：

```bash
# 创建临时目录
mkdir icon.iconset

# 生成各种尺寸
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# 转换为 ICNS
iconutil -c icns icon.iconset

# 清理
rm -rf icon.iconset
```

## 📄 其他文件

### installer.nsh
NSIS 安装程序自定义脚本（Windows）

### entitlements.mac.plist
macOS 应用权限配置文件

## ⚠️ 注意事项

1. **版权**: 确保使用的图标拥有合法授权
2. **质量**: 使用高分辨率源文件
3. **格式**: 严格按照要求的格式和尺寸
4. **测试**: 打包后检查图标显示效果

## 🎯 快速开始

如果你暂时没有图标，可以使用占位图标：

1. 创建一个简单的 512x512 PNG 图标
2. 使用在线工具转换为其他格式
3. 放置到此目录
4. 运行打包命令测试

---

**准备好图标后，运行 `npm run build:win` 进行打包！**

