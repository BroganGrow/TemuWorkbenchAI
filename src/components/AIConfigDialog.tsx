import { Modal, Input, Radio, Space, Switch, Typography, Button, Collapse, theme } from 'antd';
import { useState, useEffect } from 'react';
import { useAppStore, AIModel } from '../store/appStore';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragOutlined, SettingOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

interface AIConfigDialogProps {
  open: boolean;
  onCancel: () => void;
}

interface SortableItemProps {
  model: AIModel;
  onUpdateProvider: (modelId: string, providerId: string, updates: any) => void;
}

function SortableItem({ model, onUpdateProvider }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: model.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '8px',
  };

  const { token } = theme.useToken();

  // 检测当前主题
  const currentTheme = document.body.getAttribute('data-theme') || '';
  const isPaperTheme = currentTheme === 'paper';
  
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ 
        border: `1px solid ${isPaperTheme ? 'var(--border-color)' : token.colorBorder}`, 
        borderRadius: token.borderRadiusLG,
        background: isPaperTheme ? 'var(--card-bg)' : token.colorBgContainer,
        overflow: 'hidden'
      }}>
        <Collapse
          ghost
          expandIconPosition="end"
          items={[{
            key: '1',
            label: (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div 
                  {...attributes} 
                  {...listeners} 
                  style={{ 
                    cursor: 'grab', 
                    marginRight: '12px',
                    color: token.colorTextSecondary,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={(e) => e.stopPropagation()} // 防止触发折叠
                >
                  <DragOutlined />
                </div>
                <Text strong style={{ fontSize: '15px' }}>{model.name}</Text>
                <div style={{ flex: 1 }} />
                {/* 可以在这里显示当前选中的 Provider */}
                <Text type="secondary" style={{ fontSize: '12px', marginRight: '16px' }}>
                  {model.providers.find(p => p.selected)?.name || '未选择'}
                </Text>
              </div>
            ),
            children: (
              <div style={{ padding: '0 16px 16px 40px' }}>
                <Radio.Group 
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  value={model.providers.find(p => p.selected)?.id}
                  onChange={(e) => {
                    onUpdateProvider(model.id, e.target.value, { selected: true });
                  }}
                >
                  {model.providers.map(provider => (
                    <div key={provider.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '8px',
                      borderRadius: token.borderRadius,
                      border: `1px solid ${provider.selected 
                        ? (isPaperTheme ? 'var(--primary-color)' : token.colorPrimary) 
                        : (isPaperTheme ? 'var(--border-color)' : token.colorBorderSecondary)}`,
                      background: provider.selected 
                        ? (isPaperTheme ? 'var(--bg-active)' : token.colorPrimaryBg) 
                        : 'transparent'
                    }}>
                      <Radio value={provider.id}>
                        {provider.name}
                      </Radio>
                      <Input.Password
                        placeholder="请输入 API Key"
                        value={provider.apiKey}
                        onChange={(e) => onUpdateProvider(model.id, provider.id, { apiKey: e.target.value })}
                        style={{ flex: 1 }}
                        bordered={false}
                        disabled={!provider.selected} // 只有选中时才高亮显示输入框，或者一直显示也可以
                      />
                    </div>
                  ))}
                </Radio.Group>
              </div>
            )
          }]}
        />
      </div>
    </div>
  );
}

export function AIConfigDialog({ open, onCancel }: AIConfigDialogProps) {
  const { aiModels, setAIModels, updateAIProvider } = useAppStore();
  const [resetKey, setResetKey] = useState(0);

  // 每次打开弹窗时重置 key，强制 Collapse 恢复折叠状态
  useEffect(() => {
    if (open) {
      setResetKey(prev => prev + 1);
    }
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = aiModels.findIndex((item) => item.id === active.id);
      const newIndex = aiModels.findIndex((item) => item.id === over.id);
      setAIModels(arrayMove(aiModels, oldIndex, newIndex));
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>AI 模型配置</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel}>
          完成
        </Button>
      ]}
      width={600}
      centered
    >
      {/* resetKey 确保每次打开时 Collapse 都恢复折叠状态 */}
      <div key={resetKey} style={{ marginTop: '24px', maxHeight: '60vh', overflow: 'auto', paddingRight: '4px' }}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={aiModels.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {aiModels.map((model) => (
              <SortableItem 
                key={model.id} 
                model={model} 
                onUpdateProvider={updateAIProvider}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </Modal>
  );
}

