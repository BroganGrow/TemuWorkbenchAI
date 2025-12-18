import { Tree, Dropdown, Modal, Button, Tooltip, message } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import {
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  EditOutlined,
  ScissorOutlined,
  AimOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTreeShortcuts } from '../hooks/useTreeShortcuts';
import { NewProductDialog } from './NewProductDialog';

const SUB_FOLDERS = [
  { key: 'ref_images', label: '参考图', fullLabel: '01_Ref_Images', icon: '📸' },
  { key: 'ai_raw', label: 'AI原图', fullLabel: '02_Ai_Raw', icon: '🤖' },
  { key: 'ai_handle', label: 'AI处理', fullLabel: '03_AI_Handle', icon: '✨' },
  { key: 'final_goods', label: '最终成品', fullLabel: '04_Final_Goods_Images', icon: '⭐' }
];

// 工作流分类（使用产品结构）
const WORKFLOW_CATEGORIES = [
  '01_In_Progress',
  '02_Listing',
  '03_Waiting',
  '04_Active',
  '05_Archive'
];

interface FileTreeProps {
  onDrop?: (info: any) => void;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
}

export function FileTree({ onDrop }: FileTreeProps) {
  const { 
    currentCategory,
    rootPath,
    products, 
    selectedProduct, 
    selectedFolder,
    setSelectedProduct,
    setSelectedFolder,
    removeProduct
  } = useAppStore();

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandEnabled, setAutoExpandEnabled] = useState(true);
  const [normalFolders, setNormalFolders] = useState<FileNode[]>([]);
  // 编辑产品弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProductInfo, setEditProductInfo] = useState<{ path: string; folderName: string } | undefined>(undefined);

  // 判断是否是工作流分类
  const isWorkflowCategory = WORKFLOW_CATEGORIES.includes(currentCategory);

  // 快捷键：Ctrl+Alt+Shift+E - 在文件资源管理器中显示
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (selectedProduct) {
          const product = products.find(p => p.id === selectedProduct);
          if (product) {
            window.electronAPI.showInFolder(product.path);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, products]);

  // 加载普通文件夹（非工作流分类）
  useEffect(() => {
    const loadNormalFolders = async () => {
      if (isWorkflowCategory || !rootPath) {
        setNormalFolders([]);
        return;
      }

      try {
        const categoryPath = `${rootPath}/${currentCategory}`;
        if (window.electronAPI?.listFiles) {
          const files = await window.electronAPI.listFiles(categoryPath);
          setNormalFolders(files.map(f => ({
            name: f.name,
            path: f.path,
            isDirectory: f.isDirectory || false
          })));
        }
      } catch (error) {
        console.error('加载文件夹失败:', error);
        setNormalFolders([]);
      }
    };

    loadNormalFolders();
  }, [currentCategory, rootPath, isWorkflowCategory]);

  // 生成工作流产品树形数据
  const workflowTreeData = useMemo<DataNode[]>(() => {
    if (!isWorkflowCategory) return [];
    
    const filteredProducts = products.filter(p => p.category === currentCategory);
    
    return filteredProducts.map(product => ({
      key: product.id,
      title: `${product.id} - ${product.name}`,  // 显示序号，如：CD006 - 产品名
      icon: <FolderOutlined />,
      children: SUB_FOLDERS.map(folder => ({
        key: `${product.id}-${folder.key}`,
        title: `${folder.icon} ${folder.label}`,
        icon: <FolderOutlined style={{ fontSize: '14px' }} />,
        isLeaf: true
      }))
    }));
  }, [products, currentCategory, isWorkflowCategory]);

  // 生成普通文件夹树形数据
  const normalTreeData = useMemo<DataNode[]>(() => {
    if (isWorkflowCategory) return [];
    
    return normalFolders.map(folder => ({
      key: folder.path,
      title: folder.name,
      icon: folder.isDirectory ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: !folder.isDirectory
    }));
  }, [normalFolders, isWorkflowCategory]);

  // 合并树形数据
  const treeData = isWorkflowCategory ? workflowTreeData : normalTreeData;

  // 获取所有产品的key（用于展开/折叠全部）
  const allProductKeys = useMemo(() => {
    return treeData.map(node => node.key as string);
  }, [treeData]);

  // 自动展开选中的产品（当选择产品或文件夹时）
  useEffect(() => {
    if (selectedProduct && autoExpandEnabled) {
      if (!expandedKeys.includes(selectedProduct)) {
        setExpandedKeys(prev => [...prev, selectedProduct]);
      }
    }
  }, [selectedProduct, autoExpandEnabled]);

  // 展开全部
  const handleExpandAll = () => {
    setExpandedKeys(allProductKeys);
    setAutoExpandEnabled(false); // 手动操作后禁用自动展开
  };

  // 折叠全部
  const handleCollapseAll = () => {
    setExpandedKeys([]);
    setAutoExpandEnabled(false); // 手动操作后禁用自动展开
  };

  // 定位到当前选中的产品
  const handleLocateCurrent = useCallback(() => {
    if (!selectedProduct) {
      return;
    }

    // 展开并滚动到选中的产品
    if (!expandedKeys.includes(selectedProduct)) {
      setExpandedKeys(prev => [...prev, selectedProduct]);
    }

    // 使用 setTimeout 确保 DOM 更新后再滚动
    setTimeout(() => {
      const selectedNode = document.querySelector('.ant-tree-treenode-selected');
      if (selectedNode) {
        selectedNode.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);

    setAutoExpandEnabled(true); // 重新启用自动展开
  }, [selectedProduct, expandedKeys]);

  // 注册快捷键
  useTreeShortcuts({
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    onLocateCurrent: handleLocateCurrent
  });

  const handleSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string;
    
    if (!key) {
      setSelectedProduct(null);
      setSelectedFolder(null);
      return;
    }

    // 工作流分类：处理产品和子文件夹
    if (isWorkflowCategory) {
      if (key.includes('-')) {
        // 选中的是子文件夹
        const [productId, folderKey] = key.split('-');
        setSelectedProduct(productId);
        setSelectedFolder(folderKey);
      } else {
        // 选中的是产品
        setSelectedProduct(key);
        setSelectedFolder(null);
      }
    } 
    // 普通文件夹：直接选择文件夹/文件
    else {
      // 对于普通文件夹，key 就是完整路径
      setSelectedProduct(key);
      setSelectedFolder(null);
    }
  };

  const handleExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue as string[]);
  };

  const handleDelete = (productId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个产品吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        removeProduct(productId);
        message.success('产品已删除');
      }
    });
  };

  const contextMenuItems = (nodeKey: string) => {
    const isFolder = nodeKey.includes('-');
    
    if (isFolder) {
      return [
        {
          key: 'open',
          icon: <FolderOpenOutlined />,
          label: '打开文件夹'
        }
      ];
    }

    // 查找产品数据
    const product = products.find(p => p.id === nodeKey);
    
    return [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
        onClick: () => {
          if (product) {
            const pathParts = product.path.split(/[/\\]/);
            const folderName = pathParts[pathParts.length - 1];
            setEditProductInfo({
              path: product.path,
              folderName
            });
            setEditDialogOpen(true);
          }
        }
      },
      {
        key: 'show-in-folder',
        icon: <FolderOpenOutlined />,
        label: '打开文件位置',
        onClick: () => {
          if (product) {
            window.electronAPI.showInFolder(product.path);
          }
        }
      },
      {
        key: 'move',
        icon: <ScissorOutlined />,
        label: '移动到...'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(nodeKey)
      }
    ];
  };

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 工具栏 - Android Studio 风格 */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {/* 定位当前文件 */}
        <Tooltip title="定位当前文件 (Alt+F1)" placement="bottom">
          <Button
            type="text"
            size="small"
            icon={<AimOutlined style={{ fontSize: '16px' }} />}
            onClick={handleLocateCurrent}
            disabled={!selectedProduct}
            style={{ 
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedProduct ? 'var(--text-secondary)' : 'var(--text-disabled)',
              background: 'transparent'
            }}
          />
        </Tooltip>

        {/* 分隔线 */}
        <div style={{ 
          width: '1px', 
          height: '20px', 
          background: 'var(--border-color)',
          margin: '0 2px'
        }} />

        {/* 展开全部 */}
        <Tooltip title="展开全部 (Ctrl+Shift+E)" placement="bottom">
          <Button
            type="text"
            size="small"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 5.5L8 1.5L12 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 10.5L8 14.5L12 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            onClick={handleExpandAll}
            style={{ 
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              background: 'transparent'
            }}
          />
        </Tooltip>

        {/* 折叠全部 */}
        <Tooltip title="折叠全部 (Ctrl+Shift+C)" placement="bottom">
          <Button
            type="text"
            size="small"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 2L8 6L12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 14L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            onClick={handleCollapseAll}
            style={{ 
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              background: 'transparent'
            }}
          />
        </Tooltip>
      </div>

      {/* 文件树 */}
      <div style={{ 
        padding: '16px',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
        className="file-tree-container"
      >
      <style>{`
        /* 隐藏横向滚动条，文字超出用省略号 */
        .file-tree-container {
          overflow-x: hidden !important;
        }
        .file-tree-container .ant-tree {
          overflow-x: hidden !important;
        }
        .file-tree-container .ant-tree-title {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          display: inline-block !important;
          max-width: 100% !important;
          vertical-align: top !important;
        }
        .file-tree-container .ant-tree-node-content-wrapper {
          overflow: hidden !important;
          max-width: 100% !important;
          flex: 1 !important;
          min-width: 0 !important;
        }
        .file-tree-container .ant-tree-treenode {
          overflow: hidden !important;
          white-space: nowrap !important;
        }
        .file-tree-container .ant-tree-indent {
          flex-shrink: 0 !important;
        }
        /* 隐藏拖拽图标 */
        .file-tree-container .ant-tree-draggable-icon {
          display: none !important;
        }
      `}</style>
      {treeData.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 16px',
          color: 'var(--text-secondary)'
        }}>
          <FolderOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>当前分类下暂无产品</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            点击工具栏的"新建产品"开始创建
          </div>
        </div>
      ) : (
        <Tree
          showIcon
          expandedKeys={expandedKeys}
          selectedKeys={selectedProduct ? [
            selectedFolder ? `${selectedProduct}-${selectedFolder}` : selectedProduct
          ] : []}
          onSelect={handleSelect}
          onExpand={handleExpand}
          treeData={treeData}
          draggable
          onDragStart={({ event, node }) => {
            // 只允许拖拽产品节点（没有连字符的 key）
            if (isWorkflowCategory && !String(node.key).includes('-')) {
              event.dataTransfer.setData('productId', String(node.key));
              event.dataTransfer.setData('sourceCategory', currentCategory);
              event.dataTransfer.effectAllowed = 'move';
            } else {
              event.preventDefault();
            }
          }}
          onDrop={onDrop}
          style={{
            background: 'transparent',
            color: 'var(--text-primary)'
          }}
          titleRender={(node) => (
            <Dropdown
              menu={{ items: contextMenuItems(node.key as string) }}
              trigger={['contextMenu']}
            >
              <span style={{ 
                userSelect: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                maxWidth: '100%'
              }}>
                {node.title as React.ReactNode}
              </span>
            </Dropdown>
          )}
        />
      )}
      </div>

      {/* 编辑产品弹窗 */}
      <NewProductDialog
        open={editDialogOpen}
        onCancel={() => setEditDialogOpen(false)}
        onSuccess={() => {
          // 触发产品列表刷新
          useAppStore.getState().triggerRefresh();
        }}
        editProduct={editProductInfo}
      />
    </div>
  );
}

