import React, { useState } from 'react';
import { Card, Button, Input, Modal, Form, Space, Typography, Popconfirm, message, Select, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined, CheckOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, Modifier } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore, ProductType } from '../store/appStore';

const { Text } = Typography;
const { Option } = Select;

// --- 自定义修饰符：限制拖拽范围在容器内 ---
const restrictToContainer: Modifier = ({
  containerNodeRect,
  draggingNodeRect,
  transform
}) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return transform;
  }

  const draggingNodeRectLeft = draggingNodeRect.left + transform.x;
  const draggingNodeRectRight = draggingNodeRectLeft + draggingNodeRect.width;
  
  let x = transform.x;

  // 限制左边界
  if (draggingNodeRectLeft < containerNodeRect.left) {
    x += containerNodeRect.left - draggingNodeRectLeft;
  }
  // 限制右边界
  else if (draggingNodeRectRight > containerNodeRect.right) {
    x += containerNodeRect.right - draggingNodeRectRight;
  }

  return {
    ...transform,
    x,
  };
};

// --- 基础卡片样式组件 ---
interface ProductTypeCardProps {
  type: ProductType;
  style?: React.CSSProperties;
}

const ProductTypeCard: React.FC<ProductTypeCardProps> = ({ type, style }) => (
  <Card
    hoverable={false}
    style={{
      width: '100px',
      height: '100px',
      ...style
    }}
    styles={{
      body: {
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        boxSizing: 'border-box'
      }
    }}
  >
    <Text strong style={{ fontSize: '24px', lineHeight: 1, marginBottom: '8px' }}>
      {type.code}
    </Text>
    <Text 
      type="secondary" 
      style={{ fontSize: '12px', width: '100%', textAlign: 'center' }} 
      ellipsis={{ tooltip: type.name }}
    >
      {type.name}
    </Text>
  </Card>
);

// --- 可排序列表项组件 ---
interface SortableItemProps {
  type: ProductType;
  onEdit: (type: ProductType) => void;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ type, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: type.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    // 防止拖拽时超出容器
    maxWidth: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        hoverable
        style={{
          width: '100%',
          height: '100px',
        }}
        styles={{
          body: {
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            boxSizing: 'border-box'
          }
        }}
      >
        <Text strong style={{ fontSize: '24px', lineHeight: 1, marginBottom: '8px' }}>
          {type.code}
        </Text>
        <Text 
          type="secondary" 
          style={{ fontSize: '12px', width: '100%', textAlign: 'center' }} 
          ellipsis={{ tooltip: type.name }}
        >
          {type.name}
        </Text>

        {/* 删除按钮 */}
        <Popconfirm
          title="确定删除此类型？"
          description="删除后，旧产品可能显示异常，但文件不会丢失。"
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete(type.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="删除"
          cancelText="取消"
        >
          <Button 
            size="small" 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onPointerDown={(e) => e.stopPropagation()} // 防止触发拖拽
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', top: 2, right: 2 }}
          />
        </Popconfirm>
        
        {/* 编辑按钮 */}
        <Button 
          size="small" 
          type="text" 
          icon={<EditOutlined />} 
          onPointerDown={(e) => e.stopPropagation()} // 防止触发拖拽
          onClick={(e) => {
            e.stopPropagation();
            onEdit(type);
          }}
          style={{ position: 'absolute', bottom: 2, right: 2 }}
        />
      </Card>
    </div>
  );
};

// --- 管理器组件 (内部使用) ---
const ProductTypeManager: React.FC = () => {
  const { productTypes, setProductTypes, addProductType, updateProductType, removeProductType } = useAppStore();
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = productTypes.findIndex((item) => item.id === active.id);
      const newIndex = productTypes.findIndex((item) => item.id === over.id);
      setProductTypes(arrayMove(productTypes, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (type: ProductType) => {
    setEditingType(type);
    form.setFieldsValue(type);
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      values.code = values.code.toUpperCase();
      
      if (editingType) {
        if (values.code !== editingType.code && productTypes.some(t => t.code === values.code && t.id !== editingType.id)) {
          message.error('该类型缩写已存在');
          return;
        }
        updateProductType(editingType.id, values);
        message.success('更新成功');
      } else {
        if (productTypes.some(t => t.code === values.code)) {
          message.error('该类型缩写已存在');
          return;
        }
        addProductType({
          id: `${values.code}_${Date.now()}`,
          ...values
        });
        message.success('添加成功');
      }
      setIsModalOpen(false);
    } catch (error) {
      // Form error
    }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加类型
        </Button>
      </div>
      
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto', 
        overflowX: 'hidden', 
        padding: 4,
        position: 'relative'
      }}>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
          modifiers={[restrictToContainer]}
        >
          <SortableContext 
            items={productTypes.map(t => t.id)} 
            strategy={rectSortingStrategy}
          >
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {productTypes.map((type) => (
                <SortableItem
                  key={type.id}
                  type={type}
                  onEdit={handleEdit}
                  onDelete={removeProductType}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Modal
        title={editingType ? "编辑类型" : "添加类型"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={400}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="缩写代码"
            rules={[
              { required: true, message: '请输入2-3位缩写' },
              { pattern: /^[A-Za-z]{2,3}$/, message: '只能包含2-3位字母' }
            ]}
          >
            <Input placeholder="例如: ST" maxLength={3} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item
            name="name"
            label="类型名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="例如: 贴纸" maxLength={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// --- 主选择器组件 ---
interface ProductTypeSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({ value, onChange }) => {
  const { productTypes } = useAppStore();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  return (
    <div>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          placeholder="选择产品类型"
          value={value}
          onChange={onChange}
          style={{ width: '100%' }}
          optionLabelProp="label"
        >
          {productTypes.map(type => (
            <Option key={type.id} value={type.code} label={`${type.code} - ${type.name}`}>
              <Space>
                <Text strong>{type.code}</Text>
                <Text type="secondary">{type.name}</Text>
              </Space>
            </Option>
          ))}
        </Select>
        <Button icon={<SettingOutlined />} onClick={() => setIsManagerOpen(true)}>
          管理
        </Button>
      </Space.Compact>

      {/* 管理弹窗 */}
      <Modal
        title="管理产品类型"
        open={isManagerOpen}
        onCancel={() => setIsManagerOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
        centered
        styles={{
          body: {
            overflow: 'hidden',
            maxWidth: '100%'
          }
        }}
      >
        <ProductTypeManager />
      </Modal>
    </div>
  );
};
