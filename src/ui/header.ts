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
    <path d="M50 10 C70 10, 90 30, 90 50 C90 70, 70 90, 50 90 C30 90, 10 70, 10 50 C10 30, 30 10, 50 10 Z M50 30 C60 30, 70 40, 70 50 C70 60, 60 70, 50 70 C40 70, 30 60, 30 50 C30 40, 40 30, 50 30 Z" />
    <path d="M30 30 L70 70 M30 70 L70 30" />
  </svg>`;
  
  // 创建Logo文字
  logoContainer.createSpan({ text: 'LinkMuse 智能关联' });
}