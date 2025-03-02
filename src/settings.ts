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
  maxLinksToGenerate: number;
  saveChainOfThought: boolean;
  inspirationCount: number;
  useFullContent: boolean; // 是否使用全文进行分析
  
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
  defaultProvider: 'siliconflow', // 默认使用硅基流动
  
  // 功能设置
  maxNotesToAnalyze: 20,
  maxLinksToGenerate: 5,
  saveChainOfThought: true,
  inspirationCount: 5,
  useFullContent: false, // 默认使用截断内容
  
  // 高级设置
  debugMode: false,
  customPromptTemplates: {
    bidirectionalLinks: '分析以下笔记内容，找出它们之间可能存在的关联：\n{{notes}}',
    inspiration: `基于以下笔记内容，请生成有创意的灵感跃迁内容：

笔记标题: {{title1}}
笔记内容:
{{content1}}

请从以下多个角度进行灵感跃迁，生成5个有启发性的想法：
1. 核心概念延伸：从笔记的核心概念出发，向相关领域延伸
2. 跨学科联系：将笔记内容与其他领域知识建立联系
3. 实践应用：思考如何将笔记中的概念应用到实际问题中
4. 反向思考：从相反的角度审视笔记内容
5. 未来发展：预测相关概念或领域的未来发展趋势

每个灵感请用一个段落描述，包含标题和简要说明。尽量提供具体、有启发性、可行的想法，避免过于抽象或笼统的表述。`,
    multimedia: '分析以下{{type}}内容，提供详细的理解和总结：\n{{content}}',
    noteRelevance: `请分析以下两个笔记之间的关联性：

笔记1标题：{{title1}}
笔记1内容：
{{content1}}

笔记2标题：{{title2}}
笔记2内容：
{{content2}}

请提供：
1. 关联性解释（首先分析笔记标题之间的关联性，这是最主要的判断依据；然后参考笔记内容作为辅助，进一步理解标题可能表达的含义。如果标题之间没有明显关联，则分析笔记内容可能想要阐述的核心意义，再进行关联分析）
2. 关联程度评分（0-1之间的数值，其中0表示完全无关，1表示高度相关）。

请以JSON格式返回结果，格式如下：
{
  "explanation": "关联性解释",
  "relevanceScore": 0.5
}

注意：请直接返回JSON格式的结果，不要包含Markdown代码块标记。`
  },
  siliconflowModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  volcModel: 'deepseek-r1-distill-qwen-32b-250120'
};

// 定义LLM提供商选项
export const LLM_PROVIDERS = {
  siliconflow: 'SiliconFlow',
  volc: '火山引擎'
};