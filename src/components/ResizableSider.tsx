import { useState, useRef, useEffect } from 'react';

interface ResizableSiderProps {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
}

export function ResizableSider({ 
  defaultWidth = 280, 
  minWidth = 200, 
  maxWidth = 600,
  children 
}: ResizableSiderProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const siderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX - (siderRef.current?.getBoundingClientRect().left || 0);
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div
      ref={siderRef}
      style={{
        width: `${width}px`,
        height: '100%',
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
        flexShrink: 0
      }}
    >
      {children}
      
      {/* 拖拽手柄 */}
      <div
        onMouseDown={() => setIsResizing(true)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          background: 'transparent',
          zIndex: 10,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fd7a45';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      />
    </div>
  );
}

