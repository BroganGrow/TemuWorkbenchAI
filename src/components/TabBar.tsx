import { useAppStore } from '../store/appStore';
import { CloseOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, closeAllTabs, closeOtherTabs } = useAppStore();

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
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        
        return (
          <Dropdown
            key={tab.id}
            menu={handleContextMenu(tab.id)}
            trigger={['contextMenu']}
          >
            <div
              className="tab-item"
              data-active={isActive}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px 0 12px',
                gap: '6px',
                cursor: 'pointer',
                minWidth: '100px',
                maxWidth: '180px',
                flexShrink: 0
              }}
              onClick={() => setActiveTab(tab.id)}
              onMouseDown={(e) => {
                // 中键点击关闭标签页
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
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
                  transition: 'color 0.15s ease'
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
                  closeTab(tab.id);
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
      })}
    </div>
  );
}

