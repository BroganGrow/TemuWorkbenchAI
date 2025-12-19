import { Segmented, Space, Divider } from 'antd';
import {
  UnorderedListOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

export function StatusBar() {
  const { 
    viewMode, 
    setViewMode,
    products,
    selectedProduct,
    selectedFileCount
  } = useAppStore();

  // 计算状态信息
  const productCount = products.length;
  const selectedProductName = selectedProduct ? selectedProduct.split(/[/\\]/).pop() : '';

  return (
    <div style={{
      height: '28px',
      minHeight: '28px',
      maxHeight: '28px',
      padding: '0 12px',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      flexShrink: 0,
      userSelect: 'none',
      fontFamily: 'var(--font-family-mono, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace)',
      lineHeight: '28px',
      boxSizing: 'border-box'
    }}>
      {/* 左侧状态信息 */}
      <Space size="small" style={{ fontSize: '12px', lineHeight: '28px' }}>
        {selectedProductName && (
          <>
            <span style={{ lineHeight: '28px' }}>{selectedProductName}</span>
            {productCount > 0 && (
              <>
                <Divider type="vertical" style={{ margin: '0 8px', borderColor: 'var(--border-color)', height: '20px', top: '4px' }} />
                <span style={{ lineHeight: '28px' }}>{productCount} 个产品</span>
              </>
            )}
          </>
        )}
        {!selectedProductName && productCount > 0 && (
          <span style={{ lineHeight: '28px' }}>{productCount} 个产品</span>
        )}
        {selectedFileCount > 0 && (
          <>
            <Divider type="vertical" style={{ margin: '0 8px', borderColor: 'var(--border-color)', height: '20px', top: '4px' }} />
            <span style={{ lineHeight: '28px', color: 'var(--primary-color)' }}>已选中 {selectedFileCount} 个文件</span>
          </>
        )}
      </Space>

      {/* 右侧视图切换 */}
      <Segmented
        value={viewMode}
        onChange={(value) => setViewMode(value as 'list' | 'grid')}
        size="small"
        options={[
          {
            value: 'list',
            icon: <UnorderedListOutlined style={{ fontSize: '12px' }} />
          },
          {
            value: 'grid',
            icon: <AppstoreOutlined style={{ fontSize: '12px' }} />
          }
        ]}
        style={{
          height: '24px',
          lineHeight: '24px',
          fontSize: '12px'
        }}
      />
    </div>
  );
}

