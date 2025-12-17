import { Button, Input, Space, Segmented, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  SortAscendingOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useState } from 'react';

interface ToolbarProps {
  onNewProduct: () => void;
}

export function Toolbar({ onNewProduct }: ToolbarProps) {
  const { 
    viewMode, 
    setViewMode, 
    searchKeyword, 
    setSearchKeyword,
    goBack,
    goForward,
    canGoBack,
    canGoForward
  } = useAppStore();
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  return (
    <div style={{
      padding: '12px 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexShrink: 0
    }}>
      {/* 左侧操作按钮 */}
      <Space size="small">
        {/* 前进后退按钮 */}
        <Space size={4}>
          <Tooltip title="后退 (Alt + ←)">
            <Button
              icon={<LeftOutlined />}
              disabled={!canGoBack()}
              onClick={goBack}
              style={{ 
                padding: '4px 8px',
                opacity: canGoBack() ? 1 : 0.4
              }}
            />
          </Tooltip>
          
          <Tooltip title="前进 (Alt + →)">
            <Button
              icon={<RightOutlined />}
              disabled={!canGoForward()}
              onClick={goForward}
              style={{ 
                padding: '4px 8px',
                opacity: canGoForward() ? 1 : 0.4
              }}
            />
          </Tooltip>
        </Space>

        {/* 分隔线 */}
        <div style={{ 
          width: '1px', 
          height: '20px', 
          background: 'var(--border-color)',
          margin: '0 4px'
        }} />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewProduct}
        >
          新建产品
        </Button>

        <Tooltip title="排序方式">
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSortBy(prev => prev === 'name' ? 'date' : 'name')}
          >
            {sortBy === 'name' ? '按名称' : '按日期'}
          </Button>
        </Tooltip>
      </Space>

      {/* 中间搜索框 */}
      <Input
        placeholder="搜索产品..."
        prefix={<SearchOutlined />}
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        allowClear
        style={{ 
          maxWidth: '400px',
          flex: 1
        }}
      />

      {/* 右侧视图切换 */}
      <Segmented
        value={viewMode}
        onChange={(value) => setViewMode(value as 'list' | 'grid')}
        options={[
          {
            value: 'list',
            icon: <UnorderedListOutlined />
          },
          {
            value: 'grid',
            icon: <AppstoreOutlined />
          }
        ]}
      />
    </div>
  );
}

