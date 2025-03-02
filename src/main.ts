import { Plugin, PluginSettingTab, App, Setting, Notice, Modal, MarkdownView } from 'obsidian';
import { DEFAULT_SETTINGS, LinkMuseSettings } from './settings';
import { SidebarView } from './ui/sidebar';
import { LLMService } from './services/llm-service';
import { setupHeaderLogo } from './ui/header';

export default class LinkMuse extends Plugin {
  settings: LinkMuseSettings;
  sidebarView: SidebarView;
  llmService: LLMService;

  async onload() {
    console.log('加载 LinkMuse 插件');
    
    // 加载设置
    await this.loadSettings();
    
    // 添加设置选项卡
    this.addSettingTab(new LinkMuseSettingTab(this.app, this));
    
    // 初始化LLM服务
    this.llmService = new LLMService(this.settings);
    
    // 注册视图
    this.registerView(
      'linkmuse-sidebar',
      (leaf) => (this.sidebarView = new SidebarView(leaf, this))
    );
    
    // 添加图标到左侧边栏
    this.addRibbonIcon('brain-cog', 'LinkMuse', () => {
      this.activateView();
    });
    
    // 设置顶部面板Logo
    setupHeaderLogo(this);
    
    // 注册命令
    this.addCommands();
  }
  
  async onunload() {
    console.log('卸载 LinkMuse 插件');
    this.app.workspace.detachLeavesOfType('linkmuse-sidebar');
  }
  
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  async activateView() {
    const workspace = this.app.workspace;
    
    // 检查视图是否已经打开
    const existingLeaves = workspace.getLeavesOfType('linkmuse-sidebar');
    if (existingLeaves.length) {
      workspace.revealLeaf(existingLeaves[0]);
      return;
    }
    
    // 创建新的侧边栏视图
    const leaf = workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: 'linkmuse-sidebar',
      active: true,
    });
    
    workspace.revealLeaf(leaf);
  }
  
  addCommands() {
    // 智能双向关联命令
    this.addCommand({
      id: 'generate-bidirectional-links',
      name: '生成智能双向关联',
      callback: () => this.generateBidirectionalLinks(),
    });
    
    // 组合关联分析命令
    this.addCommand({
      id: 'analyze-note-combinations',
      name: '分析笔记组合关联',
      callback: () => this.analyzeNoteCombinations(),
    });
    
    // 灵感跃迁命令
    this.addCommand({
      id: 'generate-inspiration',
      name: '生成灵感跃迁',
      callback: () => this.generateInspiration(),
    });
    
    // 多媒体内容理解命令
    this.addCommand({
      id: 'analyze-multimedia',
      name: '分析多媒体内容',
      callback: () => this.analyzeMultimedia(),
    });
  }
  
  async generateBidirectionalLinks() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('请先打开一个笔记');
      return;
    }
    
    new Notice('正在生成智能双向关联...');
    // 实际功能将在后续实现
  }
  
  async analyzeNoteCombinations() {
    new Notice('正在分析笔记组合关联...');
    // 实际功能将在后续实现
  }
  
  async generateInspiration() {
    new Notice('正在生成灵感跃迁...');
    // 实际功能将在后续实现
  }
  
  async analyzeMultimedia() {
    new Notice('正在分析多媒体内容...');
    // 实际功能将在后续实现
  }
}

class LinkMuseSettingTab extends PluginSettingTab {
  plugin: LinkMuse;
  
