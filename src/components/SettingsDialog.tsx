import { Modal, Tree, Switch, Space, Typography, Button, message, Input } from 'antd';
import { 
  SettingOutlined, 
  ExportOutlined, 
  ImportOutlined, 
  ReloadOutlined,
  SearchOutlined,
  RightOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useSettingsStore } from '../store/settingsStore';
import { useState, useMemo } from 'react';
import type { DataNode } from 'antd/es/tree';

const { Text } = Typography;

interface SettingsDialogProps {
  open: boolean;
  onCancel: () => void;
}

export function SettingsDialog({ open, onCancel }: SettingsDialogProps) {
  const { settings, updateBasicSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const [selectedKey, setSelectedKey] = useState<string>('basic');
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['appearance']);

  // 导出设置
  const handleExport = () => {
    try {
      const json = exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temu-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('设置已导出');
    } catch (error) {
      message.error('导出设置失败');
      console.error('Export settings error:', error);
    }
  };

  // 导入设置
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const success = importSettings(text);
        if (success) {
          message.success('设置已导入');
        } else {
          message.error('导入的设置格式不正确');
        }
      } catch (error) {
        message.error('导入设置失败');
        console.error('Import settings error:', error);
      }
    };
    input.click();
  };

  // 重置设置
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要将所有设置恢复为默认值吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        resetSettings();
        message.success('设置已重置');
      },
    });
  };

  // 树形菜单数据
  const treeData: DataNode[] = [
    {
      title: '外观与行为',
      key: 'appearance',
      children: [
        { title: '基本', key: 'basic' },
      ],
    },
  ];

  // 根据搜索过滤树节点
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData;
    
    const filterTree = (nodes: DataNode[]): DataNode[] => {
      return nodes.reduce((acc: DataNode[], node) => {
        const title = String(node.title).toLowerCase();
        const matches = title.includes(searchValue.toLowerCase());
        
        if (node.children) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length > 0 || matches) {
            acc.push({
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : node.children,
            });
          }
        } else if (matches) {
          acc.push(node);
        }
        
        return acc;
      }, []);
    };
    
    return filterTree(treeData);
  }, [searchValue]);

  // 渲染右侧内容
  const renderContent = () => {
    switch (selectedKey) {
      case 'basic':
        return (
          <div>
            <div style={{ 
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                margin: 0,
                color: 'var(--text-primary)'
              }}>
                基本
              </h2>
              <Text type="secondary" style={{ fontSize: '13px', marginTop: '4px', display: 'block' }}>
                配置应用的基本行为和交互方式
              </Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 文件删除确认 */}
              <div style={{ 
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                      文件删除确认
                    </Text>
                    <Text type="secondary" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                      删除文件时显示确认提示弹窗。关闭后将直接删除文件，无需确认。
                    </Text>
                  </div>
                  <Switch
                    checked={settings.basic.showDeleteConfirmation}
                    onChange={(checked) => updateBasicSettings({ showDeleteConfirmation: checked })}
                  />
                </div>
              </div>

              {/* 提示信息 */}
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(253, 122, 69, 0.1)', 
                borderRadius: '6px',
                border: '1px solid rgba(253, 122, 69, 0.2)'
              }}>
                <Text style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  💡 提示：所有设置会自动保存到本地存储中。您可以使用底部的导入/导出功能来备份或迁移设置。
                </Text>
              </div>
            </Space>
          </div>
        );
      
      default:
        return (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Text type="secondary">请从左侧选择设置项</Text>
          </div>
        );
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined />
          <span>设置</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={900}
      centered
      styles={{
        body: { padding: 0, height: '600px', overflow: 'hidden' }
      }}
      footer={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
          </Space>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" onClick={onCancel}>
              确定
            </Button>
          </Space>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '600px' }}>
        {/* 左侧菜单 */}
        <div style={{ 
          width: '280px',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 搜索框 */}
          <div style={{ padding: '12px' }}>
            <Input
              placeholder="搜索设置..."
              prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ 
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)'
              }}
            />
          </div>

          {/* 树形菜单 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
            <Tree
              showLine={false}
              showIcon={false}
              switcherIcon={(props) => {
                if (props.expanded) {
                  return <DownOutlined style={{ fontSize: '10px' }} />;
                }
                return <RightOutlined style={{ fontSize: '10px' }} />;
              }}
              defaultExpandAll
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys as string[])}
              selectedKeys={[selectedKey]}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedKey(keys[0] as string);
                }
              }}
              treeData={filteredTreeData}
              style={{ 
                background: 'transparent',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* 右侧内容区 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '24px 32px',
          background: 'var(--bg-primary)'
        }}>
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
}

