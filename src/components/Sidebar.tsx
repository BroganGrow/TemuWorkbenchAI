import { Menu, message } from 'antd';
import { useState } from 'react';
import {
  InboxOutlined,
  ThunderboltOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

export const CATEGORIES = [
  { key: 'Dashboard', label: '控制台', icon: DashboardOutlined, color: '#1890ff' },
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
    toggleSidebar,
    theme,
    rootPath,
    triggerRefresh
  } = useAppStore();

  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const isDark = theme !== 'eye-care' && theme !== 'reading' && theme !== 'paper' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const handleMoveProduct = async (productId: string, targetCategory: string) => {
    // 1. 获取产品信息
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 2. 检查是否已经在目标分类
    if (product.category === targetCategory) return;

    try {
      // 3. 构建新路径
      const oldPath = product.path;
      // 假设路径最后一部分是文件夹名
      const folderName = oldPath.split(/[\\/]/).pop();
      if (!folderName) return;

      if (!rootPath) {
        message.error('根目录未设置');
        return;
      }

      // 构建目标路径：rootPath/targetCategory/folderName
      // 注意：需要处理路径分隔符，这里简单处理，Electron端 fs-extra 会处理
      const newPath = `${rootPath}/${targetCategory}/${folderName}`;

      // 4. 调用 Electron API 移动文件夹
      if (window.electronAPI?.movePath) {
        const result = await window.electronAPI.movePath(oldPath, newPath);
        if (result.success) {
          message.success('移动成功');
          // 5. 触发刷新
          triggerRefresh();
        } else {
          message.error(`移动失败: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('移动产品失败:', error);
      message.error('移动失败');
    }
  };

  const getProductCount = (categoryKey: string) => {
    return products.filter(p => p.category === categoryKey).length;
  };

  // 分离控制台、公共素材库和其他分类
  const dashboardCategory = CATEGORIES[0]; // 控制台
  const assetsCategory = CATEGORIES[1]; // 公共素材库
  const workflowCategories = CATEGORIES.slice(2); // 其他工作流分类

  const createMenuItem = (cat: typeof CATEGORIES[0]) => {
    // 控制台不需要显示数量
    if (cat.key === 'Dashboard') {
      const isSelected = currentCategory === cat.key;
      return {
        key: cat.key,
        icon: <cat.icon style={{ 
          fontSize: '16px', 
          color: isSelected ? cat.color : '#8c8c8c',
          transition: 'color 0.3s'
        }} />,
        label: (
          <span style={{
            color: isSelected ? (isDark ? '#fff' : 'var(--primary-color)') : 'var(--text-primary)',
            fontWeight: isSelected ? 500 : 400
          }}>
            {cat.label}
          </span>
        )
      };
    }

    const count = getProductCount(cat.key);
    const isSelected = currentCategory === cat.key;
    const isWorkflow = workflowCategories.some(c => c.key === cat.key);
    const isDragOver = dragOverKey === cat.key;
    
    return {
      key: cat.key,
      icon: <cat.icon style={{ 
        fontSize: '16px', 
        color: isSelected ? cat.color : '#8c8c8c',
        transition: 'color 0.3s'
      }} />,
      label: (
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            background: isDragOver ? `${cat.color}20` : 'transparent',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onDragOver={(e) => {
            if (isWorkflow) {
              e.preventDefault(); // 允许放置
              setDragOverKey(cat.key);
            }
          }}
          onDragLeave={() => setDragOverKey(null)}
          onDrop={(e) => {
            if (isWorkflow) {
              e.preventDefault();
              setDragOverKey(null);
              const productId = e.dataTransfer.getData('productId');
              if (productId) {
                handleMoveProduct(productId, cat.key);
              }
            }
          }}
        >
          <span style={{
            color: isSelected ? (isDark ? '#fff' : 'var(--primary-color)') : 'var(--text-primary)',
            fontWeight: isSelected ? 500 : 400
          }}>
            {cat.label}
          </span>
          {!sidebarCollapsed && (
            <span style={{ 
              fontSize: '12px', 
              color: isSelected ? cat.color : 'var(--text-secondary)',
              background: isSelected ? `${cat.color}20` : 'var(--bg-hover)',
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
  };

  const dashboardMenuItem = [createMenuItem(dashboardCategory)];
  const assetsMenuItem = [createMenuItem(assetsCategory)];
  const workflowMenuItems = workflowCategories.map(createMenuItem);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      {/* 侧边栏头部 */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {!sidebarCollapsed && (
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            分类目录
          </span>
        )}
        <div
          onClick={toggleSidebar}
          style={{ 
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      {/* 菜单容器 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* 控制台 */}
        <Menu
          mode="inline"
          selectedKeys={[currentCategory]}
          items={dashboardMenuItem}
          onClick={({ key }) => setCurrentCategory(key)}
          inlineCollapsed={sidebarCollapsed}
          style={{
            background: 'transparent',
            border: 'none',
            paddingTop: '8px',
            paddingBottom: '8px'
          }}
          theme={isDark ? "dark" : "light"}
          className={!isDark ? 'ant-layout-sider-light' : ''}
        />

        {/* 分隔线 */}
        <div style={{
          height: '1px',
          margin: sidebarCollapsed ? '0 12px 8px' : '0 16px 8px',
          background: 'var(--border-color)',
          flexShrink: 0
        }} />

        {/* 公共素材库 */}
        <Menu
          mode="inline"
          selectedKeys={[currentCategory]}
          items={assetsMenuItem}
          onClick={({ key }) => setCurrentCategory(key)}
          inlineCollapsed={sidebarCollapsed}
          style={{
            background: 'transparent',
            border: 'none',
            paddingBottom: '8px'
          }}
          theme={isDark ? "dark" : "light"}
          className={!isDark ? 'ant-layout-sider-light' : ''}
        />

        {/* 分隔线 */}
        <div style={{
          height: '1px',
          margin: sidebarCollapsed ? '8px 12px' : '8px 16px',
          background: 'var(--border-color)',
          flexShrink: 0
        }} />

        {/* 工作流分类 */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '8px 16px 4px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            工作流
          </div>
        )}
        
        <Menu
          mode="inline"
          selectedKeys={[currentCategory]}
          items={workflowMenuItems}
          onClick={({ key }) => setCurrentCategory(key)}
          inlineCollapsed={sidebarCollapsed}
          style={{
            background: 'transparent',
            border: 'none',
            flex: 1
          }}
          theme={isDark ? "dark" : "light"}
          className={!isDark ? 'ant-layout-sider-light' : ''}
        />
      </div>

      {/* 侧边栏底部信息 */}
      {!sidebarCollapsed && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <div>总产品数: {products.length}</div>
        </div>
      )}
    </div>
  );
}