  constructor(app: App, plugin: LinkMuse) {
    super(app, plugin);
    this.plugin = plugin;
  }
  
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'LinkMuse 设置' });
    
    // API配置部分
    containerEl.createEl('h3', { text: 'API 配置' });
    
    // 注释掉OpenAI和Claude的设置
    /*
    new Setting(containerEl)
      .setName('OpenAI API 密钥')
      .setDesc('输入您的OpenAI API密钥')
      .addText((text) =>
        text
          .setPlaceholder('sk-...')
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.openaiApiKey = value;
            await this.plugin.saveSettings();
          })
      );
      
    new Setting(containerEl)
      .setName('Claude API 密钥')
      .setDesc('输入您的Anthropic Claude API密钥（可选）')
      .addText((text) =>
        text
          .setPlaceholder('sk-ant-...')
          .setValue(this.plugin.settings.claudeApiKey)
          .onChange(async (value) => {
            this.plugin.settings.claudeApiKey = value;
            await this.plugin.saveSettings();
          })
      );
    */
      
    new Setting(containerEl)
      .setName('硅基流动 API 密钥')
      .setDesc('输入您的硅基流动 API密钥（可选）')
      .addText((text) =>
        text
          .setPlaceholder('sf-...')
          .setValue(this.plugin.settings.siliconflowApiKey)
          .onChange(async (value) => {
            this.plugin.settings.siliconflowApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('硅基流动模型')
      .setDesc('选择要使用的硅基流动模型')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', 'DeepSeek-R1-Distill-Qwen-7B')
          .addOption('Qwen/Qwen2-7B-Instruct', 'Qwen2-7B-Instruct')
          .addOption('internlm/internlm2_5-7b-chat', 'InternLM2-7B-Chat')
          .addOption('THUDM/glm-4-9b-chat', 'GLM-4-9B-Chat')
          .setValue(this.plugin.settings.siliconflowModel)
          .onChange(async (value) => {
            this.plugin.settings.siliconflowModel = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('测试硅基流动连接')
      .setDesc('测试硅基流动API连接是否正常')
      .addButton((button) =>
        button.setButtonText('测试连接').onClick(async () => {
          button.setButtonText('测试中...');
          try {
            if (!this.plugin.settings.siliconflowApiKey) {
              new Notice('请先配置硅基流动 API 密钥');
              return;
            }
            const result = await this.plugin.llmService.testSiliconFlow();
            new Notice(`硅基流动 API连接测试: ${result ? '成功' : '失败'}`);
          } catch (error) {
            new Notice(`硅基流动 API连接测试失败: ${error.message}`);
          } finally {
            button.setButtonText('测试连接');
          }
        })
      );
      
    new Setting(containerEl)
      .setName('火山引擎 API 密钥')
      .setDesc('输入您的火山引擎 API密钥（可选）')
      .addText((text) =>
        text
          .setPlaceholder('volc-...')
          .setValue(this.plugin.settings.volcApiKey)
          .onChange(async (value) => {
            this.plugin.settings.volcApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('火山引擎模型')
      .setDesc('选择要使用的火山引擎模型')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('deepseek-r1-250120', 'DeepSeek-R1')
          .addOption('deepseek-v3-241226', 'DeepSeek-V3')
          .addOption('deepseek-r1-distill-qwen-32b-250120', 'DeepSeek-R1-Distill-Qwen-32B')
          .addOption('deepseek-r1-distill-qwen-7b-250120', 'DeepSeek-R1-Distill-Qwen-7B')
          .setValue(this.plugin.settings.volcModel)
          .onChange(async (value) => {
            this.plugin.settings.volcModel = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('测试火山引擎连接')
      .setDesc('测试火山引擎API连接是否正常')
      .addButton((button) =>
        button.setButtonText('测试连接').onClick(async () => {
          button.setButtonText('测试中...');
          try {
            if (!this.plugin.settings.volcApiKey) {
              new Notice('请先配置火山引擎 API 密钥');
              return;
            }
            const result = await this.plugin.llmService.testVolcEngine();
            new Notice(`火山引擎 API连接测试: ${result ? '成功' : '失败'}`);
          } catch (error) {
            new Notice(`火山引擎 API连接测试失败: ${error.message}`);
          } finally {
            button.setButtonText('测试连接');
          }
        })
      );
      
    // 功能设置部分
    containerEl.createEl('h3', { text: '功能设置' });
    
    new Setting(containerEl)
      .setName('分析笔记数量')
      .setDesc('设置智能关联分析时的最大笔记数量')
      .addSlider((slider) =>
        slider
          .setLimits(5, 50, 5)
          .setValue(this.plugin.settings.maxNotesToAnalyze)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxNotesToAnalyze = value;
            await this.plugin.saveSettings();
          })
      );
      
    new Setting(containerEl)
      .setName('保存思维链')
      .setDesc('是否保存LLM分析过程的思维链')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.saveChainOfThought)
          .onChange(async (value) => {
            this.plugin.settings.saveChainOfThought = value;
            await this.plugin.saveSettings();
          })
      );
      
    new Setting(containerEl)
      .setName('灵感生成数量')
      .setDesc('每次灵感跃迁生成的灵感数量')
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.inspirationCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.inspirationCount = value;
            await this.plugin.saveSettings();
          })
      );
      
    // 高级设置部分
    containerEl.createEl('h3', { text: '高级设置' });
    
    new Setting(containerEl)
      .setName('测试API连接')
      .setDesc('测试当前配置的API连接是否正常')
      .addButton((button) =>
        button.setButtonText('测试连接').onClick(async () => {
          button.setButtonText('测试中...');
          try {
            const result = await this.plugin.llmService.testConnection();
            new Notice(`API连接测试: ${result ? '成功' : '失败'}`);
          } catch (error) {
            new Notice(`API连接测试失败: ${error.message}`);
          } finally {
            button.setButtonText('测试连接');
          }
        })
      );
  }
}