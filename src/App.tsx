import { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Empty } from 'antd';
import {
  SettingOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { Sidebar } from './components/Sidebar';
import { FileTree } from './components/FileTree';
import { Toolbar } from './components/Toolbar';
import { MainContent } from './components/MainContent';
import { NewProductDialog } from './components/NewProductDialog';
import { WorkspaceInitDialog } from './components/WorkspaceInitDialog';
import { DropZone } from './components/DropZone';
import { ThemeToggle } from './components/ThemeToggle';
import { ResizableSider } from './components/ResizableSider';
import { useAppStore } from './store/appStore';
import { isStandardWorkspace, initWorkspace } from './utils/workspaceInit';
import { loadAllProducts } from './utils/productLoader';

const { Header, Sider, Content } = Layout;

const LAST_FOLDER_KEY = 'super-tools-last-folder';

type ViewMode = 'workspace' | 'import';

function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const { sidebarCollapsed, rootPath, setRootPath, setProducts } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [workspaceInitDialogOpen, setWorkspaceInitDialogOpen] = useState(false);
  const [initWorkspaceLoading, setInitWorkspaceLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.electronAPI) {
          console.error('Electron API 未加载');
          return;
        }

        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);

        // 加载上次打开的文件夹
        const lastFolder = localStorage.getItem(LAST_FOLDER_KEY);
        if (lastFolder && window.electronAPI.checkFileExists) {
          try {
            // 验证文件夹是否仍然存在
            const exists = await window.electronAPI.checkFileExists(lastFolder);
            if (exists.success && exists.exists) {
              setRootPath(lastFolder);
            } else {
              localStorage.removeItem(LAST_FOLDER_KEY);
            }
          } catch (error) {
            console.error('验证文件夹失败:', error);
            localStorage.removeItem(LAST_FOLDER_KEY);
          }
        }
      } catch (error) {
        console.error('初始化失败:', error);
        message.error('初始化失败，请重启应用');
      }
    };
    init();
  }, [setRootPath]);

  // 保存最后打开的文件夹
  useEffect(() => {
    if (rootPath) {
      localStorage.setItem(LAST_FOLDER_KEY, rootPath);
    }
  }, [rootPath]);

  // 加载产品数据
  const loadProducts = async (folderPath: string) => {
    setLoading(true);
    try {
      const products = await loadAllProducts(folderPath);
      console.log('加载产品数量:', products.length);
      setProducts(products);
    } catch (error) {
      console.error('加载产品失败:', error);
      message.error('加载产品数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 当 rootPath 变化时，加载产品
  useEffect(() => {
    if (rootPath) {
      loadProducts(rootPath);
    } else {
      setProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPath]);

  const handleOpenFolder = async () => {
    try {
      console.log('开始选择文件夹...');
      console.log('API 状态:', {
        exists: !!window.electronAPI,
        selectFolder: typeof window.electronAPI?.selectFolder
      });

      if (!window.electronAPI?.selectFolder) {
        message.error('打开文件夹功能不可用');
        console.error('selectFolder API 不存在');
        return;
      }

      const result = await window.electronAPI.selectFolder();
      console.log('selectFolder 返回结果:', result, '类型:', typeof result);

      // 处理可能的返回值格式
      let folder: string | null = null;
      if (typeof result === 'string') {
        folder = result;
      } else if (result && typeof result === 'object' && 'folderPath' in result) {
        folder = (result as any).folderPath;
      }

      console.log('解析后的文件夹路径:', folder);

      if (folder) {
        setRootPath(folder);
        const folderName = folder.split(/[\\/]/).filter(Boolean).pop() || folder;
        message.success(`已打开文件夹: ${folderName}`);
        
        // 检查是否为标准工作区
        const isStandard = await isStandardWorkspace(folder);
        if (!isStandard) {
          // 延迟显示对话框，让用户先看到文件夹打开成功
          setTimeout(() => {
            setWorkspaceInitDialogOpen(true);
          }, 500);
        }
      } else {
        console.log('用户取消选择');
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
      message.error(`打开文件夹失败: ${(error as Error).message || '未知错误'}`);
    }
  };

  const handleImport = () => {
    if (!rootPath) {
      message.warning('请先打开文件夹');
      return;
    }
    setViewMode('import');
  };

  const handleInitWorkspace = async () => {
    if (!rootPath) return;
    
    setInitWorkspaceLoading(true);
    try {
      const result = await initWorkspace(rootPath);
      if (result.success) {
        message.success(`工作区初始化成功！创建了 ${result.created?.length || 0} 个目录`);
        setWorkspaceInitDialogOpen(false);
        // 刷新界面
        window.location.reload();
      } else {
        message.error(`初始化失败: ${result.error}`);
      }
    } catch (error) {
      console.error('初始化工作区失败:', error);
      message.error('初始化失败，请检查文件夹权限');
    } finally {
      setInitWorkspaceLoading(false);
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Menu
            mode="horizontal"
            items={[
              { 
                key: 'file', 
                label: '文件',
                children: [
                  {
                    key: 'open-folder',
                    label: '打开文件夹',
                    icon: <FolderOpenOutlined />,
                    onClick: handleOpenFolder
                  },
                  {
                    key: 'close-folder',
                    label: '关闭文件夹',
                    disabled: !rootPath,
                    onClick: () => {
                      setRootPath('');
                      message.info('已关闭文件夹');
                    }
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
                        color: '#8c8c8c',
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
        {!rootPath ? (
          /* 欢迎页 - 打开文件夹 */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#141414'
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    欢迎使用 SuperTools
                  </div>
                  <div style={{ color: '#8c8c8c', marginBottom: '16px' }}>
                    打开一个文件夹开始使用
                  </div>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                size="large"
                onClick={handleOpenFolder}
              >
                打开文件夹
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            {/* 左侧分类侧边栏 */}
            <Sider
              width={sidebarCollapsed ? 64 : 200}
              theme="dark"
              style={{ background: '#141414' }}
              collapsible={false}
            >
              <Sidebar />
            </Sider>

            {/* 中间文件树区域 - 可调整宽度 */}
            {viewMode === 'workspace' && (
              <ResizableSider defaultWidth={280} minWidth={200} maxWidth={600}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 工具栏 */}
                  <div style={{
                    padding: '12px',
                    borderBottom: '1px solid #303030',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {rootPath}
                    </div>
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
              </ResizableSider>
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
          </>
        )}
      </Layout>

      {/* 新建产品对话框 */}
      <NewProductDialog
        open={newProductDialogOpen}
        onCancel={() => setNewProductDialogOpen(false)}
        onSuccess={() => {
          setNewProductDialogOpen(false);
          // 重新加载产品列表
          if (rootPath) {
            loadProducts(rootPath);
          }
        }}
      />

      {/* 工作区初始化对话框 */}
      <WorkspaceInitDialog
        open={workspaceInitDialogOpen}
        onConfirm={handleInitWorkspace}
        onCancel={() => setWorkspaceInitDialogOpen(false)}
        loading={initWorkspaceLoading}
      />
    </Layout>
  );
}

export default App;

