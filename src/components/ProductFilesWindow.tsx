import { useState, useEffect, useMemo } from 'react';
import { Empty, List, Typography, Spin, Tag } from 'antd';
import { 
  FileImageOutlined,
  FileOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

const { Text } = Typography;

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

export function ProductFilesWindow() {
  const { products, selectedProduct, activeTabId, tabs, selectedFolder } = useAppStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  // 获取当前文件夹路径
  const currentFolderPath = useMemo(() => {
    if (!selectedProductData) return null;
    
    if (selectedFolder) {
      // 如果有选中的子文件夹，使用子文件夹路径
      const folderMap: Record<string, string> = {
        'ref_images': selectedProductData.subFolders.ref_images,
        'ai_raw': selectedProductData.subFolders.ai_raw,
        'ai_handle': selectedProductData.subFolders.ai_handle,
        'final_goods': selectedProductData.subFolders.final_goods,
      };
      return folderMap[selectedFolder] || selectedProductData.path;
    }
    
    return selectedProductData.path;
  }, [selectedProductData, selectedFolder]);

  // 加载文件列表
  useEffect(() => {
    const loadFiles = async () => {
      if (!currentFolderPath) {
        setFiles([]);
        return;
      }

      setLoading(true);
      try {
        // 这里需要调用 Electron API 来读取文件夹内容
        // 暂时使用空数组，后续可以实现
        setFiles([]);
      } catch (error) {
        console.error('加载文件列表失败:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [currentFolderPath]);

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
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ 
        padding: '12px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <Text strong style={{ color: 'var(--text-primary)' }}>
          {selectedFolder ? `📁 ${selectedFolder}` : '📁 根目录'}
        </Text>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Spin spinning={loading}>
          {files.length > 0 ? (
            <List
              size="small"
              dataSource={files}
              renderItem={(item) => (
                <List.Item style={{ 
                  padding: '4px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}>
                  <Space>
                    {item.isDirectory ? (
                      <FolderOutlined style={{ color: '#1890ff' }} />
                    ) : item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <FileImageOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <FileOutlined />
                    )}
                    <Text style={{ fontSize: '12px' }}>{item.name}</Text>
                    {item.size && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {(item.size / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              {selectedFolder ? '该文件夹暂无文件' : '请选择一个文件夹查看文件'}
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
}

