import { Plugin } from 'obsidian';
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
  logoIcon.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 C70 5, 85 20, 85 40 C85 55, 75 65, 60 70 C60 75, 65 80, 65 85 C65 90, 60 95, 50 95 C40 95, 35 90, 35 85 C35 80, 40 75, 40 70 C25 65, 15 55, 15 40 C15 20, 30 5, 50 5 Z" />
    <path d="M35 40 C35 45, 40 50, 45 50 M55 50 C60 50, 65 45, 65 40" />
    <path d="M30 25 C40 20, 60 20, 70 25" />
  </svg>`;
  
  // 创建Logo文字
  logoContainer.createSpan({ text: 'LinkMuse 灵感跃迁' });
}