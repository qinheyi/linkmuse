import { Plugin, PluginSettingTab, App, Setting, Notice, Modal, MarkdownView } from 'obsidian';
import { DEFAULT_SETTINGS, LinkMuseSettings } from './settings';
import { SidebarView } from './ui/sidebar';
import { LLMService } from './services/llm-service';
import { NoteLinkService } from './services/note-link-service';
import { setupHeaderLogo } from './ui/header';

export default class LinkMuse extends Plugin {
  settings: LinkMuseSettings;
  sidebarView: SidebarView;
  llmService: LLMService;
  noteLinkService: NoteLinkService;

  async onload() {
    console.log('加载 LinkMuse 插件');
    
    // 加载设置
    await this.loadSettings();
    
    // 添加设置选项卡
    this.addSettingTab(new LinkMuseSettingTab(this.app, this));
    
    // 初始化LLM服务
    this.llmService = new LLMService(this.settings, this.app);
    
    // 初始化笔记关联服务
    this.noteLinkService = new NoteLinkService(this.settings, this.app);
    
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
  
  // 辅助方法：获取侧边栏视图
  getSidebarView() {
    const sidebarLeaves = this.app.workspace.getLeavesOfType('linkmuse-sidebar');
    if (sidebarLeaves.length > 0) {
      const view = sidebarLeaves[0].view;
      if (view instanceof SidebarView) {
        return view;
      }
    }
    return null;
  }
  
  // 辅助方法：显示侧边栏消息
  showSidebarMessage(message: string, isError: boolean = false) {
    const sidebarView = this.getSidebarView();
    if (sidebarView) {
      sidebarView.showResultMessage(message, isError);
      return true;
    }
    return false;
  }
  
  // 辅助方法：显示分析中状态
  showSidebarAnalyzing() {
    const sidebarView = this.getSidebarView();
    if (sidebarView) {
      sidebarView.showAnalyzing();
      return true;
    }
    return false;
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
    if (leaf) {
      await leaf.setViewState({
        type: 'linkmuse-sidebar',
        active: true,
      });
      
      workspace.revealLeaf(leaf);
    }
  }
  
  addCommands() {
    // 智能单向关联命令
    this.addCommand({
      id: 'generate-unidirectional-links',
      name: '生成智能单向关联',
      callback: () => this.generateUnidirectionalLinks(),
    });
    
    // 组合关联分析命令（标记为开发中）
    this.addCommand({
      id: 'analyze-note-combinations',
      name: '分析笔记组合关联 (开发中)',
      callback: () => this.analyzeNoteCombinations(),
    });
    
    // 灵感跃迁命令（标记为开发中）
    this.addCommand({
      id: 'generate-inspiration',
      name: '生成灵感跃迁 (开发中)',
      callback: () => this.generateInspiration(),
    });
    
    // 多媒体内容理解命令（标记为开发中）
    this.addCommand({
      id: 'analyze-multimedia',
      name: '分析多媒体内容 (开发中)',
      callback: () => this.analyzeMultimedia(),
    });
  }
  
  async generateUnidirectionalLinks() {
    // 获取当前活动的 MarkdownView
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    // console.log(`开始生成单向关联，获取到活动视图：${activeView ? '成功' : '失败'}`);
    
    // 尝试获取活动文件
    const activeFile = this.app.workspace.getActiveFile();
    // console.log(`获取活动文件：${activeFile?.name || '未找到'}`);
    
    // 如果两种方式都无法获取文件，则显示错误信息
    if ((!activeView || !activeView.file) && !activeFile) {
      // console.log("未找到活动笔记，无法生成单向关联");
      if (!this.showSidebarMessage('请先打开一个笔记', true)) {
        new Notice('请先打开一个笔记');
      }
      return;
    }
    
    // 确保有一个非空的 TFile 对象
    const currentFile = activeView?.file || activeFile;
    
    if (!currentFile) {
      // console.log("无法获取有效的文件引用");
      if (!this.showSidebarMessage('无法获取笔记信息', true)) {
        new Notice('无法获取笔记信息');
      }
      return;
    }
    
    // console.log(`开始为笔记 ${currentFile.name} 生成智能单向关联`);
    
    try {
      // 显示分析中状态
      this.showSidebarAnalyzing();
      
      // 创建持续显示的加载提示框
      const loadingNotice = new Notice('正在分析潜在链接...', 0);
      
      // 读取当前笔记内容
      // console.log("读取当前笔记内容");
      const noteContent = await this.app.vault.read(currentFile);
      // console.log(`笔记内容长度: ${noteContent.length} 字符`);
      
      // 调用笔记链接服务分析潜在链接
      console.log("开始分析潜在链接");
      const potentialLinks = await this.noteLinkService.analyzePotentialLinks(currentFile, noteContent);
      
      // 关闭加载提示框
      loadingNotice.hide();
      
      if (!potentialLinks || potentialLinks.length === 0) {
        // console.log("未找到潜在关联");
        if (!this.showSidebarMessage('未找到潜在关联', true)) {
          new Notice('未找到潜在关联');
        }
        return;
      }
    
      // 构建输出内容
      let output = '## 潜在的笔记关联\n\n';
      potentialLinks.forEach((link, index) => {
        // console.log(`处理潜在链接 ${index+1}/${potentialLinks.length}: ${link.noteName}, 分数: ${link.relevanceScore}`);
        output += `当前笔记和[[${link.noteName}]]潜在的关联：${link.content}，关联程度：${link.relevanceScore}\n\n`;
      });
      
      // console.log(`输出内容长度: ${output.length} 字符`);
    
      // 确保有可用的编辑器来更新笔记内容
      if (activeView && activeView.editor) {
        // console.log("尝试插入内容到活动笔记");
        const editor = activeView.editor;
        const currentContent = editor.getValue();
        // console.log("当前笔记内容长度:", currentContent.length);
        
        // 添加新内容
        const newContent = currentContent + '\n\n' + output;
        // console.log("新笔记内容长度:", newContent.length);
        // console.log(`内容增加了 ${newContent.length - currentContent.length} 字符`);
        
        // 使用编辑器更新内容
        // console.log("开始更新编辑器内容");
        editor.setValue(newContent);
        // console.log("通过编辑器更新笔记内容完成");
        
        // 保存文件变更
        // console.log("尝试保存文件变更到磁盘");
        try {
          await this.app.vault.modify(currentFile, newContent);
          // console.log("文件变更已保存到磁盘");
        } catch (saveError) {
          console.error("保存文件变更失败:", saveError);
          console.error("错误详情:", saveError.message);
        }
      } else {
        // console.log("没有活动的编辑器，尝试直接修改文件");
        // 如果没有活动的编辑器视图，尝试直接修改文件
        try {
          const fileContent = await this.app.vault.read(currentFile);
          // console.log("读取文件内容成功，长度:", fileContent.length);
          
          const newContent = fileContent + '\n\n' + output;
          // console.log("准备写入新内容，长度:", newContent.length);
          // console.log(`内容增加了 ${newContent.length - fileContent.length} 字符`);
          
          await this.app.vault.modify(currentFile, newContent);
          // console.log("文件直接修改成功");
        } catch (readError) {
          console.error("读取或修改文件失败:", readError);
          console.error("错误详情:", readError.message);
          if (!this.showSidebarMessage('无法更新笔记内容', true)) {
            new Notice('无法更新笔记内容，但分析结果已生成');
          }
        }
      }
    
      // 显示成功消息
      const successMessage = `已找到${potentialLinks.length}个潜在关联`;
      // console.log(successMessage);
      
      // 重新获取侧边栏视图以确保状态最新
      let sidebarLeaves = this.app.workspace.getLeavesOfType('linkmuse-sidebar');
      let sidebarView = sidebarLeaves.length > 0 ? sidebarLeaves[0].view : null;
      if (sidebarView instanceof SidebarView) {
        // console.log("更新侧边栏消息");
        sidebarView.showResultMessage(successMessage);
      } else {
        // console.log("无法获取侧边栏视图，使用通知");
        new Notice(successMessage);
      }
    } catch (error) {
      console.error('生成单向关联时出错:', error);
      console.error('错误详情:', error.message);
      
      // 显示错误消息
      if (!this.showSidebarMessage('生成关联时出错', true)) {
        new Notice('生成关联时出错，请查看控制台获取详细信息');
      }
    }
  }
  
  async generateInspiration() {
    // 显示功能开发中提示
    console.log("灵感跃迁功能已冻结，显示开发中提示");
    
    if (!this.showSidebarMessage('灵感跃迁功能正在开发中，敬请期待')) {
      new Notice('灵感跃迁功能正在开发中，敬请期待');
    }
    
    return;
    
    /* 以下代码已冻结
    // 获取当前活动的 MarkdownView
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    console.log(`开始生成灵感跃迁，获取到活动视图：${activeView ? '成功' : '失败'}`);
    
    // 尝试获取活动文件
    const activeFile = this.app.workspace.getActiveFile();
    console.log(`获取活动文件：${activeFile?.name || '未找到'}`);
    
    // 如果两种方式都无法获取文件，则显示错误信息
    if ((!activeView || !activeView.file) && !activeFile) {
      console.log("未找到活动笔记，无法生成灵感跃迁");
      if (!this.showSidebarMessage('请先打开一个笔记', true)) {
        new Notice('请先打开一个笔记');
      }
      return;
    }
    
    // 确保有一个非空的 TFile 对象
    const currentFile = activeView?.file || activeFile;
    
    if (!currentFile) {
      console.log("无法获取有效的文件引用");
      if (!this.showSidebarMessage('无法获取笔记信息', true)) {
        new Notice('无法获取笔记信息');
      }
      return;
    }
    
    console.log(`开始为笔记 ${currentFile.name} 生成灵感跃迁`);
    
    try {
      // 显示分析中状态
      this.showSidebarAnalyzing();
      
      // 创建持续显示的加载提示框
      const loadingNotice = new Notice('正在生成灵感跃迁...', 0);
      
      // 读取当前笔记内容
      console.log("读取当前笔记内容");
      const noteContent = await this.app.vault.read(currentFile);
      console.log(`笔记内容长度: ${noteContent.length} 字符`);
      
      // 调用LLM服务生成灵感
      console.log(`开始生成灵感，数量: ${this.settings.inspirationCount}`);
      
      // 使用LLMService生成灵感内容
      const llmService = new LLMService(this.settings, this.app);
      
      try {
        // 生成灵感内容
        const inspirationContent = await llmService.generateInspiration([currentFile.basename, noteContent]);
        console.log("LLM服务返回的灵感内容:", inspirationContent);
        
        // 关闭加载提示框
        loadingNotice.hide();
        
        // 构建输出内容
        let output = '## 灵感跃迁\n\n';
        output += inspirationContent;
        
        console.log("生成的输出内容长度:", output.length);
        
        // 确保有可用的编辑器来更新笔记内容
        if (activeView && activeView.editor) {
          console.log("尝试插入内容到活动笔记");
          const editor = activeView.editor;
          const currentContent = editor.getValue();
          console.log("当前笔记内容长度:", currentContent.length);
          
          // 添加新内容
          const newContent = currentContent + '\n\n' + output;
          console.log("新笔记内容长度:", newContent.length);
          console.log(`内容增加了 ${newContent.length - currentContent.length} 字符`);
          
          // 使用编辑器更新内容
          console.log("开始更新编辑器内容");
          editor.setValue(newContent);
          console.log("通过编辑器更新笔记内容完成");
          
          // 保存文件变更
          console.log("尝试保存文件变更到磁盘");
          try {
            await this.app.vault.modify(currentFile, newContent);
            console.log("文件变更已保存到磁盘");
          } catch (saveError) {
            console.error("保存文件变更失败:", saveError);
            console.error("错误详情:", saveError.message);
          }
        } else {
          console.log("没有活动的编辑器，尝试直接修改文件");
          // 如果没有活动的编辑器视图，尝试直接修改文件
          try {
            const fileContent = await this.app.vault.read(currentFile);
            console.log("读取文件内容成功，长度:", fileContent.length);
            
            const newContent = fileContent + '\n\n' + output;
            console.log("准备写入新内容，长度:", newContent.length);
            console.log(`内容增加了 ${newContent.length - fileContent.length} 字符`);
            
            await this.app.vault.modify(currentFile, newContent);
            console.log("文件直接修改成功");
          } catch (readError) {
            console.error("读取或修改文件失败:", readError);
            console.error("错误详情:", readError.message);
            if (!this.showSidebarMessage('无法更新笔记内容', true)) {
              new Notice('无法更新笔记内容，但灵感已生成');
            }
          }
        }
        
        // 显示成功消息
        const successMessage = `已生成灵感内容`;
        console.log(successMessage);
        
        // 重新获取侧边栏视图以确保状态最新
        let sidebarLeaves = this.app.workspace.getLeavesOfType('linkmuse-sidebar');
        let sidebarView = sidebarLeaves.length > 0 ? sidebarLeaves[0].view : null;
        if (sidebarView instanceof SidebarView) {
          console.log("更新侧边栏消息");
          sidebarView.showResultMessage(successMessage);
        } else {
          console.log("无法获取侧边栏视图，使用通知");
          new Notice(successMessage);
        }
      } catch (llmError) {
        console.error('调用LLM服务时出错:', llmError);
        console.error('错误详情:', llmError.message);
        
        // 关闭加载提示框
        loadingNotice.hide();
        
        // 显示错误消息
        if (!this.showSidebarMessage(`生成灵感时出错: ${llmError.message}`, true)) {
          new Notice(`生成灵感时出错: ${llmError.message}`);
        }
      }
    } catch (error) {
      console.error('生成灵感时出错:', error);
      console.error('错误详情:', error.message);
      
      // 显示错误消息
      if (!this.showSidebarMessage('生成灵感时出错', true)) {
        new Notice('生成灵感时出错，请查看控制台获取详细信息');
      }
    }
    */
  }
  
  async analyzeNoteCombinations() {
    // 显示功能开发中提示
    console.log("笔记组合关联分析功能已冻结，显示开发中提示");
    
    if (!this.showSidebarMessage('笔记组合关联分析功能正在开发中，敬请期待')) {
      new Notice('笔记组合关联分析功能正在开发中，敬请期待');
    }
    
    return;
    
    /* 以下代码已冻结
    // 获取当前活动的笔记
    const activeFile = this.app.workspace.getActiveFile();
    
    if (!activeFile) {
      if (!this.showSidebarMessage('请先打开一个笔记', true)) {
        new Notice('请先打开一个笔记');
      }
      return;
    }
    
    // 显示分析中状态
    this.showSidebarAnalyzing();
    
    // 显示功能开发中消息
    if (!this.showSidebarMessage('笔记组合关联分析功能正在开发中...', false)) {
      new Notice('笔记组合关联分析功能正在开发中...');
    }
    
    // TODO: 实现笔记组合关联分析功能
    // 1. 允许用户选择多个笔记进行组合分析
    // 2. 分析笔记之间的关联性
    // 3. 生成关联分析报告
    */
  }
  
  async analyzeMultimedia() {
    // 显示功能开发中提示
    console.log("多媒体内容分析功能已冻结，显示开发中提示");
    
    if (!this.showSidebarMessage('多媒体内容分析功能正在开发中，敬请期待')) {
      new Notice('多媒体内容分析功能正在开发中，敬请期待');
    }
    
    return;
    
    /* 以下代码已冻结
    new Notice('正在分析多媒体内容...');
    // 实际功能将在后续实现
    */
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
      
    // 默认LLM提供商设置
    new Setting(containerEl)
      .setName('⭐️默认LLM提供商')
      .setDesc('选择默认使用的AI服务提供商')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('siliconflow', '硅基流动')
          .addOption('volc', '火山引擎')
          .setValue(this.plugin.settings.defaultProvider)
          .onChange(async (value) => {
            this.plugin.settings.defaultProvider = value;
            await this.plugin.saveSettings();
          });
      });
      
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
      .setName('生成链接数量')
      .setDesc('设置智能关联生成的最大链接数量')
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.maxLinksToGenerate)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxLinksToGenerate = value;
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
      
    new Setting(containerEl)
      .setName('使用完整笔记内容')
      .setDesc('是否使用完整笔记内容进行分析（开启可能会导致API请求消耗更多Token）')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useFullContent)
          .onChange(async (value) => {
            this.plugin.settings.useFullContent = value;
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