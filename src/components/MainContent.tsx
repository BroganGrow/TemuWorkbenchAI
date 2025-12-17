import { Empty, Card, Tag, Tooltip, Button } from 'antd';
import {
  FileImageOutlined,
  FolderOpenOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useMemo } from 'react';

export function MainContent() {
  const { 
    selectedProduct, 
    selectedFolder,
    products,
    viewMode
  } = useAppStore();

  const selectedProductData = useMemo(() => {
    return products.find(p => p.id === selectedProduct);
  }, [products, selectedProduct]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedProduct) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请从左侧选择一个产品"
          style={{ color: '#8c8c8c' }}
        />
      </div>
    );
  }

  if (!selectedProductData) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Empty
          description="产品不存在"
          style={{ color: '#8c8c8c' }}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* 产品信息卡片 */}
      <Card
        style={{ marginBottom: '24px' }}
        styles={{ body: { background: '#1f1f1f' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tag color={selectedProductData.type === 'ST' ? 'blue' : 'purple'}>
              {selectedProductData.type}
            </Tag>
            <span>{selectedProductData.name}</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} />
            </Tooltip>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpenOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>路径：</span>
            <span style={{ fontSize: '12px' }}>{selectedProductData.path}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>创建时间：</span>
            <span style={{ fontSize: '12px' }}>
              {formatDate(selectedProductData.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* 文件列表/网格 */}
      {selectedFolder ? (
        <Card
          title={`当前文件夹: ${selectedFolder}`}
          styles={{ body: { background: '#1f1f1f' } }}
        >
          <Empty
            image={<FileImageOutlined style={{ fontSize: '64px', color: '#8c8c8c' }} />}
            description="文件夹为空"
            style={{ padding: '48px 0' }}
          >
            <Button type="primary" icon={<FolderOpenOutlined />}>
              打开文件夹
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card
          title="标准文件夹"
          styles={{ body: { background: '#1f1f1f' } }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' 
              ? 'repeat(auto-fill, minmax(200px, 1fr))' 
              : '1fr',
            gap: '16px'
          }}>
            {[
              { key: 'ref_images', label: '01_Ref_Images', icon: '📸', path: selectedProductData.subFolders.ref_images },
              { key: 'ai_raw', label: '02_Ai_Raw', icon: '🤖', path: selectedProductData.subFolders.ai_raw },
              { key: 'ai_handle', label: '03_AI_Handle', icon: '✨', path: selectedProductData.subFolders.ai_handle },
              { key: 'final_goods', label: '04_Final_Goods_Images', icon: '⭐', path: selectedProductData.subFolders.final_goods }
            ].map(folder => (
              <Card
                key={folder.key}
                hoverable
                size="small"
                style={{ 
                  cursor: 'pointer',
                  background: '#141414'
                }}
                styles={{ body: { padding: '16px' } }}
                onClick={() => {}}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{folder.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{folder.label}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {folder.path}
                    </div>
                  </div>
                  <FolderOpenOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

