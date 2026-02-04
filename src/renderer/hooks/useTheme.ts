import { useState, useEffect } from 'react';
import { theme } from 'antd';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'swiss-army-pm-theme';

/**
 * 主题管理 Hook
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // 从 localStorage 读取主题设置
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    // 检测系统主题偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    // 保存主题设置
    localStorage.setItem(THEME_STORAGE_KEY, mode);

    // 更新 HTML 根元素的 data-theme 属性
    document.documentElement.setAttribute('data-theme', mode);

    // 更新 body 背景色
    if (mode === 'dark') {
      document.body.style.backgroundColor = '#141414';
    } else {
      document.body.style.backgroundColor = '#f5f5f5';
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLightTheme = () => setMode('light');
  const setDarkTheme = () => setMode('dark');

  return {
    mode,
    isDark: mode === 'dark',
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };
}
