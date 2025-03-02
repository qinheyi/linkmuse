import { LinkMuseSettings } from '../settings';
import { App } from 'obsidian';
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

  async generateInspiration(noteData: [string, string]): Promise<string> {
    const [noteTitle, noteContent] = noteData;
    const prompt = this.settings.customPromptTemplates.inspiration
      .replace('{{title1}}', noteTitle)
      .replace('{{content1}}', this.truncateContent(noteContent, 2000));
    
    return await this.sendPrompt(prompt);
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
    
    const response = await axios.post(
      this.volcEngineEndpoint,
      {
        model: this.settings.volcModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.settings.volcApiKey}`,
          'Content-Type': 'application/json',
          'X-Request-Id': requestId
        }
      }
    );

    return response.data.choices[0].message.content;
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

  // 发送提示到OpenAI API
  private async sendOpenAIPrompt(prompt: string): Promise<any> {
    if (!this.settings.openaiApiKey) {
      throw new Error('未配置OpenAI API密钥');
    }

    const response = await axios.post(
      this.openaiEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
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

  // 发送提示到Claude API
  private async sendClaudePrompt(prompt: string): Promise<any> {
    if (!this.settings.claudeApiKey) {
      throw new Error('未配置Claude API密钥');
    }

    const response = await axios.post(
      this.claudeEndpoint,
      {
        model: this.settings.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
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

    try {
      console.log("准备向火山引擎发送请求");
      
      // 临时测试方案：如果火山引擎出现问题，返回模拟数据
      console.log("火山引擎API集成尚未完全解决，目前返回模拟数据");
      return "模拟的火山引擎API响应：" + prompt.substring(0, 50) + "...";
      
      /* 暂时注释掉实际API调用，直到API问题解决
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
      */
    } catch (error) {
      console.error("火山引擎API调用失败:", error);
      throw new Error(`火山引擎API调用失败: ${error.message}`);
    }
  }

  // 分析笔记关联性
  async analyzeNoteRelevance(title1: string, title2: string, content1: string, content2: string): Promise<{
    explanation: string,
    relevanceScore: number
  }> {
    // console.log(`开始分析笔记关联性: "${title1}" 和 "${title2}"`);
    
    try {
      // 获取设置中的笔记关联提示模板
      const promptTemplate = this.settings.customPromptTemplates?.noteRelevance || 
        '请分析以下两篇笔记的潜在关联性。\n\n第一篇笔记标题: {{title1}}\n内容: {{content1}}\n\n第二篇笔记标题: {{title2}}\n内容: {{content2}}\n\n请描述这两篇笔记之间可能存在的关联，并给出一个0-1之间的关联度分数。\n输出格式为JSON: {"explanation": "关联解释", "relevanceScore": 关联度分数}';
      
      // console.log("使用笔记关联分析提示模板:", promptTemplate.substring(0, 50) + "...");
      
      // 构建完整提示
      const prompt = promptTemplate
        .replace('{{title1}}', title1)
        .replace('{{title2}}', title2)
        .replace('{{content1}}', this.truncateContent(content1, 1000))
        .replace('{{content2}}', this.truncateContent(content2, 1000));
      
      // console.log(`提示长度: ${prompt.length} 字符`);
      
      // 检查是否配置了API密钥
      const hasApiKey = this.settings.defaultProvider === 'siliconflow' && this.settings.siliconflowApiKey || 
                        this.settings.defaultProvider === 'volc' && this.settings.volcApiKey;
      
      // 如果没有配置API密钥，抛出错误提示用户配置API密钥
      if (!hasApiKey) {
        const provider = this.settings.defaultProvider === 'siliconflow' ? 'SiliconFlow' : '火山引擎';
        throw new Error(`未配置${provider} API密钥，请在设置中配置有效的API密钥`);
      }
      
      // 发送API请求
      // console.log("发送API请求获取笔记关联分析");
      const response = await this.sendPrompt(prompt);
      // console.log("API响应原始内容:", response);
      
      // 尝试解析JSON响应
      let result;
      try {
        if (typeof response === 'string') {
          // 尝试从文本中提取JSON
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("响应中未找到JSON格式");
          }
        } else if (typeof response === 'object') {
          result = response;
        } else {
          throw new Error("无法识别的响应格式");
        }
        
        // console.log("解析后的结果:", result);
        
        // 验证结果格式
        if (!result.explanation || typeof result.relevanceScore !== 'number') {
          throw new Error("响应格式不符合预期");
        }
        
        // 确保分数在0-1范围内
        result.relevanceScore = Math.max(0, Math.min(1, result.relevanceScore));
        
        return {
          explanation: result.explanation,
          relevanceScore: result.relevanceScore
        };
      } catch (parseError) {
        console.error("解析API响应时出错:", parseError);
        console.error("响应内容:", response);
        throw new Error(`解析响应失败: ${parseError.message}`);
      }
    } catch (error) {
      console.error("分析笔记关联性时出错:", error);
      throw error;
    }
  }
  
  // 辅助方法：截断内容，确保不超过最大长度
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + "...（内容已截断）";
  }
}