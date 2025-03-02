import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, MarkdownView, TFile } from 'obsidian';
import LinkMuse from '../main';
import { LLM_PROVIDERS } from '../settings';

export class SidebarView extends ItemView {
  plugin: LinkMuse;
  noteInfoContainer: HTMLElement;
  resultsContainer: HTMLElement;
  refreshInterval: number;

  constructor(leaf: WorkspaceLeaf, plugin: LinkMuse) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return 'linkmuse-sidebar';
  }

  getDisplayText(): string {
    return 'LinkMuse';
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    
    // 创建标题
    const titleEl = contentEl.createEl('h2', { text: 'LinkMuse 灵感跃迁' });
    
    // 创建笔记选择区域
    this.createNoteSelectionArea(contentEl);
    
    // 创建LLM提供商选择区域
    this.createLLMProviderSelection(contentEl);
    
    // 创建功能按钮
    this.createActionButtons(contentEl);
    
    // 创建结果显示区域
    this.createResultsArea(contentEl);
    
    // 初始化当前笔记显示
    this.updateCurrentNoteInfo();
    
    // 注册事件监听，当活动笔记变化时更新信息
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        // console.log("活动叶子变化，更新笔记信息");
        this.updateCurrentNoteInfo();
      })
    );
    
    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        // console.log("文件打开，更新笔记信息");
        this.updateCurrentNoteInfo();
      })
    );
    
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        // console.log("布局变化，更新笔记信息");
        this.updateCurrentNoteInfo();
      })
    );
    
    /* 注释掉定时刷新功能，减少日志输出
    // 每3秒刷新一次当前笔记信息
    this.refreshInterval = window.setInterval(() => {
      // console.log("定时更新笔记信息");
      this.updateCurrentNoteInfo();
    }, 3000);
    
    // 在视图关闭时清除刷新间隔
    this.register(() => {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    });
    */
  }

  // 更新当前笔记信息的方法
  updateCurrentNoteInfo() {
    if (!this.noteInfoContainer) {
      console.log("noteInfoContainer不存在");
      return;
    }
    
    this.noteInfoContainer.empty();
    
    console.log("尝试更新笔记信息");
    
    // 尝试获取当前活动的Markdown视图
    let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    console.log("通过getActiveViewOfType获取:", activeView);
    
    // 尝试获取当前活动的叶子
    const activeLeaf = this.app.workspace.activeLeaf;
    console.log("当前活动叶子:", activeLeaf);
    
    // 尝试获取当前活动文件
    const activeFile = this.app.workspace.getActiveFile();
    console.log("当前活动文件:", activeFile ? activeFile.name : "无");
    
    // 如果活动叶子存在，检查它的视图是否是MarkdownView
    if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
      activeView = activeLeaf.view;
      console.log("从活动叶子获取视图:", activeView);
    }
    
    // 如果没有找到活动的Markdown视图，尝试在所有打开的叶子中查找
    if (!activeView || !activeView.file) {
      console.log("未找到活动的Markdown视图，尝试查找所有叶子");
      
      // 获取所有打开的叶子
      const allLeaves = this.app.workspace.getLeavesOfType('markdown');
      console.log("所有markdown叶子:", allLeaves.length);
      
      // 遍历所有叶子寻找第一个有文件的MarkdownView
      for (const leaf of allLeaves) {
        if (leaf.view instanceof MarkdownView && leaf.view.file) {
          activeView = leaf.view;
          console.log("从所有叶子中找到视图:", activeView);
          break;
        }
      }
    }
    
    // 如果仍然没有找到视图但有活动文件，使用活动文件
    let noteFile = activeView?.file || activeFile;
    
    if (noteFile) {
      console.log("找到活动笔记:", noteFile.name, noteFile.path);
      
      // 如果有活动的笔记，显示其信息
      const noteInfo = this.noteInfoContainer.createDiv({ cls: 'linkmuse-active-note' });
      noteInfo.createDiv({ 
        cls: 'linkmuse-note-name', 
        text: noteFile.name 
      });
      noteInfo.createDiv({ 
        cls: 'linkmuse-note-path', 
        text: noteFile.path 
      });
      
      // 在结果区域清除可能存在的错误提示
      if (this.resultsContainer && this.resultsContainer.textContent && 
          this.resultsContainer.textContent.includes('请先打开一个笔记')) {
        this.resultsContainer.empty();
      }
    } else {
      console.log("未找到活动笔记");
      
      // 如果没有活动的笔记，显示提示信息
      this.noteInfoContainer.createDiv({ 
        cls: 'linkmuse-empty-state', 
        text: '请先打开一个笔记' 
      });
      
      // 这里调试用 - 获取所有打开的文件
      const openFiles = this.app.vault.getMarkdownFiles();
      console.log("库中的所有Markdown文件:", openFiles.length);
      if (openFiles.length > 0) {
        console.log("第一个Markdown文件:", openFiles[0].name);
      }
    }
  }

  // 显示结果消息的方法
  showResultMessage(message: string, isError: boolean = false) {
    if (!this.resultsContainer) {
      console.error("resultsContainer不存在，无法显示消息:", message);
      return;
    }
    
    console.log(`显示${isError ? '错误' : ''}消息:`, message);
    
    this.resultsContainer.empty();
    
    const messageEl = this.resultsContainer.createDiv({
      cls: isError ? 'linkmuse-error' : ''
    });
    messageEl.setText(message);
  }

  // 显示分析中状态的方法
  showAnalyzing() {
    if (!this.resultsContainer) {
      console.error("resultsContainer不存在，无法显示分析状态");
      return;
    }
    
    console.log("显示分析中状态");
    
    this.resultsContainer.empty();
    
    const loadingEl = this.resultsContainer.createDiv({ cls: 'linkmuse-loading' });
    loadingEl.createDiv({ cls: 'linkmuse-loading-spinner' });
    loadingEl.createDiv({ text: '正在分析...' });
  }

  async onClose(): Promise<void> {
    // 清理资源
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // 创建LLM提供商选择区域
  createLLMProviderSelection(containerEl: HTMLElement) {
    const llmProviderSection = containerEl.createDiv({ cls: 'linkmuse-llm-provider' });
    llmProviderSection.createEl('h4', { text: 'LLM提供商' });
    
    // 创建LLM提供商选择按钮组
    const providerButtonContainer = llmProviderSection.createDiv({ cls: 'linkmuse-provider-buttons' });
    
    // 只保留SiliconFlow和Volc引擎选项
    const reducedProviders = {
      'siliconflow': 'SiliconFlow',
      'volc': '火山引擎'
    };
    
    // 为每个提供商创建按钮
    Object.entries(reducedProviders).forEach(([key, name]) => {
      const button = providerButtonContainer.createEl('button', {
        text: name,
        cls: 'linkmuse-provider-button'
      });
      
      // 如果是当前选择的提供商，添加active类
      if (this.plugin.settings.defaultProvider === key) {
        button.addClass('is-active');
      }
      
      // 添加点击事件
      button.addEventListener('click', async () => {
        // 更新所有按钮状态
        providerButtonContainer.querySelectorAll('.linkmuse-provider-button').forEach(btn => {
          btn.removeClass('is-active');
        });
        button.addClass('is-active');
        
        // 更新设置
        this.plugin.settings.defaultProvider = key;
        await this.plugin.saveSettings();
        
        console.log(`已切换LLM提供商为: ${name}`);
      });
    });
  }

  // 创建笔记选择区域
  createNoteSelectionArea(containerEl: HTMLElement) {
    const noteSelectionSection = containerEl.createDiv({ cls: 'linkmuse-note-selection' });
    noteSelectionSection.createEl('h3', { text: '笔记选择' });
    
    // 添加当前笔记信息显示区域
    this.noteInfoContainer = noteSelectionSection.createDiv({ cls: 'linkmuse-note-info' });
    
    // 添加多笔记选择区域
    const multiNoteSection = noteSelectionSection.createDiv({ cls: 'linkmuse-multi-note-selection' });
    multiNoteSection.createEl('h4', { text: '选择其他笔记进行组合分析' });
    
    // 添加笔记选择列表（将在updateCurrentNoteInfo方法中填充）
    const noteListContainer = multiNoteSection.createDiv({ cls: 'linkmuse-note-list' });
    noteListContainer.createEl('p', { 
      text: '请先打开一个笔记，然后在这里选择其他笔记进行组合分析',
      cls: 'linkmuse-note-list-placeholder'
    });
    
    // 添加按钮用于打开笔记选择器
    const selectNotesButton = multiNoteSection.createEl('button', {
      text: '选择要分析的笔记',
      cls: 'mod-cta linkmuse-select-notes-button'
    });
    
    selectNotesButton.addEventListener('click', () => {
      // TODO: 实现笔记选择器
      this.showResultMessage('笔记选择功能正在开发中，目前只支持分析当前打开的笔记');
    });
  }

  // 创建功能按钮
  createActionButtons(containerEl: HTMLElement) {
    const actionSection = containerEl.createDiv({ cls: 'linkmuse-actions' });
    
    // 创建智能单向关联按钮
    const linkButton = actionSection.createEl('button', { 
      text: '生成智能单向关联',
      cls: 'mod-cta'
    });
    linkButton.addEventListener('click', () => {
      this.plugin.generateUnidirectionalLinks();
    });
    
    // 创建灵感跃迁按钮（标记为开发中）
    const inspirationButton = actionSection.createEl('button', { 
      text: '灵感跃迁 (开发中)',
      cls: 'mod-cta'
    });
    inspirationButton.addEventListener('click', () => {
      this.showResultMessage('灵感跃迁功能正在开发中，敬请期待');
    });
    
    // 分析笔记组合关联按钮（标记为开发中）
    const combinationButton = actionSection.createEl('button', { 
      text: '分析笔记组合关联 (开发中)',
      cls: 'mod-cta'
    });
    combinationButton.addEventListener('click', () => {
      this.showResultMessage('笔记组合关联分析功能正在开发中，敬请期待');
    });
    
    // 分析多媒体内容按钮（标记为开发中）
    const mediaButton = actionSection.createEl('button', { 
      text: '分析多媒体内容 (开发中)',
      cls: 'mod-cta'
    });
    mediaButton.addEventListener('click', () => {
      this.showResultMessage('多媒体内容分析功能正在开发中，敬请期待');
    });
  }

  // 创建结果显示区域
  createResultsArea(containerEl: HTMLElement) {
    const resultsSection = containerEl.createDiv({ cls: 'linkmuse-results' });
    resultsSection.createEl('h3', { text: '结果' });
    this.resultsContainer = resultsSection.createDiv({ cls: 'linkmuse-results-container' });
  }
}