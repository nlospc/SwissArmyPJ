import React from 'react';
import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';

/**
 * 主题切换按钮组件
 * 提供简洁的深色/亮色主题切换功能
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { mode, toggleTheme, isDark } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <SunOutlined className={isDark ? 'text-theme-secondary' : 'text-yellow-500'} />
      <Switch
        checked={isDark}
        onChange={toggleTheme}
        checkedChildren="Dark"
        unCheckedChildren="Light"
      />
      <MoonOutlined className={isDark ? 'text-blue-300' : 'text-theme-secondary'} />
      <span className="text-sm ml-2" style={{ color: 'var(--ant-color-text-secondary)' }}>
        {isDark ? '深色模式' : '亮色模式'}
      </span>
    </div>
  );
};

export default ThemeToggle;
