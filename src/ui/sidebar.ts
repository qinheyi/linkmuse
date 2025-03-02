import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, MarkdownView } from 'obsidian';
import LinkMuse from '../main';
import { LLM_PROVIDERS } from '../settings';

export class SidebarView extends ItemView {
  plugin: LinkMuse;

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
    
    container.createEl('h2', { text: 'LinkMuse 智能关联' });
    
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
      // 获取当前活动的笔记视图
      const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView || !activeView.file) {
        new Notice('请先打开一个笔记');
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
      this.plugin.generateInspiration();
    });
    
    // 结果展示区域
    const resultsSection = container.createDiv({ cls: 'linkmuse-results' });
    resultsSection.createEl('h3', { text: '结果' });
    resultsSection.createDiv({ cls: 'linkmuse-results-container' });
  }

  async onClose(): Promise<void> {
    // 清理资源
  }
}