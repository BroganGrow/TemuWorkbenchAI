import { Modal, Form, Input, Select, Radio, Space, message } from 'antd';
import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';

interface NewProductDialogProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ProductFormData {
  type: string;           // 产品类型缩写，如 CD、ST
  hasOrigin: 'HasOrigin' | 'NoOrigin';  // 是否有源文件
  spec: string;           // 规格，如 6pcs
  titleEn: string;        // 英文标题
  titleCn: string;        // 中文标题
}

// 预定义的产品类型
const PRESET_TYPES = [
  { value: 'CD', label: 'CD - 卡片' },
  { value: 'ST', label: 'ST - 贴纸' },
];

export function NewProductDialog({ open, onCancel, onSuccess }: NewProductDialogProps) {
  const [form] = Form.useForm<ProductFormData>();
  const [loading, setLoading] = useState(false);
  const [customType, setCustomType] = useState('');
  const [useCustomType, setUseCustomType] = useState(false);
  const { currentCategory, rootPath } = useAppStore();

  useEffect(() => {
    if (open) {
      form.resetFields();
      setUseCustomType(false);
      setCustomType('');
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 获取实际使用的类型
      const productType = useCustomType ? customType : values.type;
      
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
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'CD',
          hasOrigin: 'NoOrigin',
        }}
      >
        <Form.Item
          label="产品类型"
          required
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Group
              value={useCustomType ? 'custom' : 'preset'}
              onChange={(e) => setUseCustomType(e.target.value === 'custom')}
            >
              <Radio value="preset">使用预设类型</Radio>
              <Radio value="custom">自定义类型</Radio>
            </Radio.Group>

            {!useCustomType ? (
              <Form.Item
                name="type"
                noStyle
                rules={[{ required: !useCustomType, message: '请选择产品类型' }]}
              >
                <Select
                  placeholder="选择产品类型"
                  options={PRESET_TYPES}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            ) : (
              <Input
                placeholder="输入自定义类型缩写（如：BK-书签）"
                value={customType}
                onChange={(e) => setCustomType(e.target.value.toUpperCase())}
                maxLength={10}
                style={{ width: '100%' }}
              />
            )}
          </Space>
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
          label="英文标题"
          name="titleEn"
          rules={[
            { required: true, message: '请输入英文标题' },
            { pattern: /^[a-zA-Z0-9_\-\s]+$/, message: '只能包含字母、数字、空格、下划线和中划线' }
          ]}
        >
          <Input placeholder="例如：Candle" maxLength={50} />
        </Form.Item>

        <Form.Item
          label="中文标题"
          name="titleCn"
          rules={[
            { required: true, message: '请输入中文标题' },
            { max: 30, message: '中文标题不能超过30个字符' }
          ]}
        >
          <Input placeholder="例如：蜡烛贴纸" maxLength={30} />
        </Form.Item>
      </Form>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div><strong>预览示例：</strong></div>
        <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
          CD001_20251217_NoOrigin_6pcs_Candle_蜡烛贴纸
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
