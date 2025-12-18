import { ProductNode } from '../store/appStore';

/**
 * 从文件系统加载所有产品
 */
export async function loadAllProducts(rootPath: string): Promise<ProductNode[]> {
  const products: ProductNode[] = [];
  
  // 所有需要扫描的分类目录
  const categories = [
    '01_In_Progress',
    '02_Listing',
    '03_Waiting',
    '04_Active',
    '05_Archive'
  ];

  for (const category of categories) {
    const categoryPath = `${rootPath}/${category}`;
    
    try {
      const files = await window.electronAPI.listFiles(categoryPath);
      
      // 过滤出产品文件夹（以类型缩写+数字开头）
      const productFolders = files.filter(f => 
        f.isDirectory && /^[A-Z]{2,3}\d{3}_/.test(f.name)
      );
      
      // 解析每个产品文件夹
      for (const folder of productFolders) {
        try {
          const productData = parseProductFolder(folder.name, categoryPath, category);
          if (productData) {
            products.push(productData);
          }
        } catch (error) {
          console.warn(`解析产品文件夹失败: ${folder.name}`, error);
        }
      }
    } catch (error) {
      console.warn(`跳过目录: ${category}`, error);
    }
  }

  return products;
}

/**
 * 解析产品文件夹名称
 * 格式: CD001_20251217_NoOrigin_6pcs_Candle_蜡烛贴纸
 */
function parseProductFolder(
  folderName: string, 
  categoryPath: string,
  category: string
): ProductNode | null {
  // 使用更灵活的解析方式
  const parts = folderName.split('_');
  
  if (parts.length < 6) {
    console.warn('产品文件夹格式不正确（字段不足）:', folderName);
    return null;
  }

  // 提取各部分
  const typeAndSerial = parts[0]; // CD001, ST001
  const date = parts[1]; // 20251217
  const origin = parts[2]; // HasOrigin/NoOrigin
  const spec = parts[3]; // 6pcs
  const titleEn = parts[4]; // Candle
  const titleCn = parts.slice(5).join('_'); // 蜡烛贴纸（可能包含下划线）

  // 验证类型和序号格式
  const typeMatch = typeAndSerial.match(/^([A-Z]{2,3})(\d{3})$/);
  if (!typeMatch) {
    console.warn('产品文件夹类型格式不正确:', folderName);
    return null;
  }

  const [, type, serial] = typeMatch;
  
  const productPath = `${categoryPath}/${folderName}`;
  
  return {
    id: `${type}${serial}`,
    name: titleCn || titleEn, // 优先使用中文名，如果没有则用英文名
    type: type,
    category,
    path: productPath,
    subFolders: {
      ref_images: `${productPath}/01_Ref_Images`,
      ai_raw: `${productPath}/02_Ai_Raw`,
      ai_handle: `${productPath}/03_AI_Handle`,
      final_goods: `${productPath}/04_Final_Goods_Images`
    },
    createdAt: parseDate(date)
  };
}

/**
 * 解析日期字符串 YYYYMMDD -> Date
 */
function parseDate(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

/**
 * 获取分类下的产品数量
 */
export async function getProductCount(rootPath: string, category: string): Promise<number> {
  try {
    const categoryPath = `${rootPath}/${category}`;
    const files = await window.electronAPI.listFiles(categoryPath);
    const productFolders = files.filter(f => 
      f.isDirectory && /^[A-Z]{2,3}\d{3}_/.test(f.name)
    );
    return productFolders.length;
  } catch (error) {
    return 0;
  }
}

