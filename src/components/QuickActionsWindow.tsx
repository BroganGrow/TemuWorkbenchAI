import { useMemo } from 'react';
import { Empty, Button, Space, Typography, Divider } from 'antd';
import { 
  EditOutlined,
  FolderOpenOutlined,
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

const { Text } = Typography;

export function QuickActionsWindow() {
  const { products, selectedProduct, activeTabId, tabs, rootPath } = useAppStore();

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

  const handleOpenFolder = async () => {
    if (selectedProductData && window.electronAPI?.showInFolder) {
      await window.electronAPI.showInFolder(selectedProductData.path);
    }
  };

  const handleOpenGoodsInfo = async () => {
    if (selectedProductData && window.electronAPI?.openFile) {
      const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
      await window.electronAPI.openFile(goodsInfoPath);
    }
  };

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

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'auto',
      padding: '12px',
      background: 'var(--bg-primary)'
    }}>
      <Text strong style={{ color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}>
        快速操作
      </Text>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button
          type="default"
          block
          icon={<FolderOpenOutlined />}
          onClick={handleOpenFolder}
        >
          在文件管理器中打开
        </Button>

        <Button
          type="default"
          block
          icon={<FileTextOutlined />}
          onClick={handleOpenGoodsInfo}
        >
          编辑 GoodsInfo.md
        </Button>

        <Divider style={{ margin: '8px 0' }} />

        <Text type="secondary" style={{ fontSize: '12px' }}>
          更多操作功能开发中...
        </Text>
      </Space>
    </div>
  );
}

