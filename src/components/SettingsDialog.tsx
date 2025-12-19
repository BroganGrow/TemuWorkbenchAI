import { Modal, Tabs, Switch, Space, Typography, Button, message, Divider } from 'antd';
import { SettingOutlined, ExportOutlined, ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../store/settingsStore';
import { useState } from 'react';

const { Text, Title } = Typography;

interface SettingsDialogProps {
  open: boolean;
  onCancel: () => void;
}

export function SettingsDialog({ open, onCancel }: SettingsDialogProps) {
  const { settings, updateBasicSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('basic');

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

  const tabItems = [
    {
      key: 'basic',
      label: '基本',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 文件删除确认 */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div>
                  <Text strong style={{ fontSize: '14px' }}>文件删除确认</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      删除文件时显示确认提示弹窗
                    </Text>
                  </div>
                </div>
                <Switch
                  checked={settings.basic.showDeleteConfirmation}
                  onChange={(checked) => updateBasicSettings({ showDeleteConfirmation: checked })}
                />
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* 未来可以在这里添加更多基本设置 */}
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 提示：所有设置会自动保存到本地，您也可以使用下方的导入/导出功能备份设置。
              </Text>
            </div>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>设置</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={600}
      centered
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          重置设置
        </Button>,
        <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>
          导出设置
        </Button>,
        <Button key="import" icon={<ImportOutlined />} onClick={handleImport}>
          导入设置
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginTop: '16px' }}
      />
    </Modal>
  );
}

