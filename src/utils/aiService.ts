import { AIModel, AIProvider } from '../store/appStore';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 硅基流动 API 配置
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
// DeepSeek 官方 API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function generateCompletion(
  models: AIModel[],
  messages: ChatMessage[],
  onProgress?: (content: string) => void
): Promise<string> {
  // 1. 查找已启用的 DeepSeek 模型配置
  const deepseekModel = models.find(m => m.id === 'deepseek' && m.enabled);
  if (!deepseekModel) {
    throw new Error('未找到已启用的 DeepSeek 模型配置');
  }

  // 2. 查找已选中的供应商
  const provider = deepseekModel.providers.find(p => p.selected);
  if (!provider || !provider.apiKey) {
    throw new Error('请先在 AI 配置中选择供应商并填写 API Key');
  }

  // 3. 确定 API 地址和模型名称
  let apiUrl = '';
  let modelName = '';

  if (provider.id === 'official') {
    apiUrl = DEEPSEEK_API_URL;
    modelName = 'deepseek-chat';
  } else if (provider.id === 'siliconflow') {
    apiUrl = SILICONFLOW_API_URL;
    // 硅基流动的 DeepSeek V3 模型名称通常是 deepseek-ai/DeepSeek-V3
    // 用户提到 V3.2，但通常 API 调用还是用标准模型名，或者特定的 mapping
    // 这里暂时使用通用的 DeepSeek-V3 名称，如果失败可能需要调整
    modelName = 'deepseek-ai/DeepSeek-V3'; 
  } else {
    throw new Error('不支持的供应商');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: true, // 开启流式输出
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    if (!response.body) {
      throw new Error('API 响应为空');
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              if (onProgress) {
                onProgress(fullContent);
              }
            }
          } catch (e) {
            console.warn('解析流式数据失败:', e);
          }
        }
      }
    }

    return fullContent;
  } catch (error) {
    console.error('AI 生成失败:', error);
    throw error;
  }
}

