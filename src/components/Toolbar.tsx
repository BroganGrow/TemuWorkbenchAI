import { Button, Input, Space, Segmented, Tooltip } from 'antd';
import {
  PlusOutlined,
  ImportOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useState } from 'react';

interface ToolbarProps {
  onNewProduct: () => void;
  onImport: () => void;
}

export function Toolbar({ onNewProduct, onImport }: ToolbarProps) {
  const { viewMode, setViewMode, searchKeyword, setSearchKeyword } = useAppStore();
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #303030',
      background: '#1f1f1f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      {/* 左侧操作按钮 */}
      <Space size="small">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewProduct}
        >
          新建产品
        </Button>
        
        <Button
          icon={<ImportOutlined />}
          onClick={onImport}
        >
          导入文件
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

