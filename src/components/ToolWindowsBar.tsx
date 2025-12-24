import { Button } from 'antd';
import { 
  InfoCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import './ToolWindowsBar.css';

export type ToolWindowId = 'product-info' | 'product-notes';

export interface ToolDefinition {
  id: ToolWindowId;
  title: string;
  icon: React.ReactNode;
}

// 定义所有可用的工具
const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    id: 'product-info',
    title: '产品信息',
    icon: <InfoCircleOutlined />
  },
  {
    id: 'product-notes',
    title: '产品备注',
    icon: <FileTextOutlined />
  }
];

export function ToolWindowsBar() {
  const { activeToolWindowId, toggleToolWindow } = useAppStore();

  return (
    <div className="tool-windows-bar" style={{
      width: '32px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4px 0',
      background: 'var(--bg-primary)',
      flexShrink: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 2,
      borderLeft: '1px solid var(--border-color)'
    }}>
      {AVAILABLE_TOOLS.map(tool => {
        const isActive = activeToolWindowId === tool.id;
        return (
          <Button
            key={tool.id}
            type="text"
            icon={tool.icon}
            onClick={() => toggleToolWindow(tool.id)}
            title={tool.title}
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              margin: '2px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? 'var(--bg-tertiary)' : 'transparent',
              color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          />
        );
      })}
    </div>
  );
}

