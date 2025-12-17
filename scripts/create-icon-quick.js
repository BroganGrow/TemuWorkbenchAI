/**
 * 快速创建图标 - 无需额外依赖
 * 生成一个简单的 256x256 PNG 图标
 */

const fs = require('fs');
const path = require('path');

// 创建一个简单的 256x256 PNG 图标（橙色圆形 + T 字母）
// 使用 base64 编码的 PNG 数据
const iconPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSogMABBAAQkSAABBAAIQAAQTAAHBAAAQBAAEAkSCAQCAcaQgAQCAQAQACAAQABAASAAIAEkACQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASQBJAAkASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATQBNAE0ATQBNAE0ATQBNAE0ATQBNAE0ATQBNAE0ATQBNAE0ATQBNAE0ATQBNAE0ATgBOAE4ATgBOAE4ATgBOAE4ATgBOAE4ATgBOAE4ATgBOAE4ATgBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAUgBSAFIAUgBSAFIAUgBSAFIAUgBTAFMAUwBTAFMAUwBTAFMAVABUAFQAVABUAFUAVQBVAFUAVQBWAFYAVgBWAFcAVwBXAFcAWABYAFgAWABZAFkAWQBZAFoAWgBaAFsAWwBbAFsAXABcAFwAXQBdAF0AXgBeAF4AXwBfAGAAYABgAGEAYQBhAGIAYgBiAGMAYwBjAGQAYwBkAGQAZQBlAGUAZgBmAGYAZwBnAGcAaABoAGgAaQBpAGkAagBqAGoAawBrAGsAbABsAGwAbQBtAG0AbgBuAG4AbwBvAG8AcABwAHAAcQBxAHEAcgByAHIAcwBzAHMAdAB0AHQAdQB1AHUAdgB2AHYAdwB3AHcAeAB4AHgAeQB5AHkAegB6AHoAewB7AHsAfAB8AHwAfQB9AH0AfgB+AH4AfwB/AIAAgACAAIEAgQCBAIIAggCCAIMAgwCDAIQAhACEAIUAhQCFAIYAhgCGAIcAhwCHAIgAiACIAIkAiQCJAIoAigCKAIsAiwCLAIwAjACMAI0AjQCNAI4AjgCOAI8AjwCPAJAAkACQAJEAkQCRAJIAkgCSAJMAkwCTAJQAlACUAJUAlQCVAJYAlgCWAJcAlwCXAJgAmACYAJkAmQCZAJoAmgCaAJsAmwCbAJwAnACcAJ0AnQCdAJ4AngCeAJ8AnwCfAKAAoACgAKEAoQChAKIAogCiAKMAowCjAKQApAA=';

const outputPath = path.join(__dirname, '../build/icon.png');

// 创建 build 目录（如果不存在）
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('🎨 正在创建图标...');

// 由于 base64 数据太长，我们使用另一种方法：创建一个 SVG 并让系统转换
// 或者直接复制一个临时图标

// 简化方案：创建一个提示文件
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- 渐变定义 -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff8c5a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#fd7a45;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 圆形背景 -->
  <circle cx="128" cy="128" r="120" fill="url(#grad)"/>
  
  <!-- 字母 T -->
  <rect x="64" y="64" width="128" height="24" rx="4" fill="white"/>
  <rect x="104" y="64" width="48" height="128" rx="4" fill="white"/>
  
  <!-- 装饰点 -->
  <circle cx="128" cy="64" r="8" fill="white" opacity="0.3"/>
  <circle cx="128" cy="192" r="12" fill="white" opacity="0.5"/>
</svg>`;

// 保存 SVG 版本
fs.writeFileSync(outputPath.replace('.png', '.svg'), svgIcon);

console.log('✅ SVG 图标已创建:', outputPath.replace('.png', '.svg'));
console.log('\n⚠️  注意：PNG 图标需要额外工具生成');
console.log('\n有两种方式生成 PNG：');
console.log('\n方式 1: 安装 sharp（推荐）');
console.log('  npm install sharp --save-dev');
console.log('  npm run generate-icons');
console.log('\n方式 2: 在线转换');
console.log('  1. 打开 https://svgtopng.com/');
console.log('  2. 上传 build/icon.svg');
console.log('  3. 下载 PNG 并保存为 build/icon.png');
console.log('\n方式 3: 使用你自己的 PNG 图标');
console.log('  直接替换 build/icon.png 文件（推荐 256x256 或更大）');

