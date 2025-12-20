import { AIModel, AIProvider } from '../store/appStore';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// API 配置
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const GRSAI_API_URL = 'https://api.grsai.com/v1/chat/completions';
const XIAOMI_MIMO_API_URL = 'https://api.xiaomimimo.com/v1/chat/completions'; // 小米 MIMO 官方 API

// 模型名称映射
const MODEL_NAME_MAP: Record<string, Record<string, string>> = {
  'deepseek': {
    'official': 'deepseek-chat',
    'siliconflow': 'deepseek-ai/DeepSeek-V3'
  },
  'openai': {
    'official': 'gpt-4o' // 默认使用 GPT-4o，可以根据需要调整
  },
  'claude': {
    'official': 'claude-3-5-sonnet-20241022' // 默认使用 Claude 3.5 Sonnet
  },
  'sora-image': {
    'official': 'sora-image',
    'grsai': 'sora-image'
  },
  'nano-banana-pro': {
    'official': 'nano-banana-pro',
    'grsai': 'nano-banana-pro'
  },
  'nano-banana-fast': {
    'official': 'nano-banana-fast',
    'grsai': 'nano-banana-fast'
  },
  'nano-banana': {
    'official': 'nano-banana',
    'grsai': 'nano-banana'
  },
  'xiaomi-mimo': {
    'official': 'mimo-v2-flash', // 官方模型 ID，根据文档可能是 mimo-v2-flash 或其他
    'siliconflow': 'XiaomiMiMo/MiMo-7B' // 硅基流动上的模型名称
  }
};

// API 地址映射
const API_URL_MAP: Record<string, Record<string, string>> = {
  'deepseek': {
    'official': DEEPSEEK_API_URL,
    'siliconflow': SILICONFLOW_API_URL
  },
  'openai': {
    'official': OPENAI_API_URL
  },
  'claude': {
    'official': ANTHROPIC_API_URL
  },
  'sora-image': {
    'official': GRSAI_API_URL,
    'grsai': GRSAI_API_URL
  },
  'nano-banana-pro': {
    'official': GRSAI_API_URL,
    'grsai': GRSAI_API_URL
  },
  'nano-banana-fast': {
    'official': GRSAI_API_URL,
    'grsai': GRSAI_API_URL
  },
  'nano-banana': {
    'official': GRSAI_API_URL,
    'grsai': GRSAI_API_URL
  },
  'xiaomi-mimo': {
    'official': XIAOMI_MIMO_API_URL,
    'siliconflow': SILICONFLOW_API_URL
  }
};

