import { useState, useEffect, useMemo } from 'react';
import { Spin, Input, Button, Space, Typography, Empty } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

const { TextArea } = Input;
const { Text } = Typography;

export function ProductNotesWindow() {
  const { products, selectedProduct, activeTabId, tabs } = useAppStore();
  const [goodsInfo, setGoodsInfo] = useState<string>('');
  const [goodsInfoLoading, setGoodsInfoLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

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

  // 加载 GoodsInfo.md
  useEffect(() => {
    const loadGoodsInfo = async () => {
      if (!selectedProductData) {
        setGoodsInfo('');
        return;
      }

      setGoodsInfoLoading(true);
      try {
        const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
        
        if (window.electronAPI?.readFile) {
          const result = await window.electronAPI.readFile(goodsInfoPath);
          if (result.success && result.data) {
            setGoodsInfo(result.data);
          } else {
            setGoodsInfo('');
          }
        }
      } catch (error) {
        console.error('加载产品信息失败:', error);
        setGoodsInfo('');
      } finally {
        setGoodsInfoLoading(false);
      }
    };

    loadGoodsInfo();
  }, [selectedProductData]);

  // 保存 GoodsInfo.md
  const saveGoodsInfo = async (content: string) => {
    if (!selectedProductData) return;

    try {
      const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
      
      if (window.electronAPI?.writeFile) {
        const result = await window.electronAPI.writeFile(goodsInfoPath, content);
        if (result.success) {
          console.log('产品备注已保存');
        }
      }
    } catch (error) {
      console.error('保存产品信息失败:', error);
    }
  };

  // 处理内容变化（防抖保存）
  const handleContentChange = (value: string) => {
    setGoodsInfo(value);
    
    // 清除之前的定时器
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // 设置新的定时器，1秒后自动保存
    const timer = setTimeout(() => {
      saveGoodsInfo(value);
    }, 1000);
    
    setSaveTimer(timer);
  };

  // 手动保存
  const handleSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      setSaveTimer(null);
    }
    saveGoodsInfo(goodsInfo);
    setIsEditing(false);
  };

  // 重新加载
  const handleReload = async () => {
    if (!selectedProductData) return;
    
    setGoodsInfoLoading(true);
    try {
      const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
      
      if (window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(goodsInfoPath);
        if (result.success && result.data) {
          setGoodsInfo(result.data);
        } else {
          setGoodsInfo('');
        }
      }
    } catch (error) {
      console.error('重新加载产品信息失败:', error);
    } finally {
      setGoodsInfoLoading(false);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [saveTimer]);

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
      background: 'var(--bg-primary)',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* 工具栏 */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          <Text strong style={{ color: 'var(--text-primary)' }}>
            {selectedProductData.name}
          </Text>
        </div>
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReload}
            disabled={goodsInfoLoading}
            title="重新加载"
          />
          {isEditing ? (
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={handleSave}
              title="保存"
            >
              保存
            </Button>
          ) : (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
              title="编辑"
            >
              编辑
            </Button>
          )}
        </Space>
      </div>

      {/* 内容区域 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '12px'
      }}>
        <Spin spinning={goodsInfoLoading}>
          {isEditing ? (
            <TextArea
              value={goodsInfo}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="输入产品备注..."
              autoSize={{ minRows: 10, maxRows: 30 }}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '13px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
              onFocus={() => setIsEditing(true)}
            />
          ) : (
            <div style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              minHeight: '200px',
              padding: '8px',
              background: 'var(--bg-secondary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              cursor: 'text'
            }}
            onClick={() => setIsEditing(true)}
            >
              {goodsInfo || <Text type="secondary">点击编辑产品备注...</Text>}
            </div>
          )}
        </Spin>
        
        {isEditing && goodsInfo && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            textAlign: 'right'
          }}>
            {goodsInfo.length} 字符 · 输入后 1 秒自动保存
          </div>
        )}
      </div>
    </div>
  );
}

