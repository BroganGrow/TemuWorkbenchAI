// 图片生成 API 配置（根据官方文档）
// 海外节点：https://api.grsai.com
// 国内直连：https://grsai.dakka.com.cn
const GRSAI_API_BASE_OVERSEAS = 'https://api.grsai.com';
const GRSAI_API_BASE_DOMESTIC = 'https://grsai.dakka.com.cn'; // 注意：国内地址是 grsai.dakka.com.cn，不是 api.grsai.cn

// 获取 API 基础地址
function getApiBase(useDomestic: boolean = false): string {
  return useDomestic ? GRSAI_API_BASE_DOMESTIC : GRSAI_API_BASE_OVERSEAS;
}

function getDrawApi(useDomestic: boolean = false): string {
  return `${getApiBase(useDomestic)}/v1/draw/nano-banana`;
}

function getResultApi(useDomestic: boolean = false): string {
  return `${getApiBase(useDomestic)}/v1/draw/result`;
}

// 模型名称映射
const IMAGE_MODEL_NAME_MAP: Record<string, Record<string, string>> = {
  'nano-banana': {
    'official': 'nano-banana',
    'grsai': 'nano-banana'
  },
  'nano-banana-pro': {
    'official': 'nano-banana-pro',
    'grsai': 'nano-banana-pro'
  },
  'nano-banana-fast': {
    'official': 'nano-banana-fast',
    'grsai': 'nano-banana-fast'
  }
};

interface GenerateImageParams {
  modelId: string;
  prompt: string;
  image?: string; // base64 图片（用于图生图）
  provider: string;
  apiKey: string;
  imageSize?: string; // 图片尺寸，如 '1K', '2K', '4K'
  aspectRatio?: string; // 宽高比，如 'auto', '16:9', '1:1'
  useDomestic?: boolean; // 是否使用国内直连地址
}

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接或稍后重试');
    }
    throw error;
  }
}

/**
 * 提交图片生成任务（带重试机制）
 */
