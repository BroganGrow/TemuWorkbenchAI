import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { CloseOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TabItem } from '../store/appStore';

// 限制拖拽在标签栏容器内，且只能水平移动
const restrictToTabBar: Modifier = ({
  containerNodeRect,
  draggingNodeRect,
  transform
}) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return transform;
  }

  const draggingNodeRectLeft = draggingNodeRect.left + transform.x;
  const draggingNodeRectRight = draggingNodeRectLeft + draggingNodeRect.width;
  
  let x = transform.x;
  let y = 0; // 强制 y 轴为 0，只允许水平移动

  // 限制左边界
  if (draggingNodeRectLeft < containerNodeRect.left) {
    x += containerNodeRect.left - draggingNodeRectLeft;
  }
  // 限制右边界
  else if (draggingNodeRectRight > containerNodeRect.right) {
    x += containerNodeRect.right - draggingNodeRectRight;
  }

  return {
    ...transform,
    x,
    y
  };
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, closeAllTabs, closeOtherTabs, reorderTabs } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动8px后才开始拖拽，避免与点击冲突
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽开始
  const handleDragStart = (_event: DragStartEvent) => {
    setIsDragging(true);
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tabs.findIndex(tab => tab.id === active.id);
    const newIndex = tabs.findIndex(tab => tab.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTabs(oldIndex, newIndex);
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  const handleContextMenu = (tabId: string): MenuProps => ({
    items: [
      {
        key: 'close',
        label: '关闭',
        onClick: () => closeTab(tabId)
      },
      {
        key: 'close-others',
        label: '关闭其他标签页',
        disabled: tabs.length === 1,
        onClick: () => closeOtherTabs(tabId)
      },
      {
        type: 'divider'
      },
      {
        key: 'close-right',
        label: '关闭右侧标签页',
        disabled: tabs.findIndex(t => t.id === tabId) === tabs.length - 1,
        onClick: () => {
          const currentIndex = tabs.findIndex(t => t.id === tabId);
          const tabsToClose = tabs.slice(currentIndex + 1);
          tabsToClose.forEach(t => closeTab(t.id));
        }
      },
      {
        key: 'close-all',
        label: '关闭所有标签页',
        onClick: () => closeAllTabs()
      }
    ]
  });

  return (
    <div
      ref={tabBarRef}
      style={{
        height: '36px',
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
        position: 'relative'
      }}
      className="tab-bar"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToTabBar]}
      >
        <SortableContext
          items={tabs.map(t => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {tabs.map((tab) => (
            <SortableTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isDragging={isDragging}
              onSelect={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              onContextMenu={handleContextMenu(tab.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// 可排序的标签项组件
interface SortableTabItemProps {
  tab: TabItem;
  isActive: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu: MenuProps;
}

function SortableTabItem({ tab, isActive, isDragging: globalDragging, onSelect, onClose, onContextMenu }: SortableTabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tab.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer',
    position: 'relative' as const,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 0 12px',
    gap: '6px',
    minWidth: '100px',
    maxWidth: '180px',
    flexShrink: 0,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <Dropdown
      menu={onContextMenu}
      trigger={['contextMenu']}
    >
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="tab-item"
        data-active={isActive}
        data-dragging={isDragging}
        onClick={() => {
          // 如果正在拖拽，不触发选择
          if (!isDragging && !globalDragging) {
            onSelect();
          }
        }}
        onMouseDown={(e) => {
          // 中键点击关闭标签页
          if (e.button === 1) {
            e.preventDefault();
            onClose();
          }
        }}
      >
        {/* 文件名 */}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: isActive ? 500 : 400,
            transition: 'color 0.15s ease',
            pointerEvents: 'none' // 防止文字选择干扰拖拽
          }}
          title={tab.productName}
        >
          {tab.productName}
        </span>
        
        {/* 关闭按钮 - 始终显示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '3px',
            flexShrink: 0,
            transition: 'background 0.15s ease'
          }}
          className="tab-close-button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <CloseOutlined
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)'
            }}
          />
        </div>
        
        {/* 活动标签页底部指示条 */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'var(--primary-color)',
              borderRadius: '2px 2px 0 0'
            }}
          />
        )}
      </div>
    </Dropdown>
  );
}

