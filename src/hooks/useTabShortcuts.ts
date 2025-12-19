import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

/**
 * 标签页快捷键钩子
 * - Ctrl+W: 关闭当前标签页
 * - Ctrl+Tab: 切换到下一个标签页
 * - Ctrl+Shift+Tab: 切换到上一个标签页
 * - Ctrl+1~9: 切换到第 1~9 个标签页
 */
export function useTabShortcuts() {
  const { tabs, activeTabId, closeTab, setActiveTab } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W - 关闭当前标签页
      if (e.ctrlKey && e.key === 'w' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Ctrl+Tab - 切换到下一个标签页
      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        if (tabs.length > 0 && activeTabId) {
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex].id);
        }
        return;
      }

      // Ctrl+Shift+Tab - 切换到上一个标签页
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length > 0 && activeTabId) {
          const currentIndex = tabs.findIndex(t => t.id === activeTabId);
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          setActiveTab(tabs[prevIndex].id);
        }
        return;
      }

      // Ctrl+1~9 - 切换到第 1~9 个标签页
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const targetIndex = num - 1;
          if (tabs[targetIndex]) {
            setActiveTab(tabs[targetIndex].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, closeTab, setActiveTab]);
}