export async function submitDrawTask(params: GenerateImageParams, retryCount: number = 0): Promise<string> {
  const { modelId, prompt, image, provider, apiKey, imageSize = '1K', aspectRatio = 'auto', useDomestic = false } = params; // 默认使用海外地址

  // 获取模型名称
  const modelNameMap = IMAGE_MODEL_NAME_MAP[modelId];
  if (!modelNameMap) {
    throw new Error(`模型 ${modelId} 暂不支持图片生成`);
  }

  const modelName = modelNameMap[provider];
  if (!modelName) {
    throw new Error(`模型 ${modelId} 的供应商 ${provider} 暂不支持图片生成`);
  }

  // 构建请求体（根据官方文档）
  const requestBody: any = {
    model: modelName,
    prompt: prompt,
    aspectRatio: aspectRatio, // 官方文档：驼峰命名
    imageSize: imageSize, // 官方文档：驼峰命名
    webHook: '-1', // 填 "-1" 会立即返回 id，用于轮询获取结果
    shutProgress: false
  };

  // 如果是图生图，添加图片参数（官方文档：urls 数组，可以是 URL 或 Base64）
  if (image) {
    // 提取 base64 部分（去掉 data:image/...;base64, 前缀）
    let imageData = image;
    if (image.startsWith('data:image')) {
      const base64Match = image.match(/data:image\/[^;]+;base64,(.+)/);
      if (base64Match) {
        imageData = base64Match[1];
      }
    }
    // 官方文档：urls 是数组
    requestBody.urls = [imageData];
  }

  const apiUrl = getDrawApi(useDomestic);

  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      },
      30000 // 30秒超时
    );

    if (!response.ok) {
      const text = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        // 如果不是 JSON，使用原始文本
        errorData = { message: text };
      }
      throw new Error(`提交任务失败: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
    }

    // 处理响应
    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // 如果不是 JSON，可能是 SSE 格式，尝试解析
      if (text.trim().startsWith('data: ')) {
        const jsonPart = text.replace(/^data: /, '').trim();
        try {
          data = JSON.parse(jsonPart);
        } catch (e2) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`无法解析响应: ${text.substring(0, 200)}`);
          }
        }
      } else {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(`无法解析响应: ${text.substring(0, 200)}`);
        }
      }
    }

    // 提取 task_id（根据官方文档，webHook 填 "-1" 时返回格式：{"code": 0, "msg": "success", "data": {"id": "xxx"}}）
    const taskId = data.data?.id || data.id || data.task_id || data.taskId;
    if (!taskId) {
      console.error('[Image Service] 响应中未找到 id，完整响应:', JSON.stringify(data, null, 2));
      throw new Error('API 响应格式不正确，未找到 id。请查看控制台日志获取详细信息。');
    }

    console.log('[Image Service] 任务提交成功，任务 ID:', taskId);
    return taskId;
  } catch (error) {
    console.error('[Image Service] 提交任务失败:', error instanceof Error ? error.message : String(error));
    
    // 如果是网络错误且使用国内地址，尝试切换到海外地址
    if (retryCount === 0 && useDomestic) {
      const isNetworkError = 
        error instanceof TypeError || 
        (error instanceof Error && (
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_CONNECTION') ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('network') ||
          error.message.includes('CONNECTION_RESET')
        ));
      
      if (isNetworkError) {
        console.log('[Image Service] 检测到网络错误，切换到海外地址重试...');
        try {
          return await submitDrawTask({ ...params, useDomestic: false }, 1);
        } catch (retryError) {
          throw new Error('网络连接失败：国内地址连接被重置，海外地址也无法连接。建议：1) 检查网络连接 2) 确认 API Key 正确 3) 尝试使用海外地址（api.grsai.com）');
        }
      }
    }
    
    // 如果是连接重置错误，提供明确的提示
    if (error instanceof Error && (
      error.message.includes('ERR_CONNECTION_RESET') ||
      error.message.includes('CONNECTION_RESET') ||
      error.message.includes('连接被重置')
    )) {
      if (useDomestic) {
        throw new Error('国内地址连接被重置。建议切换到"海外节点（api.grsai.com）"后重试。');
      } else {
        throw new Error('海外地址连接失败。请检查：1) 网络连接是否正常 2) API Key 是否正确 3) 防火墙/代理设置');
      }
    }
    
    // 如果是超时或网络错误，提供更友好的错误信息
    if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
      throw new Error('网络连接失败，请检查网络连接或稍后重试。如果持续失败，请尝试切换 API 端点。');
    }
    
    // 如果是解析错误，提供更详细的错误信息
    if (error instanceof Error && error.message.includes('无法解析响应')) {
      throw new Error(`API 响应格式异常：${error.message}。请查看控制台日志获取详细信息。`);
    }
    
    throw error;
  }
}

/**
 * 获取图片生成结果（轮询）
 */
export async function getDrawResult(
  taskId: string, 
  apiKey: string,
  useDomestic: boolean = false, // 默认使用海外地址
  maxRetries: number = 60, 
  interval: number = 2000,
  onProgress?: (message: string) => void
): Promise<string> {
  if (onProgress) onProgress('任务已提交，正在生成图片...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      const apiUrl = getResultApi(useDomestic);
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ id: taskId }) // 根据官方文档，参数名是 id，不是 task_id
        },
        10000 // 10秒超时
      );

      if (!response.ok) {
        const text = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          // 尝试解析 SSE 格式
          if (text.startsWith('data: ')) {
            try {
              errorData = JSON.parse(text.replace(/^data: /, '').trim());
            } catch (e2) {
              errorData = { message: text };
            }
          } else {
            errorData = { message: text };
          }
        }
        throw new Error(`获取结果失败: ${response.status} ${errorData.error?.message || errorData.message || response.statusText}`);
      }

      // 处理响应：可能是 JSON 或 SSE 格式
      const text = await response.text();
      let data: any;
      try {
        // 尝试解析为 JSON
        data = JSON.parse(text);
      } catch (e) {
        // 如果不是 JSON，可能是 SSE 格式 (data: {...})
        if (text.startsWith('data: ')) {
          const jsonPart = text.replace(/^data: /, '').trim();
          try {
            data = JSON.parse(jsonPart);
          } catch (e2) {
            // 如果还是解析失败，尝试提取 JSON 部分
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              data = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error(`无法解析响应: ${text.substring(0, 100)}`);
            }
          }
        } else {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`无法解析响应: ${text.substring(0, 100)}`);
          }
        }
      }
      
      // 检查响应格式
      if (data.code !== undefined && data.code !== 0) {
        const errorMsg = data.msg || data.message || `错误码: ${data.code}`;
        if (data.code === -22) {
          throw new Error('任务不存在，请检查任务 ID 是否正确');
        }
        throw new Error(`获取结果失败: ${errorMsg} (code: ${data.code})`);
      }
      
      // 提取实际数据
      const resultData = data.data || data;

      // 检查任务状态（根据官方文档：status 可能的值是 "running", "succeeded", "failed"）
      const status = resultData.status;
      const progress = resultData.progress; // 0-100
      
      // 成功状态
      if (status === 'succeeded') {
        const results = resultData.results || [];
        if (results.length > 0 && results[0].url) {
          const imageUrl = results[0].url;
          console.log('[Image Service] 图片生成成功');
          return imageUrl;
        }
        throw new Error('任务已完成，但未找到图片 URL');
      }

      // 失败状态（根据官方文档：status === "failed"）
      if (status === 'failed') {
        const failureReason = resultData.failure_reason || '';
        const errorMsg = resultData.error || resultData.failure_reason || '任务执行失败';
        let errorMessage = `任务失败: ${errorMsg}`;
        
        if (failureReason === 'output_moderation') {
          errorMessage = '任务失败: 输出内容违规（已返还积分）';
        } else if (failureReason === 'input_moderation') {
          errorMessage = '任务失败: 输入内容违规（已返还积分）';
        } else if (failureReason === 'error') {
          errorMessage = `任务失败: ${errorMsg}（已返还积分，可尝试重新提交任务）`;
        }
        
        throw new Error(errorMessage);
      }
      
      // 处理中状态
      if (status === 'running') {
        if (onProgress && progress !== undefined) {
          onProgress(`正在生成中... 进度: ${progress}%`);
        }
      } else if (status !== 'succeeded' && status !== 'failed') {
        // 未知状态
        console.warn('[Image Service] 未知任务状态:', status);
      }

      // 任务还在处理中，等待后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      // 如果是最后一次重试，抛出错误
      if (i === maxRetries - 1) {
        throw error;
      }
      // 否则等待后重试
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw new Error('获取结果超时，请稍后重试');
}

/**
 * 生成图片（两步流程：提交任务 → 获取结果）
 * @param params 生成参数
 * @param onProgress 进度回调（可选）
 * @returns 生成的图片 URL
 */
// 存储最后一次的 task_id，供外部获取
let lastTaskId: string | null = null;

export function getLastTaskId(): string | null {
  return lastTaskId;
}

export async function generateImage(
  params: GenerateImageParams,
  onProgress?: (message: string) => void
): Promise<string> {
  const { apiKey } = params;

  try {
    // 第一步：提交任务
    if (onProgress) onProgress('正在提交生成任务...');
    const taskId = await submitDrawTask(params);
    lastTaskId = taskId; // 保存 task_id
    console.log('[Image Service] 任务 ID:', taskId);
    
    // 第二步：轮询获取结果（使用相同的端点设置）
    const useDomestic = params.useDomestic === true; // 只有明确设置为 true 才使用国内地址
    const imageUrl = await getDrawResult(taskId, apiKey, useDomestic, 60, 2000, onProgress);
    
    return imageUrl;
  } catch (error) {
    console.error('[Image Service] 图片生成失败:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

