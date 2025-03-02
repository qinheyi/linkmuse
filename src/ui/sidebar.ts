import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, MarkdownView, setIcon } from 'obsidian';
import LinkMuse from '../main';
import { LLM_PROVIDERS } from '../settings';

export class SidebarView extends ItemView {
  plugin: LinkMuse;
  resultsContainer: HTMLElement;

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
    
    // 添加与左侧相同的图标
    const logoIcon = titleContainer.createDiv({ cls: 'linkmuse-logo-icon' });
    setIcon(logoIcon, 'brain-cog');
    
    // 创建标题文字
    titleContainer.createEl('h2', { text: 'LinkMuse 灵感跃迁' });
    
    // 创建主功能区
    const mainSection = container.createDiv({ cls: 'linkmuse-main-section' });
    
    // 笔记选择区域
    const noteSelectionSection = mainSection.createDiv({ cls: 'linkmuse-note-selection' });
    noteSelectionSection.createEl('h3', { text: '笔记选择' });
    
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
      .linkmuse-message {
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
        background-color: var(--background-secondary);
      }
      .linkmuse-message.error {
        color: var(--text-error);
        border-left: 3px solid var(--text-error);
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
      // 检查是否已打开笔记
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || !activeView.file) {
        // 在侧边栏显示错误消息，而不是弹出提示
        this.showResultMessage('请先打开一个笔记', true);
        return;
      }
      this.plugin.generateUnidirectionalLinks();
    });
    
    // 创建灵感跃迁按钮
    const inspirationButton = actionSection.createEl('button', { 
      text: '灵感跃迁',
      cls: 'mod-cta'
    });
    inspirationButton.addEventListener('click', () => {
      // 检查是否已打开笔记
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || !activeView.file) {
        // 在侧边栏显示错误消息，而不是弹出提示
        this.showResultMessage('请先打开一个笔记', true);
        return;
      }
      this.plugin.generateInspiration();
    });
    
    // 结果展示区域
    const resultsSection = container.createDiv({ cls: 'linkmuse-results' });
    resultsSection.createEl('h3', { text: '结果' });
    this.resultsContainer = resultsSection.createDiv({ cls: 'linkmuse-results-container' });
  }

  // 在结果区域显示消息
  showResultMessage(message: string, isError: boolean = false): void {
    this.resultsContainer.empty();
    const messageEl = this.resultsContainer.createDiv({ 
      cls: `linkmuse-message ${isError ? 'error' : ''}`,
      text: message
    });
  }

  // 显示分析中状态
  showAnalyzing(): void {
    this.resultsContainer.empty();
    const loadingEl = this.resultsContainer.createDiv({ cls: 'linkmuse-loading' });
    loadingEl.createDiv({ cls: 'linkmuse-loading-spinner' });
    loadingEl.createSpan({ text: '正在分析中...' });
  }

  async onClose(): Promise<void> {
    // 清理资源
  }
}