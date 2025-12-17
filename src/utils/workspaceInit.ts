/**
 * 工作区初始化工具
 * 用于创建标准的 Temu 工作区目录结构
 */

export interface WorkspaceStructure {
  rootPath: string;
  categories: string[];
  assetFolders: string[];
}

// 标准目录结构
export const STANDARD_CATEGORIES = [
  '00_Assets',
  '01_In_Progress',
  '02_Listing',
  '03_Waiting',
  '04_Active',
  '05_Archive'
];

export const ASSET_SUBFOLDERS = [
  'Brand_Logo',
  'Common_Template',
  'ComfyUI_Workflows'
];

export const PRODUCT_SUBFOLDERS = [
  '01_Ref_Images',
  '02_Ai_Raw',
  '03_AI_Handle',
  '04_Final_Goods_Images'
];

/**
 * 检查工作区是否为标准 Temu 工作区结构
 */
export async function isStandardWorkspace(rootPath: string): Promise<boolean> {
  try {
    const files = await window.electronAPI.listFiles(rootPath);
    const folderNames = files.filter(f => f.isDirectory).map(f => f.name);
    
    // 检查是否包含至少 3 个标准目录
    const matchCount = STANDARD_CATEGORIES.filter(cat => 
      folderNames.includes(cat)
    ).length;
    
    return matchCount >= 3;
  } catch (error) {
    console.error('检查工作区结构失败:', error);
    return false;
  }
}

/**
 * 初始化标准工作区结构
 */
export async function initWorkspace(rootPath: string): Promise<{
  success: boolean;
  error?: string;
  created?: string[];
}> {
  try {
    const created: string[] = [];

    // 创建主分类目录
    for (const category of STANDARD_CATEGORIES) {
      const categoryPath = `${rootPath}/${category}`;
      const result = await window.electronAPI.createDirectory(categoryPath);
      
      if (result.success) {
        created.push(category);
        
        // 为 00_Assets 创建子文件夹
        if (category === '00_Assets') {
          for (const subFolder of ASSET_SUBFOLDERS) {
            const subPath = `${categoryPath}/${subFolder}`;
            await window.electronAPI.createDirectory(subPath);
            created.push(`${category}/${subFolder}`);
          }
        }
      } else if (result.error && !result.error.includes('already exists')) {
        console.error(`创建目录失败: ${category}`, result.error);
      }
    }

    // 创建模板产品文件夹
    const templatePath = `${rootPath}/02_Listing/CD000_20250101_Template_卡片_模版`;
    const templateResult = await window.electronAPI.createDirectory(templatePath);
    
    if (templateResult.success) {
      created.push('CD000_模版');
      
      // 创建模板子文件夹
      for (const subFolder of PRODUCT_SUBFOLDERS) {
        await window.electronAPI.createDirectory(`${templatePath}/${subFolder}`);
      }
      
      // 创建模板 GoodsInfo.md
      const templateMd = `# 产品模版

> 这是一个产品文件夹模版，新建产品时会自动创建这些文件夹

## 文件夹说明

- **01_Ref_Images**: 存放参考图片（亚马逊/Temu原图）
- **02_Ai_Raw**: 存放 AI 生成的带水印图片
- **03_AI_Handle**: 存放 ComfyUI 处理后的干净图片
- **04_Final_Goods_Images**: 存放最终成品图片（上传用）

## 使用流程

1. 将参考图放入 01_Ref_Images
2. 使用 AI 工具生成图片，保存到 02_Ai_Raw
3. 使用 ComfyUI 去水印/超分，保存到 03_AI_Handle
4. 最终裁切拼图后，保存到 04_Final_Goods_Images
5. 在本文件记录提示词、尺寸、参考链接等信息
`;
      await window.electronAPI.writeFile(`${templatePath}/GoodsInfo.md`, templateMd);
    }

    // 创建工作区说明文档
    const readmePath = `${rootPath}/README.md`;
    const readmeContent = `# Temu 工作区

## 目录结构说明

- **00_Assets**: 公共素材库（Logo、模板、ComfyUI 工作流）
- **01_In_Progress**: 选品池/初筛（刚下载还没决定做的参考图）
- **02_Listing**: 制作中/正在处理（核心工作区）
- **03_Waiting**: 已发货，未到 Temu 仓库
- **04_Active**: 已上架/热卖中
- **05_Archive**: 已下架/淘汰/历史

## 产品文件夹命名规则

格式：\`{类型}{序号}_{日期}_{源文件}_{规格}_{英文名}_{中文名}\`

示例：\`CD001_20251217_NoOrigin_6pcs_Candle_蜡烛贴纸\`

- **类型**: CD（卡片）、ST（贴纸）等
- **序号**: 000 三位数字，全局唯一
- **日期**: YYYYMMDD 格式
- **源文件**: HasOrigin（有刀模）/ NoOrigin（无刀模）
- **规格**: 如 6pcs、50pcs、A4size
- **英文名**: 产品英文名称
- **中文名**: 产品中文名称

## 标准子文件夹

每个产品文件夹包含：

1. **01_Ref_Images** - 参考图片
2. **02_Ai_Raw** - AI 生成原图
3. **03_AI_Handle** - AI 处理后图片
4. **04_Final_Goods_Images** - 最终成品
5. **GoodsInfo.md** - 产品信息文档

## 工作流程

1. 在工具中点击"新建产品"
2. 填写产品信息（类型、规格、名称等）
3. 工具自动创建标准文件夹结构
4. 按流程处理图片，放入对应文件夹
5. 在 GoodsInfo.md 中记录详细信息

---

创建日期: ${new Date().toLocaleDateString('zh-CN')}
`;
    await window.electronAPI.writeFile(readmePath, readmeContent);
    created.push('README.md');

    return { success: true, created };
  } catch (error) {
    console.error('初始化工作区失败:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * 获取工作区统计信息
 */
export async function getWorkspaceStats(rootPath: string): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
}> {
  const stats = {
    total: 0,
    byCategory: {} as Record<string, number>,
    byType: {} as Record<string, number>
  };

  try {
    for (const category of STANDARD_CATEGORIES) {
      if (category === '00_Assets') continue;
      
      const categoryPath = `${rootPath}/${category}`;
      try {
        const files = await window.electronAPI.listFiles(categoryPath);
        const productFolders = files.filter(f => 
          f.isDirectory && /^[A-Z]{2}\d{3}_/.test(f.name)
        );
        
        stats.byCategory[category] = productFolders.length;
        stats.total += productFolders.length;
        
        // 统计类型
        for (const folder of productFolders) {
          const typeMatch = folder.name.match(/^([A-Z]{2})\d{3}_/);
          if (typeMatch) {
            const type = typeMatch[1];
            stats.byType[type] = (stats.byType[type] || 0) + 1;
          }
        }
      } catch (error) {
        console.warn(`跳过目录: ${category}`, error);
      }
    }
  } catch (error) {
    console.error('获取工作区统计失败:', error);
  }

  return stats;
}

