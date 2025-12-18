import { useEffect } from 'react';

/**
 * 文件树快捷键
 * - Ctrl+Shift+Z : 展开全部
 * - Ctrl+Shift+C : 折叠全部
 * - Alt+F1 : 定位到当前文件
 */
export function useTreeShortcuts(callbacks: {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onLocateCurrent: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+Z - 展开全部
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        callbacks.onExpandAll();
      }
      
      // Ctrl+Shift+C - 折叠全部
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        callbacks.onCollapseAll();
      }
      
      // Alt+F1 - 定位当前文件
      if (e.altKey && e.key === 'F1') {
        e.preventDefault();
        callbacks.onLocateCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

