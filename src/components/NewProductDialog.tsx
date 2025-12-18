import { Modal, Form, Input, Select, Radio, Space, message, Spin, Switch } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { LoadingOutlined } from '@ant-design/icons';
import { chineseToPinyin } from '../utils/pinyinConverter';
import { ProductTypeSelector } from './ProductTypeGrid';

interface NewProductDialogProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  type: string;           // 产品类型缩写，如 CD、ST
  hasOrigin: 'HasOrigin' | 'NoOrigin';  // 是否有源文件
  spec: string;           // 规格，如 6pcs
  titleCn: string;        // 中文标题
  titleEn: string;        // 英文标题
  translateMode: 'english' | 'pinyin';  // 翻译模式
}

// 移除 PRESET_TYPES
// const PRESET_TYPES = ...

// 使用谷歌翻译接口翻译中文到英文
async function translateToEnglish(text: string): Promise<string> {
  try {
    // 使用谷歌翻译的非官方API接口
    // 这个接口是免费的，不需要API Key
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('谷歌翻译服务请求失败');
    }
    
    const data = await response.json();
    
    // 谷歌翻译返回的格式: [[[翻译结果, 原文, null, null, 10]], null, "zh-CN"]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      let translated = data[0][0][0];
      
      // 如果有多个翻译片段，合并它们
      if (data[0].length > 1) {
        translated = data[0].map((item: any) => item[0]).join('');
      }
      
      // 清理翻译结果：移除特殊字符，只保留字母、数字和空格
      translated = translated.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      
      // 转换为驼峰命名（首字母大写，去除空格）
      const words = translated.split(/\s+/);
      translated = words
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
      
      return translated || 'Title';
    }
    
    // 如果没有翻译结果，抛出错误以触发降级
    throw new Error('未找到翻译结果');
  } catch (error) {
    console.error('谷歌翻译失败:', error);
    throw error;
  }
}

