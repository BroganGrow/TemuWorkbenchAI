import { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { ProductInfoWindow } from './ProductInfoWindow';
import { ProductNotesWindow } from './ProductNotesWindow';
import { ToolWindowsBar } from './ToolWindowsBar';
import type { ToolWindowId } from './ToolWindowsBar';
import './ToolWindowContainer.css';

const TOOL_WINDOW_COMPONENTS: Record<ToolWindowId, React.ComponentType> = {
  'product-info': ProductInfoWindow,
  'product-notes': ProductNotesWindow
};

export function ToolWindowContainer() {
  const { 
    toolWindowsWidth, 
    activeToolWindowId,
    setToolWindowsWidth,
    toggleToolWindow
  } = useAppStore();

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // 调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // 计算从视口右侧到鼠标位置的距离，减去工具栏宽度（32px）
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

  // 获取当前活动的工具窗口组件
  const ActiveWindowComponent = activeToolWindowId 
    ? TOOL_WINDOW_COMPONENTS[activeToolWindowId as ToolWindowId]
    : null;

  const toolTitles: Record<ToolWindowId, string> = {
    'product-info': '产品信息',
    'product-notes': '产品备注'
  };

  return (
    <div
      ref={containerRef}
      className="tool-window-container"
      style={{
        width: activeToolWindowId ? `${toolWindowsWidth + 32}px` : '32px',
        height: '100%',
        borderLeft: '1px solid var(--border-color)',
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--bg-secondary)',
        transition: activeToolWindowId ? 'width 0.2s' : 'none' // 只在打开窗口时过渡，关闭时立即
      }}
    >
      {/* 左侧工具窗口区域 - 从右侧向左展开 */}
      {activeToolWindowId && ActiveWindowComponent && (
        <div style={{
          width: `${toolWindowsWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          flexShrink: 0,
          position: 'relative'
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
                <span>{toolTitles[activeToolWindowId as ToolWindowId]}</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => toggleToolWindow(activeToolWindowId)}
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
              <ActiveWindowComponent />
            </div>
          </div>
        </div>
      )}

      {/* 右侧工具栏 - 固定显示（绝对定位，始终在右侧） */}
      <ToolWindowsBar />

      {/* 拖拽手柄 - 位于工具窗口和主内容区之间（工具窗口的左边缘） */}
      {activeToolWindowId && (
        <div
          ref={handleRef}
          onMouseDown={() => setIsResizing(true)}
          className="tool-window-resize-handle"
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

