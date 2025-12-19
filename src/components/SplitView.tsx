import { useState } from 'react';
import { useAppStore, SplitNode, TabItem } from '../store/appStore';
import { MainContent } from './MainContent';
import { CloseOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// 拆分面板容器组件
export function SplitView() {
  const { splitLayout, splitPanels } = useAppStore();

  // 如果没有拆分布局，返回 null（使用默认的单面板模式）
  if (!splitLayout || splitPanels.length === 0) {
    return null;
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <SplitNodeRenderer node={splitLayout} />
    </div>
  );
}

// 递归渲染拆分节点
interface SplitNodeRendererProps {
  node: SplitNode;
}

function SplitNodeRenderer({ node }: SplitNodeRendererProps) {
  if (node.type === 'panel' && node.panelId) {
    return <PanelView panelId={node.panelId} />;
  }

  if (node.type === 'split' && node.children && node.sizes) {
    const isHorizontal = node.direction === 'horizontal';
    const [size1, size2] = node.sizes;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            [isHorizontal ? 'width' : 'height']: `${size1}%`,
            display: 'flex',
            overflow: 'hidden',
            borderRight: isHorizontal ? '1px solid var(--border-color)' : 'none',
            borderBottom: !isHorizontal ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <SplitNodeRenderer node={node.children[0]} />
        </div>
        <div
          style={{
            [isHorizontal ? 'width' : 'height']: `${size2}%`,
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          <SplitNodeRenderer node={node.children[1]} />
        </div>
      </div>
    );
  }

  return null;
}

// 单个面板视图
interface PanelViewProps {
  panelId: string;
}

function PanelView({ panelId }: PanelViewProps) {
  const { splitPanels, activePanelId, setActivePanelId, closeTabInPanel, setActiveTabInPanel } = useAppStore();
  const panel = splitPanels.find(p => p.id === panelId);
  const [isDragging, setIsDragging] = useState(false);

  if (!panel) {
    return <div>Panel not found</div>;
  }

  const isActivePanel = activePanelId === panelId;

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    const oldIndex = panel.tabs.findIndex(tab => tab.id === active.id);
    const newIndex = panel.tabs.findIndex(tab => tab.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // 重新排序面板内的标签页
      const newTabs = arrayMove(panel.tabs, oldIndex, newIndex);
      // 更新 store 中的面板
      useAppStore.getState().splitPanels.forEach((p, idx) => {
        if (p.id === panelId) {
          useAppStore.setState((state) => ({
            splitPanels: state.splitPanels.map((panel) =>
              panel.id === panelId ? { ...panel, tabs: newTabs } : panel
            )
          }));
        }
      });
    }
  };

  // 右键菜单
  const handleContextMenu = (tabId: string): MenuProps => ({
    items: [
      {
        key: 'close',
        label: '关闭',
        onClick: () => closeTabInPanel(panelId, tabId)
      },
      {
        key: 'close-others',
        label: '关闭其他标签页',
        disabled: panel.tabs.length === 1,
        onClick: () => {
          const otherTabs = panel.tabs.filter(t => t.id !== tabId);
          otherTabs.forEach(t => closeTabInPanel(panelId, t.id));
        }
      },
      {
        type: 'divider'
      },
      {
        key: 'close-right',
        label: '关闭右侧标签页',
        disabled: panel.tabs.findIndex(t => t.id === tabId) === panel.tabs.length - 1,
        onClick: () => {
          const currentIndex = panel.tabs.findIndex(t => t.id === tabId);
          const tabsToClose = panel.tabs.slice(currentIndex + 1);
          tabsToClose.forEach(t => closeTabInPanel(panelId, t.id));
        }
      },
      {
        key: 'close-all',
        label: '关闭所有标签页',
        onClick: () => {
          panel.tabs.forEach(t => closeTabInPanel(panelId, t.id));
        }
      }
    ]
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        border: isActivePanel ? '2px solid var(--primary-color)' : '2px solid transparent',
        transition: 'border-color 0.2s'
      }}
      onClick={() => {
        if (!isActivePanel) {
          setActivePanelId(panelId);
        }
      }}
    >
      {/* 面板标签栏 */}
      <div
        style={{
          height: '36px',
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          overflowY: 'hidden',
          flexShrink: 0,
          userSelect: 'none'
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
            items={panel.tabs.map(t => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {panel.tabs.map((tab) => (
              <SortableTabItem
                key={tab.id}
                tab={tab}
                panelId={panelId}
                isActive={tab.id === panel.activeTabId}
                isDragging={isDragging}
                onSelect={() => setActiveTabInPanel(panelId, tab.id)}
                onClose={() => closeTabInPanel(panelId, tab.id)}
                onContextMenu={handleContextMenu(tab.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* 面板内容 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MainContent panelId={panelId} />
      </div>
    </div>
  );
}

// 可排序的标签项组件
interface SortableTabItemProps {
  tab: TabItem;
  panelId: string;
  isActive: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu: MenuProps;
}

function SortableTabItem({ tab, panelId, isActive, isDragging: globalDragging, onSelect, onClose, onContextMenu }: SortableTabItemProps) {
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
    zIndex: isDragging ? 1000 : 1,
    background: isActive ? 'var(--bg-active)' : 'transparent',
    borderRight: '1px solid var(--border-color)'
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
            pointerEvents: 'none'
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

