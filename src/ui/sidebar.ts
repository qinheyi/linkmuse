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
    const container = this.containerEl.children[1];
    container.empty();
    
    // 创建标题区域，包含图标和文字
    const titleContainer = container.createDiv({ cls: 'linkmuse-sidebar-title' });
    
    
    // 创建标题文字
    titleContainer.createEl('h2', { text: 'LinkMuse 灵感跃迁' });
    
    // 创建主功能区
    const mainSection = container.createDiv({ cls: 'linkmuse-main-section' });
    
    // 笔记选择区域
    const noteSelectionSection = mainSection.createDiv({ cls: 'linkmuse-note-selection' });
    noteSelectionSection.createEl('h3', { text: '笔记选择' });
    
    // 添加当前笔记信息显示区域
    this.noteInfoContainer = noteSelectionSection.createDiv({ cls: 'linkmuse-note-info' });
    
    // 初始化显示当前笔记
    this.updateCurrentNoteInfo();
    
    // 添加事件监听器，当活动叶子变化时更新笔记信息
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
      this.updateCurrentNoteInfo();
    }));
    
    // 添加文件打开事件监听
    this.registerEvent(this.app.workspace.on('file-open', () => {
      this.updateCurrentNoteInfo();
    }));
    
    // 添加布局变化事件监听
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      this.updateCurrentNoteInfo();
    }));
    
    // 设置定期刷新
    this.refreshInterval = window.setInterval(() => {
      this.updateCurrentNoteInfo();
    }, 3000);
    
    // LLM提供商选择区域
    const llmProviderSection = mainSection.createDiv({ cls: 'linkmuse-llm-provider' });
    llmProviderSection.createEl('h4', { text: 'LLM提供商' });
    
    // 创建LLM提供商选择按钮组
    const providerButtonContainer = llmProviderSection.createDiv({ cls: 'linkmuse-provider-buttons' });
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .linkmuse-sidebar-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .linkmuse-logo-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .linkmuse-logo-icon svg {
        width: 100%;
        height: 100%;
        fill: var(--text-normal);
      }
      .linkmuse-provider-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      .linkmuse-provider-button {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      .linkmuse-provider-button.is-active {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      .linkmuse-note-info {
        margin: 8px 0;
        padding: 8px;
        border-radius: 6px;
        background-color: var(--background-secondary);
      }
      .linkmuse-active-note {
        display: flex;
        flex-direction: column;
      }
      .linkmuse-note-name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .linkmuse-note-path {
        font-size: 0.8em;
        color: var(--text-muted);
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .linkmuse-empty-state {
        color: var(--text-muted);
        font-style: italic;
      }
      .linkmuse-results-container {
        margin-top: 8px;
        padding: 8px;
        border-radius: 6px;
        background-color: var(--background-secondary);
        max-height: 300px;
        overflow-y: auto;
      }
      .linkmuse-loading {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .linkmuse-loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--text-muted);
        border-top-color: var(--interactive-accent);
        border-radius: 50%;
        animation: linkmuse-spin 1s linear infinite;
      }
      .linkmuse-error {
        color: var(--text-error);
      }
      @keyframes linkmuse-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // 为每个提供商创建按钮
    Object.entries(LLM_PROVIDERS).forEach(([key, name]) => {
      const providerButton = new ButtonComponent(providerButtonContainer)
        .setButtonText(name)
        .setClass('linkmuse-provider-button')
        .onClick(async () => {
          // 更新所有按钮状态
          providerButtonContainer.querySelectorAll('.linkmuse-provider-button').forEach(btn => {
            btn.removeClass('is-active');
          });
          providerButton.buttonEl.addClass('is-active');
          
          // 临时切换提供商
          this.plugin.settings.defaultProvider = key;
          await this.plugin.saveSettings();
        });
      
      // 设置当前活动的提供商按钮
      if (this.plugin.settings.defaultProvider === key) {
        providerButton.buttonEl.addClass('is-active');
      }
    });
    
    // 功能按钮区域
    const actionSection = mainSection.createDiv({ cls: 'linkmuse-actions' });
    
    // 创建智能单向关联按钮
    const linkButton = actionSection.createEl('button', { 
      text: '生成智能单向关联',
      cls: 'mod-cta'
    });
    linkButton.addEventListener('click', () => {
      this.plugin.generateUnidirectionalLinks();
    });
    
    // 创建灵感跃迁按钮
    const inspirationButton = actionSection.createEl('button', { 
      text: '灵感跃迁',
      cls: 'mod-cta'
    });
    inspirationButton.addEventListener('click', () => {
      this.plugin.generateInspiration();
    });
    
    // 结果展示区域
    const resultsSection = container.createDiv({ cls: 'linkmuse-results' });
    resultsSection.createEl('h3', { text: '结果' });
    this.resultsContainer = resultsSection.createDiv({ cls: 'linkmuse-results-container' });
  }

  // 更新当前笔记信息的方法
  updateCurrentNoteInfo() {
    this.noteInfoContainer.empty();
    
    // 尝试获取当前活动的Markdown视图
    let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    // 如果没有找到活动的Markdown视图，尝试在所有打开的叶子中查找
    if (!activeView || !activeView.file) {
      const leaves = this.app.workspace.getLeavesOfType('markdown');
      for (const leaf of leaves) {
        const view = leaf.view;
        if (view instanceof MarkdownView && view.file) {
          activeView = view;
          break;
        }
      }
    }
    
    if (activeView && activeView.file) {
      // 如果有活动的笔记，显示其信息
      const noteInfo = this.noteInfoContainer.createDiv({ cls: 'linkmuse-active-note' });
      noteInfo.createDiv({ 
        cls: 'linkmuse-note-name', 
        text: activeView.file.name 
      });
      noteInfo.createDiv({ 
        cls: 'linkmuse-note-path', 
        text: activeView.file.path 
      });
    } else {
      // 如果没有活动的笔记，显示提示信息
      this.noteInfoContainer.createDiv({ 
        cls: 'linkmuse-empty-state', 
        text: '请先打开一个笔记' 
      });
    }
  }

  // 显示结果消息的方法
  showResultMessage(message: string, isError: boolean = false) {
    this.resultsContainer.empty();
    
    const messageEl = this.resultsContainer.createDiv({
      cls: isError ? 'linkmuse-error' : ''
    });
    messageEl.setText(message);
  }

  // 显示分析中状态的方法
  showAnalyzing() {
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
}