import { Plugin, setIcon } from 'obsidian';
import LinkMuse from '../main';

export function setupHeaderLogo(plugin: LinkMuse) {
  // 获取顶部面板元素
  const titleEl = document.querySelector('.view-header-title') as HTMLElement;
  if (!titleEl) return;
  
  // 清空现有内容
  titleEl.empty();
  
  // 创建Logo容器
  const logoContainer = titleEl.createDiv({ cls: 'linkmuse-logo' });
  
  // 创建Logo图标
  const logoIcon = logoContainer.createDiv({ cls: 'linkmuse-logo-icon' });
  // 使用与左侧相同的brain-cog图标
  setIcon(logoIcon, 'brain-cog');
  
  // 创建Logo文字
  logoContainer.createSpan({ text: 'LinkMuse 灵感跃迁' });
}