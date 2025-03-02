import { LinkMuseSettings } from '../settings';
import axios from 'axios';

export class LLMService {
  private settings: LinkMuseSettings;
  private app: App;
  private openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private claudeEndpoint = 'https://api.anthropic.com/v1/messages';
  private siliconflowEndpoint = 'https://api.siliconflow.cn/v1/chat/completions';
  private volcEngineEndpoint = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  constructor(settings: LinkMuseSettings, app: App) {
    this.settings = settings;
    this.app = app;
  }

  async testConnection(): Promise<boolean> {
    try {
      // 根据默认提供商进行测试
      switch (this.settings.defaultProvider) {
        case 'openai':
          await this.testOpenAI();
          break;
        case 'claude':
          await this.testClaude();
          break;
        case 'siliconflow':
          await this.testSiliconFlow();
          break;
        case 'volc':
          await this.testVolcEngine();
          break;
        default:
          throw new Error('未知的LLM提供商');
      }
      return true;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    }
  }

  // 测试OpenAI API连接
  async testOpenAI(): Promise<boolean> {
    if (!this.settings.openaiApiKey) {
      throw new Error('未配置OpenAI API密钥');
    }

    await axios.post(
      this.openaiEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  }

  // 测试Claude API连接
  async testClaude(): Promise<boolean> {
    if (!this.settings.claudeApiKey) {
      throw new Error('未配置Claude API密钥');
    }

    await axios.post(
      this.claudeEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      },
      {
        headers: {
          'x-api-key': this.settings.claudeApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  }

  // 测试硅基流动API连接
  async testSiliconFlow(): Promise<boolean> {
    if (!this.settings.siliconflowApiKey) {
      throw new Error('未配置硅基流动API密钥');
    }

    await axios.post(
      this.siliconflowEndpoint,
      {
        model: this.settings.siliconflowModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.siliconflowApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  }

  // 测试火山引擎API连接
  async testVolcEngine(): Promise<boolean> {
    if (!this.settings.volcApiKey) {
      throw new Error('未配置火山引擎API密钥');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const requestId = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

    await axios.post(
      this.volcEngineEndpoint,
      {
        model: this.settings.volcModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.volcApiKey}`,
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      }
    );
    return true;
  }

  async generateBidirectionalLinks(notes: string[]): Promise<string> {
    const prompt = this.settings.customPromptTemplates.bidirectionalLinks
      .replace('{{notes}}', notes.join('\n---\n'));
    
    return await this.sendRequest(prompt);
  }

  async generateInspiration(notes: string[]): Promise<string> {
    const prompt = this.settings.customPromptTemplates.inspiration
      .replace('{{notes}}', notes.join('\n---\n'))
      .replace('{{count}}', this.settings.inspirationCount.toString());
    
    return await this.sendRequest(prompt);
  }

  async analyzeMultimedia(type: string, content: string): Promise<string> {
    const prompt = this.settings.customPromptTemplates.multimedia
      .replace('{{type}}', type)
      .replace('{{content}}', content);
    
    return await this.sendRequest(prompt);
  }

  private async sendRequest(prompt: string): Promise<string> {
    try {
      // 根据默认提供商选择请求方式
      switch (this.settings.defaultProvider) {
        case 'openai':
          return await this.sendOpenAIRequest(prompt);
        case 'claude':
          return await this.sendClaudeRequest(prompt);
        case 'siliconflow':
          return await this.sendSiliconFlowRequest(prompt);
        case 'volc':
          return await this.sendVolcEngineRequest(prompt);
        default:
          throw new Error('不支持的LLM提供商');
      }
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  private async sendOpenAIRequest(prompt: string): Promise<string> {
    const response = await axios.post(
      this.openaiEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async sendClaudeRequest(prompt: string): Promise<string> {
    const response = await axios.post(
      this.claudeEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'x-api-key': this.settings.claudeApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  }

  private async sendSiliconFlowRequest(prompt: string): Promise<string> {
    const response = await axios.post(
      this.siliconflowEndpoint,
      {
        model: this.settings.siliconflowModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.siliconflowApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async sendVolcEngineRequest(prompt: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const requestId = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;
    
    const response = await this.app.request({
      url: this.volcEngineEndpoint,
      method: 'POST',
      body: JSON.stringify({
        model: this.settings.volcModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }),
      headers: {
        'Authorization': `Bearer ${this.settings.volcApiKey}`,
        'Content-Type': 'application/json',
        'X-Request-Id': requestId
      }
    });

    const responseData = JSON.parse(response);
    return responseData.choices[0].message.content;
  }
}