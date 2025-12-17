import { Modal, Form, Input, Select, Radio, message } from 'antd';
import { useAppStore } from '../store/appStore';
import { CATEGORIES } from './Sidebar';
import { useState } from 'react';

interface NewProductDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ProductFormValues {
  type: 'ST' | 'CD';
  name: string;
  category: string;
  createSubFolders: boolean;
}

export function NewProductDialog({ open, onClose }: NewProductDialogProps) {
  const { addProduct, rootPath } = useAppStore();
  const [form] = Form.useForm<ProductFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!rootPath) {
        message.warning('请先选择工作目录');
        return;
      }

      // 生成产品ID和路径
      const productId = `${values.type}_${Date.now()}`;
      const productPath = `${rootPath}/${values.category}/${values.type}_${values.name}`;

      // 创建产品节点
      const newProduct = {
        id: productId,
        name: values.name,
        type: values.type,
        category: values.category,
        path: productPath,
        subFolders: {
          ref_images: `${productPath}/01_Ref_Images`,
          ai_raw: `${productPath}/02_Ai_Raw`,
          ai_handle: `${productPath}/03_AI_Handle`,
          final_goods: `${productPath}/04_Final_Goods_Images`
        },
        createdAt: new Date()
      };

      // 如果需要创建子文件夹，调用Electron API
      if (values.createSubFolders) {
        try {
          // 创建产品主文件夹
          await window.electronAPI.createDirectory(productPath);
          
          // 创建标准子文件夹
          await Promise.all([
            window.electronAPI.createDirectory(newProduct.subFolders.ref_images),
            window.electronAPI.createDirectory(newProduct.subFolders.ai_raw),
            window.electronAPI.createDirectory(newProduct.subFolders.ai_handle),
            window.electronAPI.createDirectory(newProduct.subFolders.final_goods)
          ]);
        } catch (error) {
          message.error('创建文件夹失败: ' + (error as Error).message);
          setLoading(false);
          return;
        }
      }

      // 添加到状态
      addProduct(newProduct);
      
      message.success('产品创建成功！');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('创建产品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="新建产品"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={500}
      okText="创建"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'ST',
          category: '01_In_Progress',
          createSubFolders: true
        }}
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="type"
          label="产品类型"
          rules={[{ required: true, message: '请选择产品类型' }]}
        >
          <Radio.Group>
            <Radio value="ST">ST (标准产品)</Radio>
            <Radio value="CD">CD (定制产品)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="name"
          label="产品名称"
          rules={[
            { required: true, message: '请输入产品名称' },
            { min: 2, message: '产品名称至少2个字符' },
            { max: 50, message: '产品名称最多50个字符' }
          ]}
        >
          <Input 
            placeholder="请输入产品名称（支持中文）"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="目标分类"
          rules={[{ required: true, message: '请选择目标分类' }]}
        >
          <Select
            placeholder="选择产品分类"
            options={CATEGORIES.map(cat => ({
              label: cat.label,
              value: cat.key
            }))}
          />
        </Form.Item>

        <Form.Item
          name="createSubFolders"
          label="标准子文件夹"
          tooltip="自动创建以下标准文件夹结构：01_Ref_Images, 02_Ai_Raw, 03_AI_Handle, 04_Final_Goods_Images"
        >
          <Radio.Group>
            <Radio value={true}>自动创建</Radio>
            <Radio value={false}>稍后手动创建</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}

