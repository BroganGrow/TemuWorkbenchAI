import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

/**
 * 浏览器式导航快捷键和鼠标侧键支持
 * - Alt + ← : 后退
 * - Alt + → : 前进
 * - 鼠标侧键 (Button 3/4) : 后退/前进
 */
export function useNavigationShortcuts() {
  const { goBack, goForward, canGoBack, canGoForward } = useAppStore();

  useEffect(() => {
    // 键盘快捷键处理
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 左箭头 = 后退
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack()) {
          goBack();
        }
      }
      
      // Alt + 右箭头 = 前进
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoForward()) {
          goForward();
        }
      }
    };

    // 鼠标侧键处理
    const handleMouseButton = (e: MouseEvent) => {
      // Button 3 = 后退键
      if (e.button === 3) {
        e.preventDefault();
        if (canGoBack()) {
          goBack();
        }
      }
      
      // Button 4 = 前进键
      if (e.button === 4) {
        e.preventDefault();
        if (canGoForward()) {
          goForward();
        }
      }
    };

    // 监听键盘事件
    window.addEventListener('keydown', handleKeyDown);
    
    // 监听鼠标按钮事件
    window.addEventListener('mouseup', handleMouseButton);

    // 清理事件监听
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseButton);
    };
  }, [goBack, goForward, canGoBack, canGoForward]);
}

