/**
 * 图标生成脚本
 * 将 SVG 转换为各平台所需的图标格式
 * 
 * 使用方法：node scripts/generate-icons.js
 * 
 * 注意：需要安装依赖
 * npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

console.log('图标生成脚本');
console.log('=' .repeat(50));

// 检查 sharp 是否安装
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ 错误: 未安装 sharp 库');
  console.log('\n请运行以下命令安装：');
  console.log('  npm install sharp --save-dev');
  console.log('\n安装后重新运行此脚本。');
  process.exit(1);
}

const svgPath = path.join(__dirname, '../build/icon.png.svg');
const outputDir = path.join(__dirname, '../build');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成不同尺寸的 PNG 图标
const sizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 64, name: 'icon-64x64.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 1024, name: 'icon.png' } // 主图标
];

async function generateIcons() {
  try {
    // 读取 SVG 文件
    const svgBuffer = fs.readFileSync(svgPath);
    
    console.log('📦 开始生成图标...\n');
    
    // 生成各种尺寸的 PNG
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ 已生成: ${name} (${size}x${size})`);
    }
    
    console.log('\n🎉 图标生成完成！');
    console.log(`\n输出目录: ${outputDir}`);
    console.log('\n生成的文件：');
    console.log('  - icon.png (1024x1024) - 主图标源文件');
    console.log('  - icon-*.png - 各种尺寸的图标');
    console.log('\n💡 提示：');
    console.log('  - Windows .ico 文件会在打包时自动生成');
    console.log('  - macOS .icns 文件会在打包时自动生成');
    
  } catch (error) {
    console.error('❌ 生成图标时出错:', error.message);
    process.exit(1);
  }
}

// 检查 SVG 文件是否存在
if (!fs.existsSync(svgPath)) {
  console.error(`❌ 错误: 找不到 SVG 文件: ${svgPath}`);
  process.exit(1);
}

// 执行生成
generateIcons();

