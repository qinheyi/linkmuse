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

  // 向LLM发送提示并获取响应
  async sendPrompt(prompt: string): Promise<any> {
    try {
      // 根据默认提供商选择API
      switch (this.settings.defaultProvider) {
        case 'openai':
          return await this.sendOpenAIPrompt(prompt);
        case 'claude':
          return await this.sendClaudePrompt(prompt);
        case 'siliconflow':
          return await this.sendSiliconFlowPrompt(prompt);
        case 'volc':
          return await this.sendVolcPrompt(prompt);
        default:
          throw new Error('未知的LLM提供商');
      }
    } catch (error) {
      console.error('LLM API调用失败:', error);
      throw error;
    }
  }

  // 发送提示到硅基流动API
  private async sendSiliconFlowPrompt(prompt: string): Promise<any> {
    if (!this.settings.siliconflowApiKey) {
      throw new Error('未配置硅基流动API密钥');
    }

    const response = await axios.post(
      this.siliconflowEndpoint,
      {
        model: this.settings.siliconflowModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
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

  // 发送提示到火山引擎API
  private async sendVolcPrompt(prompt: string): Promise<any> {
    if (!this.settings.volcApiKey) {
      throw new Error('未配置火山引擎API密钥');
    }

    const response = await axios.post(
      this.volcEngineEndpoint,
      {
        model: this.settings.volcModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
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

  // 分析笔记关联性
  async analyzeNoteRelevance(content1: string, content2: string): Promise<{
    explanation: string,
    relevanceScore: number
  }> {
    const prompt = `请分析以下两个笔记之间的关联性：

笔记1：
${content1}

笔记2：
${content2}

请提供：
1. 关联性解释（简明扼要说明两个笔记之间的关联，必须使用笔记的实际主题名称，而不是使用"内容1"/"内容2
2. 关联程度评分（0-1之间的数值，其中0表示完全无关，1表示高度相关）

请以JSON格式返回结果，格式如下：
{
  "explanation": "关联性解释",
  "relevanceScore": 0.5
}

注意：请直接返回JSON格式的结果，不要包含Markdown代码块标记。`;

    try {
      const response = await this.sendPrompt(prompt);
      
      // 清理响应文本，移除可能的Markdown代码块标记
      const cleanResponse = response.replace(/^```json\n|^```\n|```$/gm, '').trim();
      
      // 尝试解析JSON响应
      try {
        const result = JSON.parse(cleanResponse);
        return {
          explanation: result.explanation || "无法获取关联性解释",
          relevanceScore: parseFloat(result.relevanceScore) || 0
        };
      } catch (parseError) {
        console.error('解析LLM响应失败:', parseError);
        console.debug('清理后的响应:', cleanResponse);
        
        // 如果无法解析JSON，尝试从文本中提取信息
        // 匹配多种可能的解释格式
        const explanationPatterns = [
          /关联性解释[：:]*\s*(.+?)(?=[\n\r]|关联程度|$)/s,
          /分析结果[：:]*\s*(.+?)(?=[\n\r]|关联程度|$)/s,
          /两段内容(.+?)(?=[\n\r]|关联程度|$)/s,
          /(.+?)(?=[\n\r]|关联程度评分|相关度为|相关性为|$)/s
        ];
        
        // 匹配多种可能的评分格式
        const scorePatterns = [
          /关联程度[：:]*\s*(0\.\d+|\d+\.\d+|\d+)/s,
          /相关度[：:]*\s*(0\.\d+|\d+\.\d+|\d+)/s,
          /相关性[：:]*\s*(0\.\d+|\d+\.\d+|\d+)/s,
          /评分[：:]*\s*(0\.\d+|\d+\.\d+|\d+)/s
        ];
        
        let explanation = "无法解析关联性解释";
        let relevanceScore = 0;
        
        // 尝试所有解释模式
        for (const pattern of explanationPatterns) {
          const match = cleanResponse.match(pattern);
          if (match && match[1]) {
            explanation = match[1].trim();
            break;
          }
        }
        
        // 尝试所有评分模式
        for (const pattern of scorePatterns) {
          const match = cleanResponse.match(pattern);
          if (match && match[1]) {
            const score = parseFloat(match[1]);
            if (!isNaN(score) && score >= 0 && score <= 1) {
              relevanceScore = score;
              break;
            }
          }
        }
        
        // 如果找到的评分不在0-1范围内，进行归一化
        if (relevanceScore > 1) {
          relevanceScore = relevanceScore > 10 ? relevanceScore / 100 : relevanceScore / 10;
        }
        
        return { explanation, relevanceScore };
      }
    } catch (error) {
      console.error('分析笔记关联性失败:', error);
      return {
        explanation: "API调用失败，无法分析关联性",
        relevanceScore: 0
      };
    }
  }
}