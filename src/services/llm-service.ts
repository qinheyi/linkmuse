import { LinkMuseSettings } from '../settings';
import axios from 'axios';

export class LLMService {
  private settings: LinkMuseSettings;
  private openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private claudeEndpoint = 'https://api.anthropic.com/v1/messages';

  constructor(settings: LinkMuseSettings) {
    this.settings = settings;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.settings.defaultModel.startsWith('gpt')) {
        await this.testOpenAI();
      } else if (this.settings.defaultModel.startsWith('claude')) {
        await this.testClaude();
      }
      return true;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    }
  }

  private async testOpenAI(): Promise<void> {
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
  }

  private async testClaude(): Promise<void> {
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
}