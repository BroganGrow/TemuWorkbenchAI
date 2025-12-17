import { Modal, Alert, List, Typography } from 'antd';
import { FolderOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { STANDARD_CATEGORIES, ASSET_SUBFOLDERS } from '../utils/workspaceInit';

const { Text, Paragraph } = Typography;

interface WorkspaceInitDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function WorkspaceInitDialog({ 
  open, 
  onConfirm, 
  onCancel,
  loading = false 
}: WorkspaceInitDialogProps) {
  return (
    <Modal
      title="初始化工作区"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText="初始化"
      cancelText="跳过"
    >
      <Alert
        message="检测到当前文件夹不是标准 Temu 工作区"
        description="是否需要自动创建标准目录结构？"
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Paragraph>
        <Text strong>将创建以下目录：</Text>
      </Paragraph>

      <List
        size="small"
        bordered
        dataSource={STANDARD_CATEGORIES}
        renderItem={(item) => (
          <List.Item>
            <FolderOutlined style={{ marginRight: '8px', color: '#fd7a45' }} />
            <Text code>{item}</Text>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
              {getCategoryDescription(item)}
            </span>
          </List.Item>
        )}
        style={{ marginBottom: '16px' }}
      />

      <Alert
        message="初始化完成后将包含"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        description={
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>标准分类目录</li>
            <li>公共素材库子文件夹</li>
            <li>产品模板文件夹 (CD000_模版)</li>
            <li>工作区说明文档 (README.md)</li>
          </ul>
        }
      />
    </Modal>
  );
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    '00_Assets': '公共素材库',
    '01_In_Progress': '选品池/初筛',
    '02_Listing': '制作中/正在处理',
    '03_Waiting': '已发货，未到仓库',
    '04_Active': '已上架/热卖中',
    '05_Archive': '已下架/淘汰/历史'
  };
  return descriptions[category] || '';
}

