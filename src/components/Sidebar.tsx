import { Menu } from 'antd';
import {
  InboxOutlined,
  ThunderboltOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

export const CATEGORIES = [
  { key: '00_Assets', label: '公共素材库', icon: InboxOutlined, color: '#8c8c8c' },
  { key: '01_In_Progress', label: '选品中', icon: ThunderboltOutlined, color: '#ff9c5a' },
  { key: '02_Listing', label: '制作中', icon: EditOutlined, color: '#fd7a45' },
  { key: '03_Waiting', label: '待发货', icon: ClockCircleOutlined, color: '#9e7aff' },
  { key: '04_Active', label: '已上架', icon: CheckCircleOutlined, color: '#52c41a' },
  { key: '05_Archive', label: '已下架', icon: FolderOutlined, color: '#595959' }
];

export function Sidebar() {
  const { 
    currentCategory, 
    setCurrentCategory, 
    products,
    sidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const getProductCount = (categoryKey: string) => {
    return products.filter(p => p.category === categoryKey).length;
  };

  const menuItems = CATEGORIES.map(cat => {
    const count = getProductCount(cat.key);
    const isSelected = currentCategory === cat.key;
    
    return {
      key: cat.key,
      icon: <cat.icon style={{ 
        fontSize: '16px', 
        color: isSelected ? cat.color : '#8c8c8c',
        transition: 'color 0.3s'
      }} />,
      label: (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          <span style={{
            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
            fontWeight: isSelected ? 500 : 400
          }}>
            {cat.label}
          </span>
          {!sidebarCollapsed && (
            <span style={{ 
              fontSize: '12px', 
              color: isSelected ? cat.color : '#8c8c8c',
              background: isSelected ? `${cat.color}20` : 'rgba(255, 255, 255, 0.06)',
              padding: '2px 8px',
              borderRadius: '10px',
              minWidth: '24px',
              textAlign: 'center',
              fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.3s'
            }}>
              {count}
            </span>
          )}
        </div>
      )
    };
  });

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#141414',
      borderRight: '1px solid #303030'
    }}>
      {/* 侧边栏头部 */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #303030',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!sidebarCollapsed && (
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: '#fff'
          }}>
            分类目录
          </span>
        )}
        <div
          onClick={toggleSidebar}
          style={{ 
            cursor: 'pointer',
            color: '#8c8c8c',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8c8c8c';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      {/* 菜单 */}
      <Menu
        mode="inline"
        selectedKeys={[currentCategory]}
        items={menuItems}
        onClick={({ key }) => setCurrentCategory(key)}
        inlineCollapsed={sidebarCollapsed}
        style={{
          background: 'transparent',
          border: 'none',
          flex: 1,
          paddingTop: '8px'
        }}
        theme="dark"
      />

      {/* 侧边栏底部信息 */}
      {!sidebarCollapsed && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #303030',
          fontSize: '12px',
          color: '#8c8c8c'
        }}>
          <div>总产品数: {products.length}</div>
        </div>
      )}
    </div>
  );
}

