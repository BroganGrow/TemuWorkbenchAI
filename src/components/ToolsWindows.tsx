import { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { 
  FileTextOutlined, 
  CloseOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
  FileOutlined
} from '@ant-design/icons';
import { ProductDescriptionWindow } from './ProductDescriptionWindow';
import { ProductStructureWindow } from './ProductStructureWindow';
import { QuickActionsWindow } from './QuickActionsWindow';
import { ProductFilesWindow } from './ProductFilesWindow';
import { useAppStore } from '../store/appStore';
import './ToolsWindows.css';

export type ToolWindowId = 
  | 'product-description' 
  | 'product-structure' 
  | 'quick-actions' 
  | 'product-files'
  | 'terminal' 
  | 'problems' 
  | 'output';

export interface ToolWindow {
  id: ToolWindowId;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export function ToolsWindows() {
  const { 
    toolWindowsWidth, 
    activeToolWindowId,
    setToolWindowsWidth,
    toggleToolWindow
  } = useAppStore();

  const [isResizing, setIsResizing] = useState(false);
  const siderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // 定义所有可用的工具窗口
  const availableWindows: ToolWindow[] = [
    {
      id: 'product-description',
      title: '产品简介',
      icon: <FileTextOutlined />,
      component: <ProductDescriptionWindow />
    },
    {
      id: 'product-structure',
      title: '产品结构',
      icon: <ApartmentOutlined />,
      component: <ProductStructureWindow />
    },
    {
      id: 'quick-actions',
      title: '快速操作',
      icon: <ThunderboltOutlined />,
      component: <QuickActionsWindow />
    },
    {
      id: 'product-files',
      title: '文件列表',
      icon: <FileOutlined />,
      component: <ProductFilesWindow />
    }
  ];

  // 调整宽度 - 必须在条件判断之前调用所有 Hooks
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // 计算从视口右侧到鼠标位置的距离，减去图标栏宽度（32px）
      // 这就是工具窗口的宽度（从右侧向左展开）
      const windowWidth = window.innerWidth;
      const newWidth = windowWidth - e.clientX - 32;
      
      // 确保宽度在合理范围内
      const clampedWidth = Math.max(200, Math.min(800, newWidth));
      
      setToolWindowsWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (handleRef.current) {
        handleRef.current.style.background = 'transparent';
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setToolWindowsWidth]);

  // 获取当前活动的工具窗口
  const activeWindow = availableWindows.find(w => w.id === activeToolWindowId);

  return (
    <div
      ref={siderRef}
      className="tools-windows-container"
      style={{
        width: activeWindow ? `${toolWindowsWidth + 32}px` : '32px',
        height: '100%',
        borderLeft: '1px solid var(--border-color)',
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--bg-secondary)',
        transition: 'width 0.2s'
      }}
    >
      {/* 左侧工具窗口区域 - 从右侧向左展开（互斥，只显示一个） */}
      {activeWindow && (
        <div style={{
          width: `${toolWindowsWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <div
            className="tool-window-panel"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)',
              height: '100%'
            }}
          >
            {/* 工具窗口标题栏 */}
            <div style={{
              padding: '4px 8px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
              flexShrink: 0,
              minHeight: '28px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}>
                {activeWindow.icon}
                <span>{activeWindow.title}</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => toggleToolWindow(activeWindow.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="关闭"
              />
            </div>

            {/* 工具窗口内容 */}
            <div style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              {activeWindow.component}
            </div>
          </div>
        </div>
      )}

      {/* 右侧工具图标栏 - 固定在右侧 */}
      <div className="tools-icons-bar" style={{
        width: '32px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 0',
        background: 'var(--bg-primary)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1
      }}>
        {availableWindows.map(window => {
          const isActive = activeToolWindowId === window.id;
          return (
            <Button
              key={window.id}
              type="text"
              icon={window.icon}
              onClick={() => toggleToolWindow(window.id)}
              title={window.title}
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                margin: '2px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
            />
          );
        })}
      </div>

      {/* 拖拽手柄 - 位于主内容区域和工具窗口之间（工具窗口的左边缘） */}
      {activeWindow && (
        <div
          ref={handleRef}
          onMouseDown={() => setIsResizing(true)}
          className="tools-windows-resize-handle"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            background: 'transparent',
            zIndex: 10,
            transition: 'background 0.2s',
            marginLeft: '-2px' // 让手柄居中在边界上，可以延伸到主内容区域
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = '#fd7a45';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        />
      )}
    </div>
  );
}
