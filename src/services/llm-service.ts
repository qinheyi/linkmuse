import { LinkMuseSettings } from '../settings';
import axios from 'axios';

export class LLMService {
  private settings: LinkMuseSettings;
  private openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private claudeEndpoint = 'https://api.anthropic.com/v1/messages';
  private siliconflowEndpoint = 'https://api.siliconflow.cn/v1/chat/completions';
  private volcEngineEndpoint = 'https://api.volcengine.com/v1/chat/completions';

  constructor(settings: LinkMuseSettings) {
    this.settings = settings;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.settings.defaultModel.startsWith('gpt')) {
        await this.testOpenAI();
      } else if (this.settings.defaultModel.startsWith('claude')) {
        await this.testClaude();
      } else if (this.settings.defaultModel.startsWith('siliconflow')) {
        await this.testSiliconFlow();
      } else if (this.settings.defaultModel.startsWith('volc')) {
        await this.testVolcEngine();
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
        model: this.settings.defaultModel.replace('siliconflow-', ''),
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

    await axios.post(
      this.volcEngineEndpoint,
      {
        model: this.settings.defaultModel.replace('volc-', ''),
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.volcApiKey}`,
          'Content-Type': 'application/json'
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
      if (this.settings.defaultModel.startsWith('gpt')) {
        return await this.sendOpenAIRequest(prompt);
      } else if (this.settings.defaultModel.startsWith('claude')) {
        return await this.sendClaudeRequest(prompt);
      } else if (this.settings.defaultModel.startsWith('siliconflow')) {
        return await this.sendSiliconFlowRequest(prompt);
      } else if (this.settings.defaultModel.startsWith('volc')) {
        return await this.sendVolcEngineRequest(prompt);
      }
      throw new Error('不支持的模型类型');
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
        model: this.settings.defaultModel.replace('siliconflow-', ''),
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
    const response = await axios.post(
      this.volcEngineEndpoint,
      {
        model: this.settings.defaultModel.replace('volc-', ''),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.volcApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }
}