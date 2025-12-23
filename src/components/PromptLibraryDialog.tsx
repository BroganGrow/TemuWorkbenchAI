import { Modal, Input, Button, Typography, Space, List, Tabs, message, Tag, Popover, Empty } from 'antd';
import { useAppStore } from '../store/appStore';
import { useState, useEffect, useRef } from 'react';
import { FileTextOutlined, PlusOutlined, DeleteOutlined, EditOutlined, StarOutlined, StarFilled, QuestionCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

export interface PromptRule {
  id: string;
  name: string;
  positivePrompt: string; // 正向提示词
  negativePrompt: string; // 反向提示词
  description?: string;
  isDefault?: boolean; // 是否为默认规则（用于标题优化）
}

interface PromptLibraryDialogProps {
  open: boolean;
  onCancel: () => void;
}

const DEFAULT_POSITIVE_PROMPT = `请优化以下 Temu 产品标题，使其更具吸引力，包含高搜索量的关键词，符合 SEO 标准，且通顺自然。
请直接返回优化后的标题（包含中文和英文，用括号隔开，格式如：中文标题 (English Title)），不要包含其他解释或引导语。

原标题：{title}`;

const DEFAULT_NEGATIVE_PROMPT = `不要使用过于夸张的词汇，不要包含特殊符号，不要超过合理的长度。`;

export function PromptLibraryDialog({ open, onCancel }: PromptLibraryDialogProps) {
  const { promptRules, setPromptRules, aiTitlePrompt, setAITitlePrompt } = useAppStore();
  const [rules, setRules] = useState<PromptRule[]>([]);
  const [editingRule, setEditingRule] = useState<PromptRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [defaultRuleId, setDefaultRuleId] = useState<string | null>(null);
  // 初始化规则库：如果为空，创建一个默认的"标题优化"规则
  useEffect(() => {
    if (open) {
      let initialRules = [...(promptRules || [])];
      
      // 如果规则库为空，或者没有默认规则，创建一个默认的"标题优化"规则
      if (initialRules.length === 0) {
        const defaultRule: PromptRule = {
          id: 'default-title-optimization',
          name: '标题优化',
          description: '默认的标题优化规则，用于 AI 优化产品标题',
          positivePrompt: aiTitlePrompt || DEFAULT_POSITIVE_PROMPT,
          negativePrompt: DEFAULT_NEGATIVE_PROMPT,
          isDefault: true
        };
        initialRules = [defaultRule];
      } else {
        // 检查是否有默认规则，如果没有，将第一个规则设为默认
        const hasDefault = initialRules.some(r => r.isDefault);
        if (!hasDefault && initialRules.length > 0) {
          initialRules = initialRules.map((r, index) => 
            index === 0 ? { ...r, isDefault: true } : { ...r, isDefault: false }
          );
        }
      }
      
      setRules(initialRules);
      
      // 找到默认规则
      const defaultRule = initialRules.find(r => r.isDefault);
      if (defaultRule) {
        setDefaultRuleId(defaultRule.id);
        setEditingRule({ ...defaultRule });
      } else {
        setEditingRule(null);
        setDefaultRuleId(null);
      }
      
      setIsCreating(false);
    } else {
      // 关闭时重置状态
      setEditingRule(null);
      setIsCreating(false);
    }
  }, [open, promptRules, aiTitlePrompt]);

  // 暂时禁用自动保存，避免导致白屏问题
  // 用户可以通过点击"完成"按钮来保存

  const handleSave = () => {
    // 保存规则库
    setPromptRules(rules);
    
    // 同步默认规则的正向提示词到 aiTitlePrompt（保持向后兼容）
    const defaultRule = rules.find(r => r.isDefault);
    if (defaultRule) {
      setAITitlePrompt(defaultRule.positivePrompt);
    }
    
    message.success('提示词规则库已保存');
    onCancel();
  };

  const handleCreate = () => {
    const newRule: PromptRule = {
      id: `rule-${Date.now()}`,
      name: '新规则',
      positivePrompt: DEFAULT_POSITIVE_PROMPT,
      negativePrompt: DEFAULT_NEGATIVE_PROMPT,
      description: '',
      isDefault: false
    };
    setEditingRule(newRule);
    setIsCreating(true);
  };

  const handleEdit = (rule: PromptRule) => {
    setEditingRule({ ...rule });
    setIsCreating(false);
  };

  const handleDelete = (ruleId: string) => {
    // 不能删除默认规则
    const rule = rules.find(r => r.id === ruleId);
    if (rule?.isDefault) {
      message.warning('不能删除默认规则');
      return;
    }
    
    setRules(rules.filter(r => r.id !== ruleId));
    if (editingRule?.id === ruleId) {
      setEditingRule(null);
    }
  };

  const handleSetDefault = (ruleId: string) => {
    // 取消其他规则的默认状态
    const updatedRules = rules.map(r => ({
      ...r,
      isDefault: r.id === ruleId
    }));
    setRules(updatedRules);
    setDefaultRuleId(ruleId);
    
    // 如果正在编辑的规则被设为默认，更新编辑状态
    if (editingRule?.id === ruleId) {
      setEditingRule({ ...editingRule, isDefault: true });
    }
  };

  const handleSaveRule = () => {
    if (!editingRule) return;
    
    // 验证规则名称
    if (!editingRule.name.trim()) {
      message.warning('请输入规则名称');
      return;
    }
    
    if (isCreating) {
      setRules([...rules, editingRule]);
      message.success('规则已创建');
      setEditingRule(null);
      setIsCreating(false);
    } else {
      // 编辑模式下，自动保存已经在 useEffect 中处理
      // 这里只是关闭编辑状态
      setEditingRule(null);
      setIsCreating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setIsCreating(false);
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
                  <p style={{ margin: '4px 0' }}>请使用 <Text code>{'{title}'}</Text> 作为原标题的占位符。<Text code>默认规则</Text>将用于标题优化功能。</p>
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
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      width={1000}
      centered
      styles={{
        body: { maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
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
                <List
                  dataSource={rules}
                  renderItem={(rule) => (
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
                      onClick={() => handleEdit(rule)}
                      actions={[
                        <Button
                          type="text"
                          icon={rule.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                          size="small"
                          title={rule.isDefault ? '默认规则' : '设为默认'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(rule.id);
                          }}
                        />,
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(rule);
                          }}
                        />,
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          disabled={rule.isDefault}
                          title={rule.isDefault ? '不能删除默认规则' : '删除'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rule.id);
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{rule.name}</Text>
                            {rule.isDefault && (
                              <Tag color="gold" icon={<StarFilled />} style={{ margin: 0 }}>
                                默认
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: '12px' }} ellipsis={{ tooltip: rule.description || '无描述' }}>
                            {rule.description || '无描述'}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>

          {/* 右侧：编辑区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {editingRule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'auto' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>规则名称：</Text>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="请输入规则名称"
                  />
                </div>

                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>规则描述：</Text>
                  <Input
                    value={editingRule.description || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    placeholder="请输入规则描述（可选）"
                  />
                </div>

                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <Tabs
                    items={[
                      {
                        key: 'positive',
                        label: '正向提示词',
                        children: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text strong>正向提示词：</Text>
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
                              autoSize={{ minRows: 8, maxRows: 20 }}
                              placeholder="请输入正向提示词..."
                              style={{ flex: 1 }}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              告诉 AI 应该做什么，期望的输出格式和内容。修改后会自动保存。
                            </Text>
                          </div>
                        )
                      },
                      {
                        key: 'negative',
                        label: '反向提示词',
                        children: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text strong>反向提示词：</Text>
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
                              autoSize={{ minRows: 6, maxRows: 15 }}
                              placeholder="请输入反向提示词..."
                              style={{ flex: 1 }}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              告诉 AI 不应该做什么，避免的输出格式和内容。
                            </Text>
                          </div>
                        )
                      }
                    ]}
                    defaultActiveKey="positive"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'flex-end',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  <Button onClick={handleCancelEdit}>取消</Button>
                  <Button type="primary" onClick={handleSaveRule}>
                    {isCreating ? '创建' : '保存'}
                  </Button>
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
