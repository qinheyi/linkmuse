import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, MarkdownView, setIcon } from 'obsidian';
import LinkMuse from '../main';
import { LLM_PROVIDERS } from '../settings';

export class SidebarView extends ItemView {
  plugin: LinkMuse;
  resultsContainer: HTMLElement;
  noteInfoContainer: HTMLElement;

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
    
    // 添加当前笔记信息显示区域
    this.noteInfoContainer = noteSelectionSection.createDiv({ cls: 'linkmuse-note-info' });
    
    // 初始化当前笔记显示
    this.updateCurrentNoteInfo();
    
    // 注册工作区事件监听，在活动笔记变化时更新信息
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.updateCurrentNoteInfo();
      })
    );
    
    // 监听文件打开事件
    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        this.updateCurrentNoteInfo();
      })
    );
    
    // 监听布局变化事件
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.updateCurrentNoteInfo();
      })
    );
    
    // 设置定时刷新，确保信息始终最新
    const refreshInterval = window.setInterval(() => {
      this.updateCurrentNoteInfo();
    }, 3000); // 每3秒刷新一次
    
    // 在视图关闭时清除定时器
    this.register(() => {
      window.clearInterval(refreshInterval);
    });
    
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
      .linkmuse-note-info {
        margin: 8px 0 16px;
      }
      .linkmuse-active-note {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--background-secondary);
        border-radius: 6px;
        border-left: 3px solid var(--interactive-accent);
      }
      .linkmuse-note-icon {
        margin-right: 8px;
      }
      .linkmuse-note-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .linkmuse-note-path {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .linkmuse-empty-state {
        padding: 8px 12px;
        background-color: var(--background-secondary);
        border-radius: 6px;
        border-left: 3px solid var(--text-muted);
        color: var(--text-muted);
        font-style: italic;
      }
      .linkmuse-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: var(--background-secondary);
        border-radius: 6px;
      }
      .linkmuse-loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid var(--interactive-accent);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
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

  // 更新当前笔记信息
  updateCurrentNoteInfo(): void {
    this.noteInfoContainer.empty();
    
    // 尝试多种方式获取当前活动的Markdown视图
    let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    // 如果没有找到，尝试从所有打开的叶子中查找
    if (!activeView || !activeView.file) {
      // 遍历所有打开的叶子，找到当前活动的或第一个Markdown视图
      const leaves = this.app.workspace.getLeavesOfType('markdown');
      for (const leaf of leaves) {
        if (leaf.view instanceof MarkdownView) {
          activeView = leaf.view;
          if (leaf.getRoot().activeLeaf === leaf) {
            break; // 如果是活动叶子，优先使用
          }
        }
      }
    }
    
    if (activeView && activeView.file) {
      // 显示当前打开的笔记名称
      const noteInfo = this.noteInfoContainer.createDiv({ cls: 'linkmuse-active-note' });
      
      // 添加文档图标
      const docIcon = noteInfo.createSpan({ cls: 'linkmuse-note-icon' });
      setIcon(docIcon, 'document');
      
      // 添加笔记名称
      noteInfo.createSpan({ 
        text: activeView.file.basename,
        cls: 'linkmuse-note-name'
      });
      
      // 添加文件路径提示(如果在子文件夹中)
      if (activeView.file.parent && activeView.file.parent.path !== '/') {
        noteInfo.createEl('div', {
          text: `路径: ${activeView.file.parent.path}`,
          cls: 'linkmuse-note-path'
        });
      }
    } else {
      // 没有打开笔记的提示
      const emptyState = this.noteInfoContainer.createDiv({ cls: 'linkmuse-empty-state' });
      emptyState.createSpan({ 
        text: '请先在编辑区打开一个笔记',
        cls: 'linkmuse-empty-message'
      });
    }
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