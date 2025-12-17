import { Tree, Dropdown, Modal, message } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import {
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  EditOutlined,
  ScissorOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useMemo, useState } from 'react';

const SUB_FOLDERS = [
  { key: 'ref_images', label: '01_Ref_Images', icon: '📸' },
  { key: 'ai_raw', label: '02_Ai_Raw', icon: '🤖' },
  { key: 'ai_handle', label: '03_AI_Handle', icon: '✨' },
  { key: 'final_goods', label: '04_Final_Goods_Images', icon: '⭐' }
];

interface FileTreeProps {
  onDrop?: (info: any) => void;
}

export function FileTree({ onDrop }: FileTreeProps) {
  const { 
    currentCategory, 
    products, 
    selectedProduct, 
    selectedFolder,
    setSelectedProduct,
    setSelectedFolder,
    removeProduct
  } = useAppStore();

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 生成树形数据
  const treeData = useMemo<DataNode[]>(() => {
    const filteredProducts = products.filter(p => p.category === currentCategory);
    
    return filteredProducts.map(product => ({
      key: product.id,
      title: `${product.type} - ${product.name}`,
      icon: <FolderOutlined />,
      children: SUB_FOLDERS.map(folder => ({
        key: `${product.id}-${folder.key}`,
        title: (
          <span>
            <span style={{ marginRight: '8px' }}>{folder.icon}</span>
            {folder.label}
          </span>
        ),
        icon: <FolderOutlined style={{ fontSize: '14px' }} />,
        isLeaf: true
      }))
    }));
  }, [products, currentCategory]);

  const handleSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string;
    
    if (!key) {
      setSelectedProduct(null);
      setSelectedFolder(null);
      return;
    }

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

    return [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名'
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
      padding: '16px',
      height: '100%',
      overflow: 'auto'
    }}>
      {treeData.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 16px',
          color: '#8c8c8c'
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
          onDrop={onDrop}
          style={{
            background: 'transparent',
            color: '#fff'
          }}
          titleRender={(node) => (
            <Dropdown
              menu={{ items: contextMenuItems(node.key as string) }}
              trigger={['contextMenu']}
            >
              <span style={{ userSelect: 'none' }}>
                {node.title as React.ReactNode}
              </span>
            </Dropdown>
          )}
        />
      )}
    </div>
  );
}

