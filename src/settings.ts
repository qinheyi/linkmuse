// 定义插件设置接口
export interface LinkMuseSettings {
  // API配置
  openaiApiKey: string;
  claudeApiKey: string;
  siliconflowApiKey: string;
  volcApiKey: string;
  defaultModel: string;
  defaultProvider: string; // 默认LLM提供商
  
  // 功能设置
  maxNotesToAnalyze: number;
  saveChainOfThought: boolean;
  inspirationCount: number;
  
  // 高级设置
  debugMode: boolean;
  customPromptTemplates: Record<string, string>;
  siliconflowModel: string;
  volcModel: string;
}

// 定义默认设置
export const DEFAULT_SETTINGS: LinkMuseSettings = {
  // API配置
  openaiApiKey: '',
  claudeApiKey: '',
  siliconflowApiKey: '',
  volcApiKey: '',
  defaultModel: 'gpt-4',
  defaultProvider: 'openai', // 默认使用OpenAI
  
  // 功能设置
  maxNotesToAnalyze: 20,
  saveChainOfThought: true,
  inspirationCount: 3,
  
  // 高级设置
  debugMode: false,
  customPromptTemplates: {
    bidirectionalLinks: '分析以下笔记内容，找出它们之间可能存在的关联：\n{{notes}}',
    inspiration: '基于以下笔记内容，生成{{count}}个创新的灵感和想法：\n{{notes}}',
    multimedia: '分析以下{{type}}内容，提供详细的理解和总结：\n{{content}}'
  },
  siliconflowModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  volcModel: 'deepseek-r1-distill-qwen-32b-250120'
};

// 定义LLM提供商选项
export const LLM_PROVIDERS = {
  openai: 'OpenAI',
  claude: 'Claude',
  siliconflow: '硅基流动',
  volc: '火山引擎'
};