export async function generateCompletion(
  models: AIModel[],
  messages: ChatMessage[],
  selectedModelId?: string | null,
  onProgress?: (content: string) => void
): Promise<string> {
  // 1. 确定要使用的模型
  let targetModel: AIModel | undefined;
  
  if (selectedModelId) {
    // 如果指定了模型ID，使用指定的模型
    targetModel = models.find(m => m.id === selectedModelId && m.enabled);
    
    // 验证：确保找到的模型就是选择的模型
    if (!targetModel) {
      console.error('[AI Service] 模型选择验证失败:', {
        selectedModelId,
        availableModels: models.map(m => ({ id: m.id, name: m.name, enabled: m.enabled }))
      });
      throw new Error(`未找到已启用的模型 "${selectedModelId}"，请检查模型配置`);
    }
    
    // 验证：确保模型ID匹配
    if (targetModel.id !== selectedModelId) {
      console.error('[AI Service] 模型ID不匹配:', {
        selectedModelId,
        foundModelId: targetModel.id,
        foundModelName: targetModel.name
      });
      throw new Error(`模型ID不匹配：选择了 "${selectedModelId}"，但找到的是 "${targetModel.id}"`);
    }
    
    console.log('[AI Service] 使用选择的模型:', {
      selectedModelId,
      modelName: targetModel.name,
      modelId: targetModel.id
    });
  } else {
    // 否则使用第一个已启用的模型
    targetModel = models.find(m => m.enabled);
    console.warn('[AI Service] 未指定模型ID，使用第一个已启用的模型:', {
      modelId: targetModel?.id,
      modelName: targetModel?.name
    });
  }
  
  if (!targetModel) {
    throw new Error('未找到已启用的 AI 模型配置');
  }

  // 2. 查找已选中的供应商
  const provider = targetModel.providers.find(p => p.selected);
  if (!provider || !provider.apiKey) {
    throw new Error(`请先在 AI 配置中为 ${targetModel.name} 选择供应商并填写 API Key`);
  }

  // 3. 确定 API 地址和模型名称
  const apiUrlMap = API_URL_MAP[targetModel.id];
  const modelNameMap = MODEL_NAME_MAP[targetModel.id];
  
  if (!apiUrlMap || !modelNameMap) {
    throw new Error(`模型 ${targetModel.name} 暂不支持`);
  }
  
  const apiUrl = apiUrlMap[provider.id];
  const modelName = modelNameMap[provider.id];
  
  if (!apiUrl || !modelName) {
    throw new Error(`模型 ${targetModel.name} 的供应商 ${provider.name} 暂不支持`);
  }
  
  // 4. 输出最终使用的配置（用于调试）
  console.log('[AI Service] 最终配置:', {
    modelId: targetModel.id,
    modelName: targetModel.name,
    providerId: provider.id,
    providerName: provider.name,
    apiUrl,
    apiModelName: modelName,
    selectedModelId // 用于对比
  });

  // 4. 根据模型类型构建请求体
  let requestBody: any;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (targetModel.id === 'claude') {
    // Claude API 使用不同的格式
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    
    // 转换消息格式：Claude 使用不同的消息结构
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

    requestBody = {
      model: modelName,
      messages: conversationMessages,
      max_tokens: 2000,
      ...(systemMessage && { system: systemMessage.content })
    };
  } else {
    // 标准 OpenAI 兼容格式
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
    requestBody = {
      model: modelName,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    };
  }

  try {
    // 记录实际发送的请求（用于调试）
    console.log('[AI Service] 发送的请求:', {
      apiUrl,
      model: requestBody.model,
      requestBody: JSON.stringify(requestBody, null, 2)
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
    }
    
    // 记录响应头中的模型信息（如果有）
    const responseModel = response.headers.get('x-model') || response.headers.get('model');
    if (responseModel) {
      console.log('[AI Service] API 响应中的模型信息:', responseModel);
    }

    if (!response.body) {
      throw new Error('API 响应为空');
    }

    // 处理响应（Claude 和 OpenAI 兼容格式不同）
    if (targetModel.id === 'claude') {
      // Claude API 返回的是 SSE 格式，但结构略有不同
      if (!response.body) {
        throw new Error('API 响应为空');
      }
      
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
              // Claude 的响应格式：data.delta.text 或 data.content[0].text
              const content = data.delta?.text || data.content?.[0]?.text || '';
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

      // 打印完整的返回结果
      console.log('[AI Service] 模型返回的完整结果:', {
        modelId: targetModel.id,
        modelName: targetModel.name,
        content: fullContent,
        contentLength: fullContent.length
      });
      console.log('[AI Service] 返回内容:', fullContent);

      return fullContent;
    } else {
      // 标准 OpenAI 兼容格式
      if (!response.body) {
        throw new Error('API 响应为空');
      }

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
              
              // 检查响应中是否包含模型信息
              if (data.model && !fullContent) {
                console.log('[AI Service] API 响应中声明的模型:', data.model);
              }
              
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

      // 打印完整的返回结果
      console.log('[AI Service] 模型返回的完整结果:', {
        modelId: targetModel.id,
        modelName: targetModel.name,
        content: fullContent,
        contentLength: fullContent.length
      });
      console.log('[AI Service] 返回内容:', fullContent);

      return fullContent;
    }
  } catch (error) {
    console.error('AI 生成失败:', error);
    throw error;
  }
}

