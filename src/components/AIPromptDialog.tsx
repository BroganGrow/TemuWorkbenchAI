import { Modal, Input, Button, Typography, Alert, Space } from 'antd';
import { useAppStore } from '../store/appStore';
import { useState, useEffect } from 'react';
import { FileTextOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface AIPromptDialogProps {
  open: boolean;
  onCancel: () => void;
}

const DEFAULT_PROMPT = `请优化以下 Temu 产品标题，使其更具吸引力，包含高搜索量的关键词，符合 SEO 标准，且通顺自然。
请直接返回优化后的标题（包含中文和英文，用括号隔开，格式如：中文标题 (English Title)），不要包含其他解释或引导语。

原标题：{title}`;

export function AIPromptDialog({ open, onCancel }: AIPromptDialogProps) {
  const { aiTitlePrompt, setAITitlePrompt } = useAppStore();
  const [prompt, setPrompt] = useState(aiTitlePrompt);

  useEffect(() => {
    if (open) {
      setPrompt(aiTitlePrompt);
    }
  }, [open, aiTitlePrompt]);

  const handleSave = () => {
    setAITitlePrompt(prompt);
    onCancel();
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
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
              <p>自定义 AI 优化的提示词（Prompt）。</p>
              <p>请使用 <Text code>{'{title}'}</Text> 作为原标题的占位符。</p>
            </div>
          }
          type="info"
          showIcon
        />

        <div>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>提示词内容：</Text>
            <Button type="link" size="small" onClick={handleReset}>恢复默认</Button>
          </div>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoSize={{ minRows: 6, maxRows: 12 }}
            placeholder="请输入提示词..."
          />
        </div>
        
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            提示：清晰、具体的指令能让 AI 生成更好的结果。您可以指定语言风格、关键词要求、字数限制等。
          </Text>
        </div>
      </div>
    </Modal>
  );
}

