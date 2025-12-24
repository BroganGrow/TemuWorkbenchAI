import { useMemo } from 'react';
import { Empty, Typography, Descriptions, Tag, Space } from 'antd';
import { 
  FolderOutlined,
  CalendarOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { CATEGORIES } from './Sidebar';

const { Text } = Typography;

export function ProductInfoWindow() {
  const { products, selectedProduct, activeTabId, tabs } = useAppStore();

  // 获取当前选中的产品数据
  const selectedProductData = useMemo(() => {
    if (activeTabId) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab?.productId) {
        return products.find(p => p.id === activeTab.productId) || null;
      }
    }
    if (selectedProduct) {
      return products.find(p => p.id === selectedProduct) || null;
    }
    return null;
  }, [products, selectedProduct, activeTabId, tabs]);

  if (!selectedProductData) {
    return (
      <div style={{ 
        padding: '24px', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        minHeight: 0
      }}>
        <Empty 
          description="请先选择一个产品"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.key === selectedProductData.category);

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'auto',
      padding: '12px',
      background: 'var(--bg-primary)'
    }}>
      <Descriptions 
        column={1} 
        bordered
        size="small"
        style={{
          background: 'var(--bg-secondary)'
        }}
      >
        <Descriptions.Item 
          label={
            <Space>
              <TagOutlined />
              <span>产品名称</span>
            </Space>
          }
        >
          <Text strong>{selectedProductData.name}</Text>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <TagOutlined />
              <span>产品ID</span>
            </Space>
          }
        >
          <Text code>{selectedProductData.id}</Text>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <TagOutlined />
              <span>产品类型</span>
            </Space>
          }
        >
          <Tag color="blue">{selectedProductData.type}</Tag>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <TagOutlined />
              <span>所属分类</span>
            </Space>
          }
        >
          <Tag color={categoryInfo?.color || 'default'}>
            {categoryInfo?.label || selectedProductData.category}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <CalendarOutlined />
              <span>创建时间</span>
            </Space>
          }
        >
          {new Date(selectedProductData.createdAt).toLocaleString('zh-CN')}
        </Descriptions.Item>

        <Descriptions.Item 
          label={
            <Space>
              <FolderOutlined />
              <span>产品路径</span>
            </Space>
          }
        >
          <Text 
            copyable 
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '12px',
              wordBreak: 'break-all'
            }}
          >
            {selectedProductData.path}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: '16px' }}>
        <Text strong style={{ color: 'var(--text-primary)' }}>
          <FolderOutlined /> 文件夹结构
        </Text>
        <div style={{ 
          marginTop: '8px',
          padding: '8px',
          background: 'var(--bg-secondary)',
          borderRadius: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: '1.8'
          }}>
            <div>📁 {selectedProductData.name}/</div>
            <div style={{ marginLeft: '16px' }}>
              <div>📁 01_Ref_Images/</div>
              <div>📁 02_Ai_Raw/</div>
              <div>📁 03_AI_Handle/</div>
              <div>📁 04_Final_Goods_Images/</div>
              <div>📄 GoodsInfo.md</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