// 备选方案1：使用 MyMemory Translation API
async function translateToEnglishBackup(text: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|en`
    );
    
    if (!response.ok) {
      throw new Error('MyMemory翻译服务请求失败');
    }
    
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
      let translated = data.responseData.translatedText;
      translated = translated.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      
      const words = translated.split(/\s+/);
      translated = words
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
      
      return translated || 'Title';
    }
    
    throw new Error('未找到翻译结果');
  } catch (error) {
    console.error('MyMemory翻译失败:', error);
    throw error;
  }
}

// 备选方案2：使用 LibreTranslate（如果前两个都失败）
async function translateToEnglishBackup2(text: string): Promise<string> {
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'zh',
        target: 'en',
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error('LibreTranslate服务请求失败');
    }
    
    const data = await response.json();
    
    if (data.translatedText) {
      let translated = data.translatedText;
      translated = translated.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      
      const words = translated.split(/\s+/);
      translated = words
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
      
      return translated || 'Title';
    }
    
    throw new Error('未找到翻译结果');
  } catch (error) {
    console.error('LibreTranslate翻译失败:', error);
    throw error;
  }
}

export function NewProductDialog({ open, onCancel, onSuccess }: NewProductDialogProps) {
  const [form] = Form.useForm<ProductFormData>();
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  // 移除 customType, useCustomType
  const [preview, setPreview] = useState('');
  const [lastChineseTitle, setLastChineseTitle] = useState(''); // 记录上次翻译的中文标题
  const [autoFollow, setAutoFollow] = useState(true); // 是否自动跟随中文标题变化
  const { currentCategory, rootPath } = useAppStore();

  // 更新预览
  const updatePreview = useCallback(() => {
    const values = form.getFieldsValue();
    const productType = values.type || 'CD';
    const hasOrigin = values.hasOrigin || 'NoOrigin';
    const spec = values.spec || '6pcs';
    const titleEn = values.titleEn || 'Title';
    const titleCn = values.titleCn || '标题';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const previewText = `${productType}001_${dateStr}_${hasOrigin}_${spec}_${titleEn}_${titleCn}`;
    setPreview(previewText);
  }, [form]);

  // 只在弹窗打开时初始化
  useEffect(() => {
    if (open) {
      form.resetFields();
      setLastChineseTitle('');
      setAutoFollow(true);
      
      // 延迟设置默认类型
      setTimeout(() => {
        const types = useAppStore.getState().productTypes;
        if (types.length > 0 && !form.getFieldValue('type')) {
          form.setFieldValue('type', types[0].code);
        }
        updatePreview();
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 执行翻译的核心函数
  const performTranslation = async (chineseText: string, forceTranslate: boolean = false) => {
    const translateMode = form.getFieldValue('translateMode') || 'english';
    const currentEnglishTitle = form.getFieldValue('titleEn');

    // 如果开启了自动跟随，直接翻译，不需要确认
    if (autoFollow) {
      await doTranslate(chineseText, translateMode);
      return;
    }

    // 如果关闭了自动跟随，检查是否需要确认覆盖
    if (!forceTranslate && currentEnglishTitle && currentEnglishTitle.trim() !== '' && lastChineseTitle !== chineseText) {
      Modal.confirm({
        title: '确认覆盖',
        content: `英文标题已存在："${currentEnglishTitle}"，是否要根据新的中文标题重新生成？`,
        okText: '重新生成',
        cancelText: '保留原标题',
        centered: true,
        onOk: async () => {
          await doTranslate(chineseText, translateMode);
        },
        onCancel: () => {
          // 用户选择保留，更新中文标题记录
          setLastChineseTitle(chineseText);
        }
      });
      return;
    }

    await doTranslate(chineseText, translateMode);
  };

  // 实际执行翻译的函数
  const doTranslate = async (chineseText: string, translateMode: 'english' | 'pinyin') => {
    if (translateMode === 'pinyin') {
      // 直接转换为拼音
      const pinyin = chineseToPinyin(chineseText);
      form.setFieldsValue({ titleEn: pinyin });
      setLastChineseTitle(chineseText);
      updatePreview();
    } else {
      // 尝试翻译成英文
      setTranslating(true);
      try {
        let english = '';
        let translationSuccess = false;
        
        // 1. 先尝试谷歌翻译
        try {
          console.log('尝试使用谷歌翻译...');
          english = await translateToEnglish(chineseText);
          translationSuccess = true;
          console.log('谷歌翻译成功:', english);
        } catch (error) {
          console.log('谷歌翻译失败，尝试备用API 1');
          
          // 2. 如果谷歌翻译失败，尝试 MyMemory
          try {
            english = await translateToEnglishBackup(chineseText);
            translationSuccess = true;
            console.log('MyMemory翻译成功:', english);
          } catch (error2) {
            console.log('MyMemory翻译失败，尝试备用API 2');
            
            // 3. 如果 MyMemory 也失败，尝试 LibreTranslate
            try {
              english = await translateToEnglishBackup2(chineseText);
              translationSuccess = true;
              console.log('LibreTranslate翻译成功:', english);
            } catch (error3) {
              console.log('所有翻译API都失败');
            }
          }
        }
        
        if (translationSuccess && english) {
          form.setFieldsValue({ titleEn: english });
        } else {
          // 所有翻译API都失败，降级为拼音
          const pinyin = chineseToPinyin(chineseText);
          form.setFieldsValue({ titleEn: pinyin });
          message.warning('翻译服务暂时无法使用，已自动转换为拼音');
        }
        setLastChineseTitle(chineseText);
      } catch (error) {
        // 异常处理，降级为拼音
        const pinyin = chineseToPinyin(chineseText);
        form.setFieldsValue({ titleEn: pinyin });
        setLastChineseTitle(chineseText);
        console.log('翻译异常，已转换为拼音');
      } finally {
        setTranslating(false);
        updatePreview();
      }
    }
  };

  // 处理中文标题失去焦点，触发翻译
  const handleChineseTitleBlur = async () => {
    const chineseText = form.getFieldValue('titleCn')?.trim();
    
    if (!chineseText) {
      form.setFieldsValue({ titleEn: '' });
      updatePreview();
      return;
    }

    // 如果中文标题没有变化，不需要翻译
    if (chineseText === lastChineseTitle) {
      return;
    }

    await performTranslation(chineseText);
  };

  // 处理翻译模式变化，重新生成英文标题
  const handleTranslateModeChange = async (mode: 'english' | 'pinyin') => {
    const chineseText = form.getFieldValue('titleCn')?.trim();
    
    if (!chineseText) {
      return;
    }

    // 切换翻译模式时，强制重新翻译
    await doTranslate(chineseText, mode);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 获取实际使用的类型
      const productType = values.type;
      
      if (!productType) {
        message.error('请选择或输入产品类型');
        return;
      }

      // 调用创建产品文件夹的函数
      const result = await createProductFolder({
        rootPath,
        category: currentCategory,
        type: productType,
        hasOrigin: values.hasOrigin,
        spec: values.spec,
        titleEn: values.titleEn,
        titleCn: values.titleCn,
      });

      if (result.success) {
        message.success(`产品文件夹创建成功: ${result.folderName}`);
        onSuccess();
        onCancel();
      } else {
        message.error(`创建失败: ${result.error}`);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建产品"
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText="创建"
      cancelText="取消"
      centered
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'CD',
          hasOrigin: 'NoOrigin',
          translateMode: 'english',
        }}
        onValuesChange={updatePreview}
      >
        <Form.Item
          name="type"
          label="产品类型"
          required
          rules={[{ required: true, message: '请选择产品类型' }]}
        >
          <ProductTypeSelector />
        </Form.Item>

        <Form.Item
          label="是否有刀模源文件"
          name="hasOrigin"
          rules={[{ required: true, message: '请选择是否有刀模源文件' }]}
        >
          <Radio.Group>
            <Radio value="HasOrigin">有刀模 (HasOrigin)</Radio>
            <Radio value="NoOrigin">无刀模 (NoOrigin)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="产品规格"
          name="spec"
          rules={[
            { required: true, message: '请输入产品规格' },
            { pattern: /^[a-zA-Z0-9_\-]+$/, message: '只能包含字母、数字、下划线和中划线' }
          ]}
          tooltip="例如：6pcs、50pcs、A4size 等"
        >
          <Input placeholder="例如：6pcs" maxLength={20} />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>中文标题</span>
              {translating && <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />}
            </Space>
          }
          name="titleCn"
          rules={[
            { required: true, message: '请输入中文标题' },
            { max: 30, message: '中文标题不能超过30个字符' }
          ]}
          tooltip={
            autoFollow
              ? "输入完成后失去焦点（点击其他区域）将自动更新英文标题"
              : "输入完成后失去焦点时，如英文标题已存在会提示是否覆盖"
          }
        >
          <Input 
            placeholder="例如：蜡烛贴纸" 
            maxLength={30}
            onBlur={handleChineseTitleBlur}
          />
        </Form.Item>

        <Form.Item
          label="翻译模式"
          name="translateMode"
          tooltip="使用谷歌翻译将中文转换为英文，失败时自动尝试备用翻译服务，最终降级为拼音转换"
        >
          <Radio.Group onChange={(e) => handleTranslateModeChange(e.target.value)}>
            <Radio value="english">翻译成英文 (谷歌翻译)</Radio>
            <Radio value="pinyin">转换成拼音</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <span>英文标题</span>
              <Switch 
                checked={autoFollow} 
                onChange={setAutoFollow}
                size="small"
                checkedChildren="跟随"
                unCheckedChildren="手动"
              />
            </Space>
          }
          name="titleEn"
          rules={[
            { required: true, message: '请输入英文标题' },
            { pattern: /^[a-zA-Z0-9_\-\s]+$/, message: '只能包含字母、数字、空格、下划线和中划线' }
          ]}
          tooltip={
            autoFollow 
              ? "自动跟随模式：修改中文标题后会自动更新英文标题，不管英文标题里面有没有内容，也不会弹窗提示" 
              : "手动模式：默认也是会自动生成英文标题的，但是再次修改中文标题时会提示是否覆盖英文标题"
          }
        >
          <Input 
            placeholder="例如：Candle" 
            maxLength={50}
            onChange={(e) => {
              // 用户手动修改英文标题时，记录当前的中文标题
              // 这样可以避免后续相同中文标题触发翻译
              const currentChineseTitle = form.getFieldValue('titleCn');
              if (currentChineseTitle && e.target.value) {
                setLastChineseTitle(currentChineseTitle);
              }
              updatePreview();
            }}
          />
        </Form.Item>
      </Form>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--bg-tertiary)',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div><strong>预览示例：</strong></div>
        <div style={{ 
          marginTop: '8px', 
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          color: '#fd7a45'
        }}>
          {preview}
        </div>
      </div>
    </Modal>
  );
}

// 创建产品文件夹的核心函数
async function createProductFolder(params: {
  rootPath: string;
  category: string;
  type: string;
  hasOrigin: string;
  spec: string;
  titleEn: string;
  titleCn: string;
}): Promise<{ success: boolean; folderName?: string; error?: string }> {
  try {
    const { rootPath, category, type, hasOrigin, spec, titleEn, titleCn } = params;

    if (!rootPath) {
      return { success: false, error: '请先打开工作区文件夹' };
    }

    // 1. 获取当前类型的最大序号（跨所有目录）
    const nextSerial = await getNextSerialNumber(rootPath, type);
    
    // 2. 生成日期字符串 YYYYMMDD
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // 3. 组装文件夹名称
    const folderName = `${type}${nextSerial}_${dateStr}_${hasOrigin}_${spec}_${titleEn}_${titleCn}`;
    
    // 4. 确定目标路径（默认在当前选中的分类下）
    const targetPath = `${rootPath}/${category}/${folderName}`;
    
    // 5. 创建主文件夹
    const createResult = await window.electronAPI.createDirectory(targetPath);
    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }

    // 6. 创建子文件夹
    const subFolders = [
      '01_Ref_Images',
      '02_Ai_Raw',
      '03_AI_Handle',
      '04_Final_Goods_Images'
    ];

    for (const subFolder of subFolders) {
      const subFolderPath = `${targetPath}/${subFolder}`;
      const result = await window.electronAPI.createDirectory(subFolderPath);
      if (!result.success) {
        console.error(`创建子文件夹失败: ${subFolder}`, result.error);
      }
    }

    // 7. 创建 GoodsInfo.md 文件
    const mdContent = `# ${titleCn} (${titleEn})

## 产品信息

- **类型**: ${type}
- **规格**: ${spec}
- **是否有源文件**: ${hasOrigin}
- **创建日期**: ${dateStr}

## 参考链接

- 

## 提示词 (Prompt)

\`\`\`

\`\`\`

## 尺寸规格

- 

## 备注

`;

    const mdPath = `${targetPath}/GoodsInfo.md`;
    await window.electronAPI.writeFile(mdPath, mdContent);

    return { success: true, folderName };
  } catch (error) {
    console.error('创建产品文件夹失败:', error);
    return { success: false, error: (error as Error).message };
  }
}

