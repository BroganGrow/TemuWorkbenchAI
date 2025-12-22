import { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { 
  MinusOutlined, 
  BorderOutlined, 
  CloseOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  CheckOutlined,
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { Button, Tooltip } from 'antd';

interface TitleBarProps {
  rootPath: string;
  appVersion: string;
  onOpenFolder: () => void;
  onCloseFolder: () => void;
  onRefresh: () => void;
  onOpenAIConfig: () => void;
  onOpenAIPrompt: () => void;
  onOpenSettings: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ 
  rootPath, 
  appVersion,
  onOpenFolder,
  onCloseFolder,
  onRefresh,
  onOpenAIConfig,
  onOpenAIPrompt,
  onOpenSettings
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme, setTheme } = useAppStore();

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
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
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
          selectedKeys={[]}
          items={[
            { 
              key: 'file', 
              label: '文件',
              children: [
                {
                  key: 'new-window',
                  label: '新建窗口（独立）',
                  icon: <PlusOutlined />,
                  title: '创建新窗口，在任务栏中独立显示（不合并）',
                  onClick: async () => {
                    if (window.electronAPI?.createNewWindow) {
                      try {
                        await window.electronAPI.createNewWindow();
                      } catch (error) {
                        console.error('创建新窗口失败:', error);
                      }
                    }
                  }
                },
                {
                  key: 'new-window-merged',
                  label: '新建窗口（合并）',
                  icon: <PlusOutlined />,
                  title: '创建新窗口，在任务栏中合并显示（与其他窗口合并为一个按钮）',
                  onClick: async () => {
                    if (window.electronAPI?.createNewWindowMerged) {
                      try {
                        await window.electronAPI.createNewWindowMerged();
                      } catch (error) {
                        console.error('创建合并窗口失败:', error);
                      }
                    }
                  }
                },
                { type: 'divider' },
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
            color: 'var(--text-secondary)',
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
            { 
              key: 'ai', 
              label: 'AI',
              children: [
                {
                  key: 'model-config',
                  label: '模型配置',
                  onClick: onOpenAIConfig
                },
                {
                  key: 'prompt-config',
                  label: '标题优化规则',
                  onClick: onOpenAIPrompt
                }
              ]
            },
            { 
              key: 'experiment', 
              label: '实验',
              children: [
                {
                  key: 'image-generation',
                  label: 'Nano Banana 图片生成',
                  onClick: () => {
                    // 通过自定义事件触发
                    window.dispatchEvent(new CustomEvent('open-experiment', { detail: { type: 'image-generation' } }));
                  }
                }
              ]
            },
            { 
              key: 'theme', 
              label: '主题',
              children: [
                {
                  key: 'theme-light',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>浅色</span>
                      {theme === 'light' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('light')
                },
                {
                  key: 'theme-dark',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>深色</span>
                      {theme === 'dark' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('dark')
                },
                {
                  key: 'theme-system',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>跟随系统</span>
                      {theme === 'system' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('system')
                },
                {
                  key: 'theme-eye-care',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>护眼</span>
                      {theme === 'eye-care' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('eye-care')
                },
                {
                  key: 'theme-reading',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>阅读</span>
                      {theme === 'reading' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('reading')
                },
                {
                  key: 'theme-paper',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
                      <span>羊皮纸</span>
                      {theme === 'paper' && <CheckOutlined style={{ color: '#fd7a45' }} />}
                    </div>
                  ),
                  onClick: () => setTheme('paper')
                }
              ]
            },
            { 
              key: 'settings', 
              label: '设置',
              children: [
                {
                  key: 'basic-settings',
                  label: '基本',
                  icon: <SettingOutlined />,
                  onClick: onOpenSettings
                }
              ]
            },
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
          <Tooltip title="刷新工作区">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              style={{ 
                color: 'var(--text-secondary)',
                fontSize: '14px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Tooltip>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>v{appVersion}</span>
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
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <MinusOutlined style={{ fontSize: '12px', color: 'var(--text-primary)' }} />
          </button>
          
          <button
            onClick={handleMaximize}
            style={{
              width: '46px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <BorderOutlined style={{ fontSize: '10px', color: 'var(--text-primary)' }} />
          </button>
          
          <button
            onClick={handleClose}
            style={{
              width: '46px',
              height: '100%',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e81123';
              const icon = e.currentTarget.querySelector('.anticon');
              if (icon) (icon as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              const icon = e.currentTarget.querySelector('.anticon');
              if (icon) (icon as HTMLElement).style.color = 'var(--text-primary)';
            }}
          >
            <CloseOutlined style={{ fontSize: '12px', color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

