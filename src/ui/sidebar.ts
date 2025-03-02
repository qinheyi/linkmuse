import { ItemView, WorkspaceLeaf } from 'obsidian';
import LinkMuse from '../main';

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
    
    // 功能按钮区域
    const actionSection = mainSection.createDiv({ cls: 'linkmuse-actions' });
    
    // 创建智能关联按钮
    const linkButton = actionSection.createEl('button', { 
      text: '生成智能关联',
      cls: 'mod-cta'
    });
    linkButton.addEventListener('click', () => {
      this.plugin.generateBidirectionalLinks();
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