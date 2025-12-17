import { useState, useEffect, useMemo } from 'react';
import { Layout, Button, message, Empty, ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
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
import { TitleBar } from './components/TitleBar';
import { ResizableSider } from './components/ResizableSider';
import { useAppStore } from './store/appStore';
import { isStandardWorkspace, initWorkspace } from './utils/workspaceInit';
import { loadAllProducts } from './utils/productLoader';
import { useNavigationShortcuts } from './hooks/useNavigationShortcuts';

const { Sider, Content } = Layout;

const LAST_FOLDER_KEY = 'super-tools-last-folder';

type ViewMode = 'workspace' | 'import';

function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const { sidebarCollapsed, rootPath, setRootPath, setProducts, theme, setTheme } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('workspace');
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [workspaceInitDialogOpen, setWorkspaceInitDialogOpen] = useState(false);
  const [initWorkspaceLoading, setInitWorkspaceLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 启用导航快捷键（Alt + ←/→ 和鼠标侧键）
  useNavigationShortcuts();

  // 获取实际使用的主题
  const actualTheme = useMemo(() => {
    if (theme === 'system') {
      // 检测系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // 强制重新渲染
        setLoading(prev => prev);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // 主题切换快捷键 Ctrl+Alt+G（深色 ⇄ 浅色）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'g') {
        e.preventDefault();
        // 在深色和浅色之间切换
        if (theme === 'dark') {
          setTheme('light');
        } else {
          // 如果是浅色或跟随系统，都切换到深色
          setTheme('dark');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, setTheme]);

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

  const handleCloseFolder = () => {
    setRootPath('');
    message.info('已关闭文件夹');
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: actualTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#fd7a45',
          borderRadius: 6,
          colorInfo: '#fd7a45',
          colorLink: '#fd7a45',
        },
      }}
    >
      <div data-theme={actualTheme}>
      <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 自定义标题栏 */}
        <TitleBar 
        rootPath={rootPath}
        appVersion={appVersion}
        onOpenFolder={handleOpenFolder}
        onCloseFolder={handleCloseFolder}
      />

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {!rootPath ? (
          /* 欢迎页 - 打开文件夹 */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
              theme={actualTheme === 'dark' ? 'dark' : 'light'}
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
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
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
            <Layout style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {viewMode === 'workspace' ? (
                <>
                  <Toolbar
                    onNewProduct={() => setNewProductDialogOpen(true)}
                    onImport={handleImport}
                  />
                  <Content style={{
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    <MainContent />
                  </Content>
                </>
              ) : (
                <Content style={{
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
      </div>
    </ConfigProvider>
  );
}

export default App;
