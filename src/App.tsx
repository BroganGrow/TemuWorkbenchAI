import { useState, useEffect } from 'react';
import { Layout, Menu, Button, message } from 'antd';
import {
  FolderOpenOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Sidebar } from './components/Sidebar';
import { FileTree } from './components/FileTree';
import { Toolbar } from './components/Toolbar';
import { MainContent } from './components/MainContent';
import { NewProductDialog } from './components/NewProductDialog';
import { DropZone } from './components/DropZone';
import { ThemeToggle } from './components/ThemeToggle';
import { useAppStore } from './store/appStore';

const { Header, Sider, Content } = Layout;

type ViewMode = 'workspace' | 'import';

function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const { sidebarCollapsed, rootPath, setRootPath } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);

  useEffect(() => {
    const getAppInfo = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        const path = await window.electronAPI.getAppPath();
        setAppVersion(version);
        if (!rootPath) {
          setRootPath(path);
        }
      } catch (error) {
        console.error('获取应用信息失败:', error);
      }
    };
    getAppInfo();
  }, [rootPath, setRootPath]);

  const handleSelectRootPath = async () => {
    try {
      const folder = await window.electronAPI?.selectFolder?.();
      if (folder) {
        setRootPath(folder);
        message.success('工作目录已设置');
      }
    } catch (error) {
      message.error('选择目录失败');
    }
  };

  const handleImport = () => {
    setViewMode('import');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部菜单栏 */}
      <Header style={{
        background: '#1f1f1f',
        padding: '0 16px',
        borderBottom: '1px solid #303030',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        lineHeight: '48px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 600,
            color: '#fff'
          }}>
            SuperTools
          </div>
          <Menu
            mode="horizontal"
            items={[
              { key: 'file', label: '文件' },
              { key: 'edit', label: '编辑' },
              { key: 'view', label: '查看' },
              { key: 'help', label: '帮助' }
            ]}
            style={{ 
              background: 'transparent',
              border: 'none',
              lineHeight: '48px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>v{appVersion}</span>
        </div>
      </Header>

      <Layout>
        {/* 左侧分类侧边栏 */}
        <Sider
          width={sidebarCollapsed ? 64 : 200}
          theme="dark"
          style={{ background: '#141414' }}
          collapsible={false}
        >
          <Sidebar />
        </Sider>

        {/* 中间文件树区域 */}
        {viewMode === 'workspace' && (
          <Sider
            width={280}
            theme="dark"
            style={{ 
              background: '#1f1f1f',
              borderRight: '1px solid #303030'
            }}
            collapsible={false}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* 工具栏 */}
              <div style={{
                padding: '12px',
                borderBottom: '1px solid #303030',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Button
                  type="text"
                  icon={<FolderOpenOutlined />}
                  onClick={handleSelectRootPath}
                  size="small"
                >
                  {rootPath ? '更改' : '选择目录'}
                </Button>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  size="small"
                  onClick={() => setViewMode('import')}
                />
              </div>
              
              {/* 文件树 */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <FileTree />
              </div>
            </div>
          </Sider>
        )}

        {/* 主内容区 */}
        <Layout style={{ background: '#141414' }}>
          {viewMode === 'workspace' ? (
            <>
              <Toolbar
                onNewProduct={() => setNewProductDialogOpen(true)}
                onImport={handleImport}
              />
              <Content style={{
                background: '#141414',
                overflow: 'auto'
              }}>
                <MainContent />
              </Content>
            </>
          ) : (
            <Content style={{
              background: '#141414',
              overflow: 'auto'
            }}>
              <div style={{ padding: '16px' }}>
                <Button
                  onClick={() => setViewMode('workspace')}
                  style={{ marginBottom: '16px' }}
                >
                  ← 返回工作区
                </Button>
                <DropZone />
              </div>
            </Content>
          )}
        </Layout>
      </Layout>

      {/* 新建产品对话框 */}
      <NewProductDialog
        open={newProductDialogOpen}
        onClose={() => setNewProductDialogOpen(false)}
      />
    </Layout>
  );
}

export default App;

