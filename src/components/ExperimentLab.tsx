import { useState } from 'react';
import { Card, Input, Button, Upload, Image, Space, message, Select, Typography, Divider } from 'antd';
import { 
  UploadOutlined, 
  PictureOutlined, 
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useAppStore } from '../store/appStore';
import { generateImage, getLastTaskId, getDrawResult } from '../utils/imageService';

const { TextArea } = Input;
const { Title, Text } = Typography;

export function ExperimentLab() {
  const { aiModels } = useAppStore();
  
  // 获取 Nano Banana 相关模型
  const nanoBananaModels = aiModels.filter(m => 
    m.id === 'nano-banana' || m.id === 'nano-banana-pro' || m.id === 'nano-banana-fast'
  );
  
  const [selectedModelId, setSelectedModelId] = useState<string>('nano-banana');
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [aspectRatio, setAspectRatio] = useState<string>('auto');
  const [useDomestic, setUseDomestic] = useState<boolean>(false); // 默认使用海外地址，因为国内地址经常连接失败
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setImageMode('image-to-image');
    };
    reader.readAsDataURL(file);
    setUploadedFile({
      uid: '1',
      name: file.name,
      status: 'done',
      originFileObj: file
    } as UploadFile);
    return false; // 阻止自动上传
  };

  // 移除上传的图片
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setImageMode('text-to-image');
  };

  // 生成图片
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入提示词');
      return;
    }

    const selectedModel = nanoBananaModels.find(m => m.id === selectedModelId);
    if (!selectedModel) {
      message.error('请选择有效的模型');
      return;
    }

    const provider = selectedModel.providers.find(p => p.selected && p.apiKey);
    if (!provider || !provider.apiKey) {
      message.error(`请先在 AI 配置中为 ${selectedModel.name} 配置 API Key`);
      return;
    }

    setGenerating(true);
    let loadingMessage: ReturnType<typeof message.loading> | null = null;
    
    const updateProgress = (msg: string) => {
      if (loadingMessage) {
        loadingMessage();
      }
      loadingMessage = message.loading(msg, 0);
    };
    
    try {
      const imageUrl = await generateImage({
        modelId: selectedModelId,
        prompt,
        image: imageMode === 'image-to-image' && uploadedImage ? uploadedImage : undefined,
        provider: provider.id,
        apiKey: provider.apiKey,
        imageSize,
        aspectRatio,
        useDomestic
      }, updateProgress);
      
      if (loadingMessage) {
        loadingMessage();
      }
      setGeneratedImage(imageUrl);
      message.success('图片生成成功！');
    } catch (error) {
      if (loadingMessage) {
        loadingMessage();
      }
      console.error('生成图片失败:', error);
      message.error(`生成失败: ${(error as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  // 下载图片
  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('图片下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('close-experiment'));
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleClose}
            type="text"
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
            实验 - Nano Banana 图片生成
          </Title>
        </div>

        <Card 
          title="生成配置" 
          style={{ marginBottom: '24px', background: 'var(--card-bg)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 模型选择 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>选择模型：</Text>
              <Select
                style={{ width: '100%' }}
                value={selectedModelId}
                onChange={setSelectedModelId}
                options={nanoBananaModels
                  .filter(m => m.enabled)
                  .map(m => ({
                    value: m.id,
                    label: m.name,
                    disabled: !m.providers.some(p => p.selected && p.apiKey)
                  }))
                }
              />
            </div>

            {/* 模式选择 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>生成模式：</Text>
              <Select
                style={{ width: '100%' }}
                value={imageMode}
                onChange={setImageMode}
                options={[
                  { value: 'text-to-image', label: '文生图（Text to Image）' },
                  { value: 'image-to-image', label: '图生图（Image to Image）' }
                ]}
              />
            </div>

            {/* 图片尺寸 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>图片尺寸：</Text>
              <Select
                style={{ width: '100%' }}
                value={imageSize}
                onChange={setImageSize}
                options={[
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '4K', label: '4K' }
                ]}
              />
            </div>

            {/* 宽高比 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>宽高比：</Text>
              <Select
                style={{ width: '100%' }}
                value={aspectRatio}
                onChange={setAspectRatio}
                options={[
                  { value: 'auto', label: '自动（auto）' },
                  { value: '1:1', label: '1:1（正方形）' },
                  { value: '16:9', label: '16:9（横屏）' },
                  { value: '9:16', label: '9:16（竖屏）' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' }
                ]}
              />
            </div>

            {/* API 端点选择 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>API 端点：</Text>
              <Select
                style={{ width: '100%' }}
                value={useDomestic ? 'domestic' : 'overseas'}
                onChange={(value) => setUseDomestic(value === 'domestic')}
                options={[
                  { value: 'domestic', label: '国内直连（grsai.dakka.com.cn）' },
                  { value: 'overseas', label: '海外节点（api.grsai.com）' }
                ]}
              />
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                默认使用海外节点。国内直连地址：grsai.dakka.com.cn
              </Text>
            </div>

            {/* 图片上传（图生图模式） */}
            {imageMode === 'image-to-image' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>上传参考图片：</Text>
                {uploadedImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Image
                      src={uploadedImage}
                      alt="上传的图片"
                      style={{ maxWidth: '400px', maxHeight: '400px', borderRadius: '8px' }}
                      preview={false}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      style={{ position: 'absolute', top: '8px', right: '8px' }}
                    />
                  </div>
                ) : (
                  <Upload
                    accept="image/*"
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>选择图片</Button>
                  </Upload>
                )}
              </div>
            )}

            {/* 提示词输入 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>提示词：</Text>
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请输入图片生成的提示词..."
                rows={4}
                style={{ resize: 'none' }}
              />
            </div>

            {/* 生成按钮 */}
            <Button
              type="primary"
              icon={<PictureOutlined />}
              onClick={handleGenerate}
              loading={generating}
              disabled={!prompt.trim() || (imageMode === 'image-to-image' && !uploadedImage)}
              size="large"
              block
            >
              {generating ? '生成中...' : '生成图片'}
            </Button>
          </Space>
        </Card>

        {/* 生成结果 */}
        {(generatedImage || lastTaskId) && (
          <Card 
            title="生成结果" 
            style={{ background: 'var(--card-bg)' }}
            extra={
              <Space>
                {lastTaskId && !generatedImage && (
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRetryGetResult}
                    loading={generating}
                    type="primary"
                  >
                    重新获取结果
                  </Button>
                )}
                {generatedImage && (
                  <>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownload}
                    >
                      下载
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={handleGenerate}
                      loading={generating}
                    >
                      重新生成
                    </Button>
                  </>
                )}
              </Space>
            }
          >
            {lastTaskId && !generatedImage && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                <Text type="secondary">任务 ID: </Text>
                <Text code>{lastTaskId}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    如果任务已完成但未获取到结果，请点击"重新获取结果"按钮
                  </Text>
                </div>
              </div>
            )}
            {generatedImage ? (
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={generatedImage}
                  alt="生成的图片"
                  style={{ maxWidth: '100%', borderRadius: '8px' }}
                  preview={{
                    mask: '预览'
                  }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Text>等待生成结果...</Text>
              </div>
            )}
          </Card>
        )}

        {/* 使用说明 */}
        <Card 
          title="使用说明" 
          style={{ marginTop: '24px', background: 'var(--card-bg)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>文生图模式：</Text>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                仅使用提示词生成图片，适合从零开始创作。
              </Text>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <Text strong>图生图模式：</Text>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                上传一张参考图片，配合提示词生成新图片，适合在现有图片基础上进行修改或风格转换。
              </Text>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <Text strong>提示词建议：</Text>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                使用清晰、具体的描述，可以包含风格、颜色、构图等元素。例如："一只可爱的猫咪，坐在窗台上，阳光洒在它身上，水彩画风格"。
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}

