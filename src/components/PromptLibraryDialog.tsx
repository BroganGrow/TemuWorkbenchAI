import { Modal, Input, Button, Typography, Space, List, message, Tag, Popover, Empty, Select } from 'antd';
import { useAppStore } from '../store/appStore';
import { useState, useEffect, useCallback } from 'react';
import { FileTextOutlined, PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined, DragOutlined } from '@ant-design/icons';
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

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

// 固定的6个分类
const FIXED_CATEGORIES = [
  { id: 'product-title', name: '产品标题' },
  { id: 'main-image', name: '主图' },
  { id: 'sku-image', name: 'SKU图' },
  { id: 'size-image', name: '尺寸图' },
  { id: 'comparison-image', name: '对比图' },
  { id: 'scene-image', name: '场景图' }
] as const;

export interface PromptRule {
  id: string;
  name: string;
  positivePrompt: string; // 正向提示词
  negativePrompt: string; // 反向提示词
  description?: string;
  category?: string; // 分类：product-title, main-image, sku-image, size-image, comparison-image, scene-image
}

interface PromptLibraryDialogProps {
  open: boolean;
  onCancel: () => void;
}

const DEFAULT_POSITIVE_PROMPT = '';

const DEFAULT_NEGATIVE_PROMPT = '';

interface SortableRuleItemProps {
  rule: PromptRule;
  editingRule: PromptRule | null;
  onEdit: (rule: PromptRule) => void;
  onDelete: (ruleId: string) => void;
  isFixedRule: (ruleId: string) => boolean;
  categories: typeof FIXED_CATEGORIES;
  onCategoryChange: (ruleId: string, category: string) => void;
}

function SortableRuleItem({ 
  rule, 
  editingRule, 
  onEdit, 
  onDelete, 
  isFixedRule,
  categories,
  onCategoryChange
}: SortableRuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item
        style={{
          padding: '12px',
          cursor: 'pointer',
          backgroundColor: editingRule?.id === rule.id ? 'var(--bg-hover)' : 'transparent',
          borderRadius: '6px',
          marginBottom: '8px',
          border: editingRule?.id === rule.id ? '1px solid var(--color-primary)' : '1px solid transparent',
          transition: 'all 0.2s'
        }}
        onClick={() => onEdit(rule)}
        actions={[
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={isFixedRule(rule.id)}
            title={isFixedRule(rule.id) ? '不能删除固定规则' : '删除'}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(rule.id);
            }}
          />
        ]}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab', padding: '4px', display: 'flex', alignItems: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                <DragOutlined style={{ color: 'var(--text-secondary)' }} />
              </div>
              <Text strong>{rule.name}</Text>
              {rule.category && (
                <Tag color="blue">
                  {categories.find(c => c.id === rule.category)?.name || rule.category}
                </Tag>
              )}
            </div>
          }
        />
      </List.Item>
    </div>
  );
}

