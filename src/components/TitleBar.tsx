import { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { 
  MinusOutlined, 
  BorderOutlined, 
  CloseOutlined,
  FolderOpenOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { ThemeToggle } from './ThemeToggle';

interface TitleBarProps {
  rootPath: string;
  appVersion: string;
  onOpenFolder: () => void;
  onCloseFolder: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ 
  rootPath, 
  appVersion,
  onOpenFolder,
  onCloseFolder 
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // 检查初始最大化状态
    if (window.electronAPI?.windowIsMaximized) {
      window.electronAPI.windowIsMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <div style={{
      height: '32px',
      background: '#1f1f1f',
      borderBottom: '1px solid #303030',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      WebkitAppRegion: 'drag', // 使标题栏可拖动
      userSelect: 'none'
    }}>
      {/* 左侧：Logo + 菜单 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        WebkitAppRegion: 'no-drag' // 菜单区域不可拖动
      }}>
        {/* Logo */}
        <div style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px',
          marginLeft: '8px'
        }}>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            style={{ 
              width: '24px', 
              height: '24px',
              display: 'block'
            }} 
          />
        </div>
        
        {/* 菜单 */}
        <Menu
          mode="horizontal"
          items={[
            { 
              key: 'file', 
              label: '文件',
              children: [
                {
                  key: 'open-folder',
                  label: '打开文件夹',
                  icon: <FolderOpenOutlined />,
                  onClick: onOpenFolder
                },
                {
                  key: 'close-folder',
                  label: '关闭文件夹',
                  disabled: !rootPath,
                  onClick: onCloseFolder
                },
                { type: 'divider' },
                {
                  key: 'current-folder',
                  label: rootPath ? (
                    <div style={{ 
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#8c8c8c',
                      fontSize: '12px'
                    }}>
                      当前: {rootPath}
                    </div>
                  ) : '未打开文件夹',
                  disabled: true
                }
              ]
            },
            { key: 'edit', label: '编辑' },
            { key: 'view', label: '查看' },
            { key: 'help', label: '帮助' }
          ]}
          style={{ 
            background: 'transparent',
            border: 'none',
            lineHeight: '32px',
            minWidth: 0,
            flex: 'none'
          }}
        />
      </div>

      {/* 右侧控制按钮 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        height: '100%',
        WebkitAppRegion: 'no-drag' // 控制按钮区域不可拖动
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginRight: '12px'
        }}>
          <ThemeToggle />
          <span style={{ fontSize: '11px', color: '#8c8c8c' }}>v{appVersion}</span>
        </div>

        {/* 窗口控制按钮 */}
        <div style={{ 
          display: 'flex', 
          height: '100%'
        }}>
          <button
            onClick={handleMinimize}
            style={{
              width: '46px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <MinusOutlined style={{ fontSize: '12px' }} />
          </button>
          
          <button
            onClick={handleMaximize}
            style={{
              width: '46px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <BorderOutlined style={{ fontSize: '10px' }} />
          </button>
          
          <button
            onClick={handleClose}
            style={{
              width: '46px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e81123'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <CloseOutlined style={{ fontSize: '12px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

