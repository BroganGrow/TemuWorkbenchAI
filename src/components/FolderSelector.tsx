import { Button, Tooltip, Space, Typography } from 'antd';
import { FolderOpenOutlined, FolderOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FolderSelectorProps {
  currentPath: string | null;
  onSelect: () => void;
}

/**
 * 文件夹选择器 - 类似Cursor的"打开文件夹"
 */
export function FolderSelector({ currentPath, onSelect }: FolderSelectorProps) {
  const getFolderName = (path: string) => {
    return path.split(/[\\/]/).filter(Boolean).pop() || path;
  };

  return (
    <Tooltip title={currentPath || '打开文件夹'}>
      <Button
        type="text"
        icon={currentPath ? <FolderOpenOutlined /> : <FolderOutlined />}
        onClick={onSelect}
        style={{
          padding: '4px 12px',
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {currentPath ? (
          <Space size={4}>
            <Text
              style={{
                color: '#fff',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {getFolderName(currentPath)}
            </Text>
          </Space>
        ) : (
          <span style={{ color: '#8c8c8c' }}>打开文件夹</span>
        )}
      </Button>
    </Tooltip>
  );
}


