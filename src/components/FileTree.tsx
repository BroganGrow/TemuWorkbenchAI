import { Tree, Dropdown, Modal, Button, Tooltip, message } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import {
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  EditOutlined,
  AimOutlined,
  FileOutlined,
  UndoOutlined
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
    openTab,
    activeTabId,
    updateTabFolder,
    tabs,
    setCurrentCategory
  } = useAppStore();

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandEnabled, setAutoExpandEnabled] = useState(true);
  const [normalFolders, setNormalFolders] = useState<FileNode[]>([]);
  // 编辑产品弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProductInfo, setEditProductInfo] = useState<{ path: string; folderName: string } | undefined>(undefined);

  // 判断是否是工作流分类（包括垃圾筒，因为垃圾筒也需要显示产品树结构）
  const isWorkflowCategory = WORKFLOW_CATEGORIES.includes(currentCategory) || currentCategory === '10_Trash';

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Alt+Shift+E - 在文件资源管理器中显示
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (selectedProduct) {
          const product = products.find(p => p.id === selectedProduct);
          if (product) {
            window.electronAPI.showInFolder(product.path);
          }
        }
        return;
      }

      // F2 或 Shift+F6 - 重命名产品
      // 仅当选中了产品节点（非子文件夹）且没有打开编辑弹窗时生效
      if ((e.key === 'F2' || (e.shiftKey && e.key === 'F6')) && !editDialogOpen) {
        // 确保选中的是产品，而不是子文件夹
        if (selectedProduct && !selectedFolder) {
          e.preventDefault();
          const product = products.find(p => p.id === selectedProduct);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, selectedFolder, products, editDialogOpen]);

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
    
    return normalFolders.map(folder => {
      // 将 01_Style Reference 显示为"样式库"
      let displayName = folder.name;
      if (folder.name === '01_Style Reference') {
        displayName = '样式库';
      }
      
      return {
        key: folder.path,
        title: displayName,
        icon: folder.isDirectory ? <FolderOutlined /> : <FileOutlined />,
        isLeaf: !folder.isDirectory
      };
    });
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

  // 定位到当前选中的产品（支持跨工作流）
  const handleLocateCurrent = useCallback(() => {
    // 优先使用活动标签页的产品，如果没有标签页则使用 selectedProduct
    let targetProductId: string | null = null;
    
    if (activeTabId && tabs.length > 0) {
      // 从活动标签页获取产品ID
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        targetProductId = activeTab.productId;
      }
    } else if (selectedProduct) {
      // 如果没有活动标签页，使用当前选中的产品
      targetProductId = selectedProduct;
    }

    if (!targetProductId) {
      return;
    }

    // 查找产品信息
    const product = products.find(p => p.id === targetProductId);
    if (!product) {
      return;
    }

    // 检查是否需要切换工作流分类
    const needSwitchCategory = product.category !== currentCategory;
    
    // 定位到产品的函数
    const locateProduct = (productId: string) => {
      // 展开产品节点
      if (!expandedKeys.includes(productId)) {
        setExpandedKeys(prev => [...prev, productId]);
      }

      // 使用 setTimeout 确保 DOM 更新后再滚动
      setTimeout(() => {
        // Ant Design Tree 的节点选择器
        // 查找所有树节点，然后找到包含目标产品ID的节点
        const treeNodes = document.querySelectorAll('.ant-tree-treenode');
        let targetNode: HTMLElement | null = null;
        
        for (let i = 0; i < treeNodes.length; i++) {
          const node = treeNodes[i] as HTMLElement;
          const titleElement = node.querySelector('.ant-tree-title');
          if (titleElement && titleElement.textContent?.includes(productId)) {
            targetNode = node;
            break;
          }
        }

        if (targetNode) {
          targetNode.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // 临时高亮显示（移除其他选中状态）
          for (let i = 0; i < treeNodes.length; i++) {
            (treeNodes[i] as HTMLElement).classList.remove('ant-tree-treenode-selected');
          }
          targetNode.classList.add('ant-tree-treenode-selected');
          
          // 2秒后移除高亮
          setTimeout(() => {
            if (targetNode) {
              targetNode.classList.remove('ant-tree-treenode-selected');
            }
          }, 2000);
        }
      }, needSwitchCategory ? 200 : 100);
    };
    
    if (needSwitchCategory) {
      // 切换到产品所属的分类
      setCurrentCategory(product.category);
      
      // 等待分类切换完成后再展开和滚动
      // 使用稍长的延迟确保树形数据已更新
      setTimeout(() => {
        locateProduct(targetProductId!);
      }, 200);
    } else {
      // 当前分类正确，直接展开和滚动
      locateProduct(targetProductId);
    }

    setAutoExpandEnabled(true); // 重新启用自动展开
  }, [selectedProduct, activeTabId, tabs, products, currentCategory, expandedKeys, setCurrentCategory]);

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
        const product = products.find(p => p.id === productId);
        if (product) {
          // 先确保产品标签页已打开
          openTab(product.path, product.id, `${product.id} - ${product.name}`);
          // 然后更新选中的文件夹
          setSelectedProduct(productId);
          setSelectedFolder(folderKey);
          // 更新标签页的文件夹状态
          if (activeTabId === product.path) {
            updateTabFolder(product.path, folderKey);
          }
        }
      } else {
        // 选中的是产品 - 自动打开标签页
        const product = products.find(p => p.id === key);
        if (product) {
          // 检查标签页是否已存在
          const tabExists = tabs.find(t => t.id === product.path);
          // 如果标签页已存在，不切换；如果不存在，创建并切换
          openTab(product.path, product.id, `${product.id} - ${product.name}`, !tabExists);
        }
      }
    } 
    // 普通文件夹：直接选择文件夹/文件
    else {
      // 对于普通文件夹，key 就是完整路径
      setSelectedProduct(key);
      setSelectedFolder(null);
    }
  };

  // 双击打开标签页（保留此功能，虽然单击也会打开）
  const handleDoubleClick = (_e: React.MouseEvent, node: DataNode) => {
    if (!isWorkflowCategory) return;
    
    const key = node.key as string;
    
    // 只有产品节点才能打开标签页（子文件夹不能）
    if (!key.includes('-')) {
      const product = products.find(p => p.id === key);
      if (product) {
        openTab(product.path, product.id, `${product.id} - ${product.name}`);
      }
    }
  };

  // Enter 键打开标签页
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedProduct && !selectedFolder && isWorkflowCategory) {
        const product = products.find(p => p.id === selectedProduct);
        if (product) {
          openTab(product.path, product.id, `${product.id} - ${product.name}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, selectedFolder, products, isWorkflowCategory, openTab]);

  const handleExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue as string[]);
  };

  const handleDelete = async (productId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要将此产品移动到垃圾筒吗？',
      okText: '移动到垃圾筒',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 获取产品信息
          const product = products.find(p => p.id === productId);
          if (!product) {
            message.error('产品不存在');
            return;
          }

          // 如果产品已经在垃圾筒，则提示
          if (product.category === '10_Trash') {
            message.warning('产品已在垃圾筒中');
            return;
          }

          if (!rootPath) {
            message.error('根目录未设置');
            return;
          }

          // 构建目标路径：rootPath/10_Trash/产品文件夹名
          const oldPath = product.path;
          const folderName = oldPath.split(/[\\/]/).pop();
          if (!folderName) {
            message.error('无法获取产品文件夹名');
            return;
          }

          const newPath = `${rootPath}/10_Trash/${folderName}`;

          // 调用 Electron API 移动文件夹
          if (window.electronAPI?.movePath) {
            const result = await window.electronAPI.movePath(oldPath, newPath);
            if (result.success) {
              message.success('产品已移动到垃圾筒');
              // 触发刷新
              useAppStore.getState().triggerRefresh();
            } else {
              message.error(`移动失败: ${result.error}`);
            }
          } else {
            message.error('移动功能不可用');
          }
        } catch (error) {
          console.error('移动到垃圾筒失败:', error);
          message.error('移动到垃圾筒失败');
        }
      }
    });
  };

  // 彻底删除产品（从垃圾筒中永久删除）
  const handlePermanentDelete = async (productId: string) => {
    Modal.confirm({
      title: '确认彻底删除',
      content: '确定要彻底删除这个产品吗？此操作不可恢复，文件将被永久删除。',
      okText: '彻底删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const product = products.find(p => p.id === productId);
          if (!product) {
            message.error('产品不存在');
            return;
          }

          if (window.electronAPI?.deleteFolder) {
            const result = await window.electronAPI.deleteFolder(product.path);
            if (result.success) {
              message.success('产品已彻底删除');
              // 触发刷新
              useAppStore.getState().triggerRefresh();
            } else {
              message.error(`删除失败: ${result.error}`);
            }
          } else {
            message.error('删除功能不可用');
          }
        } catch (error) {
          console.error('彻底删除失败:', error);
          message.error('彻底删除失败');
        }
      }
    });
  };

  // 恢复产品到选品中
  const handleRestoreToInProgress = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        message.error('产品不存在');
        return;
      }

      if (product.category !== '10_Trash') {
        message.warning('产品不在垃圾筒中');
        return;
      }

      if (!rootPath) {
        message.error('根目录未设置');
        return;
      }

      // 构建目标路径：rootPath/01_In_Progress/产品文件夹名
      const oldPath = product.path;
      const folderName = oldPath.split(/[\\/]/).pop();
      if (!folderName) {
        message.error('无法获取产品文件夹名');
        return;
      }

      const newPath = `${rootPath}/01_In_Progress/${folderName}`;

      // 调用 Electron API 移动文件夹
      if (window.electronAPI?.movePath) {
        const result = await window.electronAPI.movePath(oldPath, newPath);
        if (result.success) {
          message.success('产品已恢复到选品中');
          // 触发刷新
          useAppStore.getState().triggerRefresh();
        } else {
          message.error(`恢复失败: ${result.error}`);
        }
      } else {
        message.error('移动功能不可用');
      }
    } catch (error) {
      console.error('恢复产品失败:', error);
      message.error('恢复产品失败');
    }
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
    if (!product) return [];

    // 如果是垃圾筒中的产品，显示特殊菜单
    if (currentCategory === '10_Trash') {
      return [
        {
          key: 'restore',
          icon: <UndoOutlined />,
          label: '恢复到选品中',
          onClick: () => handleRestoreToInProgress(nodeKey)
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
          type: 'divider' as const
        },
        {
          key: 'permanent-delete',
          icon: <DeleteOutlined />,
          label: '彻底删除',
          danger: true,
          onClick: () => handlePermanentDelete(nodeKey)
        }
      ];
    }
    
    // 普通工作流分类的菜单
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
        <Tooltip title="展开全部 (Ctrl+Shift+Z)" placement="bottom">
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
          onSelect={(selectedKeys, info) => {
            const key = selectedKeys[0] as string;
            
            // 单击展开/收起产品节点
            if (isWorkflowCategory && key && !key.includes('-')) {
              if (expandedKeys.includes(key)) {
                setExpandedKeys(expandedKeys.filter(k => k !== key));
              } else {
                setExpandedKeys([...expandedKeys, key]);
              }
            }
            
            // 调用原来的选择处理
            handleSelect(selectedKeys, info);
          }}
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
              <span 
                style={{ 
                  userSelect: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  maxWidth: '100%'
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e, node);
                }}
              >
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