export function PromptLibraryDialog({ open, onCancel }: PromptLibraryDialogProps) {
  const { promptRules, setPromptRules, aiTitlePrompt, setAITitlePrompt } = useAppStore();
  const [rules, setRules] = useState<PromptRule[]>([]);
  const [editingRule, setEditingRule] = useState<PromptRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 初始化规则库：固定支持6个规则
  useEffect(() => {
    if (open) {
      let initialRules = [...(promptRules || [])];
      
      // 定义固定的6个规则
      const fixedRules: PromptRule[] = [
        {
          id: 'main-image',
          name: '主图',
          description: '用于生成或优化产品主图',
          positivePrompt: DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        },
        {
          id: 'sku-image',
          name: 'SKU图',
          description: '用于生成或优化SKU规格图',
          positivePrompt: DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        },
        {
          id: 'size-image',
          name: '尺寸图',
          description: '用于生成或优化产品尺寸图',
          positivePrompt: DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        },
        {
          id: 'comparison-image',
          name: '对比图',
          description: '用于生成或优化产品对比图',
          positivePrompt: DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        },
        {
          id: 'scene-image',
          name: '场景图',
          description: '用于生成或优化产品场景图',
          positivePrompt: DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        },
        {
          id: 'product-title',
          name: '产品标题',
          description: '用于优化产品标题',
          positivePrompt: aiTitlePrompt || DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          category: undefined
        }
      ];
      
      // 如果规则库为空，使用固定规则
      if (initialRules.length === 0) {
        initialRules = fixedRules;
      } else {
        // 合并固定规则和已有规则，确保固定规则存在
        const existingIds = new Set(initialRules.map(r => r.id));
        fixedRules.forEach(fixedRule => {
          if (!existingIds.has(fixedRule.id)) {
            initialRules.push(fixedRule);
          } else {
            // 如果已存在，更新为固定规则的结构（保留用户自定义的提示词和分类）
            const existingIndex = initialRules.findIndex(r => r.id === fixedRule.id);
            if (existingIndex >= 0) {
              initialRules[existingIndex] = {
                ...fixedRule,
                name: initialRules[existingIndex].name || fixedRule.name,
                positivePrompt: initialRules[existingIndex].positivePrompt || fixedRule.positivePrompt,
                negativePrompt: initialRules[existingIndex].negativePrompt || fixedRule.negativePrompt,
                category: initialRules[existingIndex].category
              };
            }
          }
        });
      }
      
      setRules(initialRules);
      
      // 默认选中第一个规则
      if (initialRules.length > 0 && !editingRule) {
        setEditingRule({ ...initialRules[0] });
      }
      
      setIsCreating(false);
    } else {
      // 关闭时重置状态
      setEditingRule(null);
      setIsCreating(false);
    }
  }, [open, promptRules, aiTitlePrompt]);

  // 保存规则到列表和 store（提取为独立函数，供防抖和立即保存使用）
  const saveRuleToStore = useCallback((rule: PromptRule) => {
    if (!rule.name.trim()) {
      return;
    }
    
    setRules(prevRules => {
      const ruleExists = prevRules.some(r => r.id === rule.id);
      if (!ruleExists) return prevRules;
      const updatedRules = prevRules.map(r => r.id === rule.id ? rule : r);
      
      // 立即保存到 store（类似 Cursor 的实时保存）
      setPromptRules(updatedRules);
      
      // 同步产品标题分类的规则的正向提示词到 aiTitlePrompt（保持向后兼容）
      const titleRule = updatedRules.find(r => r.category === 'product-title');
      if (titleRule) {
        setAITitlePrompt(titleRule.positivePrompt);
      }
      
      return updatedRules;
    });
  }, [setPromptRules, setAITitlePrompt]);

  // 自动保存：当编辑规则时，实时更新到规则列表（参考 Cursor 的自动保存机制）
  useEffect(() => {
    if (editingRule && !isCreating) {
      // 延迟保存，避免频繁更新（类似 Cursor 的防抖机制）
      const timer = setTimeout(() => {
        saveRuleToStore(editingRule);
      }, 300); // 300ms 防抖
      
      return () => clearTimeout(timer);
    }
  }, [editingRule, isCreating, saveRuleToStore]);

  // 当 rules 变化时（非编辑触发），自动保存到 store
  useEffect(() => {
    // 避免在编辑时重复保存（编辑时由上面的 useEffect 处理）
    if (rules.length > 0 && (!editingRule || isCreating)) {
      setPromptRules(rules);
      
      // 同步产品标题分类的规则的正向提示词到 aiTitlePrompt（保持向后兼容）
      const titleRule = rules.find(r => r.category === 'product-title');
      if (titleRule) {
        setAITitlePrompt(titleRule.positivePrompt);
      }
    }
  }, [rules, editingRule, isCreating, setPromptRules, setAITitlePrompt]);


  const handleCreate = () => {
    const newRule: PromptRule = {
      id: `rule-${Date.now()}`,
      name: '新规则',
      positivePrompt: DEFAULT_POSITIVE_PROMPT,
      negativePrompt: DEFAULT_NEGATIVE_PROMPT,
      description: '',
      category: undefined
    };
    // 立即添加到规则列表
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    setPromptRules(updatedRules);
    setEditingRule(newRule);
    setIsCreating(true);
  };

  const handleEdit = (rule: PromptRule) => {
    setEditingRule({ ...rule });
    setIsCreating(false);
  };

  const handleDelete = (ruleId: string) => {
    // 不能删除固定规则
    if (isFixedRule(ruleId)) {
      message.warning('不能删除固定规则');
      return;
    }
    
    setRules(rules.filter(r => r.id !== ruleId));
    if (editingRule?.id === ruleId) {
      setEditingRule(null);
    }
  };

  const handleCategoryChange = (ruleId: string, category: string) => {
    // 如果选择了分类，先取消该分类下其他规则的分类
    const updatedRules = category
      ? rules.map(r => {
          if (r.id === ruleId) {
            return { ...r, category };
          } else if (r.category === category) {
            // 取消其他规则的分类
            return { ...r, category: undefined };
          }
          return r;
        })
      : rules.map(r => r.id === ruleId ? { ...r, category: undefined } : r);
    
    setRules(updatedRules);
    
    // 更新编辑中的规则
    if (editingRule?.id === ruleId) {
      setEditingRule({ ...editingRule, category: category || undefined });
    }
    
    // 自动保存到 store（通过 useEffect 触发）
  };

  // 检查是否为固定规则
  const isFixedRule = (ruleId: string) => {
    const fixedRuleIds = ['main-image', 'sku-image', 'size-image', 'comparison-image', 'scene-image', 'product-title'];
    return fixedRuleIds.includes(ruleId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const updatedRules = arrayMove(
        rules,
        rules.findIndex((item) => item.id === active.id),
        rules.findIndex((item) => item.id === over.id)
      );
      setRules(updatedRules);
      // 自动保存到 store（通过 useEffect 触发）
    }
  };

  // 创建规则完成（当用户点击其他地方或按回车时）
  const handleCreateComplete = () => {
    if (!editingRule || !isCreating) return;
    
    // 验证规则名称
    if (!editingRule.name.trim()) {
      message.warning('请输入规则名称');
      return;
    }
    
    // 更新规则列表中的规则（规则已经在 handleCreate 中添加了，这里只需要更新）
    setRules(prevRules => {
      const updatedRules = prevRules.map(r => r.id === editingRule.id ? editingRule : r);
      setPromptRules(updatedRules);
      
      // 同步产品标题分类的规则的正向提示词到 aiTitlePrompt（保持向后兼容）
      const titleRule = updatedRules.find(r => r.category === 'product-title');
      if (titleRule) {
        setAITitlePrompt(titleRule.positivePrompt);
      }
      
      return updatedRules;
    });
    
    message.success('规则已创建');
    setIsCreating(false);
    // 不清空 editingRule，让用户可以继续编辑
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Space>
            <FileTextOutlined />
            <span>提示词规则库</span>
            <Popover
              content={
                <div style={{ maxWidth: '400px' }}>
                  <p style={{ margin: '4px 0' }}>管理 AI 提示词规则库。每个规则包含正向提示词和反向提示词。</p>
                  <p style={{ margin: '4px 0' }}><Text strong>正向提示词</Text>：告诉 AI 应该做什么；<Text strong>反向提示词</Text>：告诉 AI 不应该做什么。</p>
                  <p style={{ margin: '4px 0' }}>请使用 <Text code>{'{title}'}</Text> 作为原标题的占位符。每个分类只能选择一个规则。</p>
                </div>
              }
              title="使用说明"
              trigger="click"
              placement="bottom"
            >
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                size="small"
                style={{ 
                  color: 'var(--text-secondary)',
                  padding: '0 4px'
                }}
              />
            </Popover>
          </Space>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      style={{ height: '700px' }}
      centered
      styles={{
        body: { height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
          {/* 左侧：规则列表 */}
          <div style={{ 
            width: '320px', 
            borderRight: '1px solid var(--border-color)', 
            paddingRight: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ 
              marginBottom: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <Text strong style={{ fontSize: '14px' }}>规则列表</Text>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="small" 
                onClick={handleCreate}
              >
                新建
              </Button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto' }}>
              {rules.length === 0 ? (
                <Empty 
                  description="暂无规则" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: '40px' }}
                />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rules.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <List
                      dataSource={rules}
                      renderItem={(rule) => (
                        <SortableRuleItem
                          key={rule.id}
                          rule={rule}
                          editingRule={editingRule}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          isFixedRule={isFixedRule}
                          categories={FIXED_CATEGORIES}
                          onCategoryChange={handleCategoryChange}
                        />
                      )}
                    />
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* 右侧：编辑区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {editingRule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
                {/* 顶部：规则名称和分类，紧凑布局 */}
                <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>规则名称：</Text>
                    <Input
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                      onBlur={() => {
                        if (isCreating && editingRule.name.trim()) {
                          // 创建模式下，失去焦点时自动完成创建
                          handleCreateComplete();
                        } else if (!isCreating) {
                          // 编辑模式下，失去焦点时立即保存
                          saveRuleToStore(editingRule);
                        }
                      }}
                      onPressEnter={() => {
                        // 创建模式下，按回车键完成创建
                        if (isCreating && editingRule.name.trim()) {
                          handleCreateComplete();
                        }
                      }}
                      placeholder="请输入规则名称"
                      size="small"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>规则分类：</Text>
                    <Select
                      value={editingRule.category || undefined}
                      onChange={(value) => {
                        const newCategory = value || undefined;
                        handleCategoryChange(editingRule.id, newCategory || '');
                        setEditingRule({ ...editingRule, category: newCategory });
                      }}
                      onBlur={() => {
                        // 失去焦点时立即保存
                        if (!isCreating) {
                          saveRuleToStore(editingRule);
                        }
                      }}
                      placeholder="选择分类（可选）"
                      style={{ width: '100%' }}
                      size="small"
                      allowClear
                    >
                      {FIXED_CATEGORIES.map(cat => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* 提示词输入区域，占据剩余空间 */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                  {/* 正向提示词 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <Text strong style={{ fontSize: '13px' }}>正向提示词：</Text>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingRule({ ...editingRule, positivePrompt: DEFAULT_POSITIVE_PROMPT })}
                      >
                        恢复默认
                      </Button>
                    </div>
                    <TextArea
                      value={editingRule.positivePrompt}
                      onChange={(e) => setEditingRule({ ...editingRule, positivePrompt: e.target.value })}
                      onBlur={() => {
                        // 失去焦点时立即保存
                        if (!isCreating) {
                          saveRuleToStore(editingRule);
                        }
                      }}
                      placeholder="请输入正向提示词..."
                      style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        resize: 'none', 
                        minHeight: 0
                      }}
                    />
                  </div>

                  {/* 反向提示词 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <Text strong style={{ fontSize: '13px' }}>反向提示词：</Text>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setEditingRule({ ...editingRule, negativePrompt: DEFAULT_NEGATIVE_PROMPT })}
                      >
                        恢复默认
                      </Button>
                    </div>
                    <TextArea
                      value={editingRule.negativePrompt}
                      onChange={(e) => setEditingRule({ ...editingRule, negativePrompt: e.target.value })}
                      onBlur={() => {
                        // 失去焦点时立即保存
                        if (!isCreating) {
                          saveRuleToStore(editingRule);
                        }
                      }}
                      placeholder="请输入反向提示词..."
                      style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        resize: 'none', 
                        minHeight: 0
                      }}
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: 'var(--text-secondary)'
              }}>
                <Empty 
                  description="请从左侧选择一个规则进行编辑，或创建新规则"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
