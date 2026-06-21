/**
 * 云心伴 - AI 服务调用客户端
 * 封装对 Python AI 微服务的 HTTP 调用
 */
import axios, { AxiosInstance } from 'axios';
import { aiServiceConfig } from '../config/ai';
import { logger } from '../utils/logger';

interface ChatRequest {
  user_id: string;
  session_id: string;
  message: string;
  stream?: boolean;
}

interface AnalyzeRequest {
  text: string;
  detect_crisis?: boolean;
}

interface CrisisDetectRequest {
  user_id: string;
  text: string;
  session_id?: string;
}

interface SentimentResult {
  sentiment_score: number;
  sentiment_label: string;
  sentiment_confidence: number;
  emotions: Record<string, number>;
  keywords: string[];
  mood_description: string;
  crisis_detected: boolean;
  crisis_level?: string;
  crisis_score?: number;
  trigger_phrases?: string[];
}

interface CrisisDetectResult {
  is_crisis: boolean;
  risk_level: string;
  combined_score: number;
  alert_type: string;
  trigger_phrases: string[];
  response_action: string;
  response_message?: string;
}

/**
 * AI 服务客户端
 */
class AIServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: aiServiceConfig.baseURL,
      timeout: aiServiceConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('AI 服务请求', { method: config.method, url: config.url });
        return config;
      },
      (error) => Promise.reject(error),
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('AI 服务调用失败', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      },
    );
  }

  /**
   * AI 对话（非流式）
   */
  async chat(request: ChatRequest): Promise<{
    content: string;
    sentiment_score?: number;
    mood_label?: string;
    is_crisis: boolean;
    response_time_ms: number;
  }> {
    const response = await this.client.post(
      aiServiceConfig.endpoints.chat,
      { ...request, stream: false },
    );
    return response.data;
  }

  /**
   * AI 对话（流式 SSE）
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onCrisis?: (alertId: string) => void,
  ): Promise<void> {
    const response = await this.client.post(
      aiServiceConfig.endpoints.chat,
      { ...request, stream: true },
      {
        responseType: 'stream',
        timeout: 60000,
      },
    );

    return new Promise((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              resolve();
              return;
            }
            if (data.startsWith('[ERROR:')) {
              reject(new Error(data));
              return;
            }
            onChunk(data);
          }
          if (line.startsWith('event: crisis_alert') && onCrisis) {
            // 危机事件处理
            onCrisis('');
          }
        }
      });

      response.data.on('end', () => resolve());
      response.data.on('error', reject);
    });
  }

  /**
   * 文本情感分析
   */
  async analyze(text: string, detectCrisis: boolean = true): Promise<SentimentResult> {
    const response = await this.client.post(aiServiceConfig.endpoints.analyze, {
      text,
      detect_crisis: detectCrisis,
    });
    return response.data;
  }

  /**
   * 危机意图检测
   */
  async detectCrisis(request: CrisisDetectRequest): Promise<CrisisDetectResult> {
    const response = await this.client.post(
      aiServiceConfig.endpoints.detectCrisis,
      request,
    );
    return response.data;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get(aiServiceConfig.endpoints.health);
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const aiClient = new AIServiceClient();