// 获取下一个序号（全局唯一，跨所有状态目录）
async function getNextSerialNumber(rootPath: string, type: string): Promise<string> {
  try {
    // 所有需要扫描的目录
    const categories = [
      '01_In_Progress',
      '02_Listing',
      '03_Waiting',
      '04_Active',
      '05_Archive'
    ];

    let maxSerial = 0;

    // 扫描所有分类目录
    for (const category of categories) {
      const categoryPath = `${rootPath}/${category}`;
      
      try {
        const files = await window.electronAPI.listFiles(categoryPath);
        
        // 过滤出当前类型的文件夹，并提取序号
        for (const file of files) {
          if (file.isDirectory && file.name.startsWith(type)) {
            // 提取序号：CD001_... -> 001
            const match = file.name.match(new RegExp(`^${type}(\\d+)_`));
            if (match) {
              const serial = parseInt(match[1], 10);
              if (serial > maxSerial) {
                maxSerial = serial;
              }
            }
          }
        }
      } catch (error) {
        // 如果目录不存在，跳过
        console.warn(`跳过目录: ${categoryPath}`, error);
      }
    }

    // 下一个序号
    const nextSerial = maxSerial + 1;
    
    // 格式化为三位数字
    return nextSerial.toString().padStart(3, '0');
  } catch (error) {
    console.error('获取序号失败:', error);
    return '001'; // 默认从 001 开始
  }
}
