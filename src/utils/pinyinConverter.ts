import { pinyin } from 'pinyin-pro';

/**
 * 将中文字符串转换为拼音（驼峰命名格式）
 * @param text 中文文本
 * @returns 拼音字符串（每个字首字母大写）
 */
export function chineseToPinyin(text: string): string {
  if (!text) return '';
  
  // 使用 pinyin-pro 转换，获取不带声调的拼音数组
  const pinyinArray = pinyin(text, {
    toneType: 'none',  // 不带声调
    type: 'array',     // 返回数组格式
    nonZh: 'consecutive', // 非中文字符连续输出
  });
  
  // 转换为驼峰命名：每个拼音首字母大写
  const result = pinyinArray
    .map(word => {
      // 处理非中文字符（如数字、字母）
      if (/^[a-zA-Z0-9]+$/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // 处理拼音
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
  
  return result || 'Title';
}

/**
 * 将中文字符串转换为拼音首字母
 * @param text 中文文本
 * @returns 拼音首字母字符串
 */
export function chineseToFirstLetter(text: string): string {
  if (!text) return '';
  
  return pinyin(text, {
    pattern: 'first',  // 只返回首字母
    toneType: 'none',
    type: 'array',
  }).join('').toUpperCase();
}

/**
 * 检测文本是否包含中文字符
 * @param text 文本
 * @returns 是否包含中文
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}
