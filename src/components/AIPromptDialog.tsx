import { Modal, Input, Button, Typography, Alert, Space, Tabs } from 'antd';
import { useAppStore } from '../store/appStore';
import { useState, useEffect } from 'react';
import { FileTextOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface AIPromptDialogProps {
  open: boolean;
  onCancel: () => void;
}

const DEFAULT_POSITIVE_PROMPT = `请优化以下 Temu 产品标题，使其更具吸引力，包含高搜索量的关键词，符合 SEO 标准，且通顺自然。
请直接返回优化后的标题（包含中文和英文，用括号隔开，格式如：中文标题 (English Title)），不要包含其他解释或引导语。

原标题：{title}`;

const DEFAULT_NEGATIVE_PROMPT = `不要使用过于夸张的词汇，不要包含特殊符号，不要超过合理的长度。`;

export function AIPromptDialog({ open, onCancel }: AIPromptDialogProps) {
  const { aiTitlePrompt, setAITitlePrompt } = useAppStore();
  const [positivePrompt, setPositivePrompt] = useState(aiTitlePrompt);
  const [negativePrompt, setNegativePrompt] = useState('');

  useEffect(() => {
    if (open) {
      setPositivePrompt(aiTitlePrompt);
      // 反向提示词暂时为空，后续可以从规则库中选择
      setNegativePrompt('');
    }
  }, [open, aiTitlePrompt]);

  const handleSave = () => {
    // 保存时，将正向提示词保存到 aiTitlePrompt（保持向后兼容）
    // 反向提示词可以单独存储或合并到提示词中
    setAITitlePrompt(positivePrompt);
    onCancel();
  };

  const handleResetPositive = () => {
    setPositivePrompt(DEFAULT_POSITIVE_PROMPT);
  };

  const handleResetNegative = () => {
    setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>AI 标题优化规则</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText="保存"
      cancelText="取消"
      width={600}
      centered
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <Alert
          message="使用说明"
          description={
            <div>
              <p>自定义 AI 标题优化的提示词（Prompt）。</p>
              <p>正向提示词：告诉 AI 应该做什么；反向提示词：告诉 AI 不应该做什么。</p>
              <p>请使用 <Text code>{'{title}'}</Text> 作为原标题的占位符。</p>
            </div>
          }
          type="info"
          showIcon
        />

        <Tabs
          items={[
            {
              key: 'positive',
              label: '正向提示词',
              children: (
                <div>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>正向提示词：</Text>
                    <Button type="link" size="small" onClick={handleResetPositive}>恢复默认</Button>
                  </div>
                  <TextArea
                    value={positivePrompt}
                    onChange={(e) => setPositivePrompt(e.target.value)}
                    autoSize={{ minRows: 6, maxRows: 12 }}
                    placeholder="请输入正向提示词..."
                  />
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    告诉 AI 应该做什么，期望的输出格式和内容。
                  </Text>
                </div>
              )
            },
            {
              key: 'negative',
              label: '反向提示词',
              children: (
                <div>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>反向提示词：</Text>
                    <Button type="link" size="small" onClick={handleResetNegative}>恢复默认</Button>
                  </div>
                  <TextArea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    autoSize={{ minRows: 4, maxRows: 10 }}
                    placeholder="请输入反向提示词（可选）..."
                  />
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    告诉 AI 不应该做什么，避免的输出格式和内容。反向提示词为可选，留空表示不使用。
                  </Text>
                </div>
              )
            }
          ]}
          defaultActiveKey="positive"
        />
      </div>
    </Modal>
  );
}

