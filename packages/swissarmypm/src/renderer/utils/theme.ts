/**
 * 主题工具函数
 * 帮助在组件中使用主题感知的样式
 */

/**
 * 获取当前主题的 Ant Design Token 值
 */
export const getAntToken = (tokenName: string): string => {
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue(`--ant-${tokenName}`).trim();
};

/**
 * 获取自定义 CSS 变量值
 */
export const getCustomVar = (varName: string): string => {
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue(`--custom-${varName}`).trim();
};

/**
 * 检查当前是否为深色主题
 */
export const isDarkTheme = (): boolean => {
  return document.documentElement.classList.contains('dark');
};

/**
 * 获取当前主题模式
 */
export const getThemeMode = (): 'light' | 'dark' => {
  return isDarkTheme() ? 'dark' : 'light';
};

/**
 * 主题感知的颜色映射
 */
export const themeColors = {
  // 背景色
  bgBase: 'var(--ant-color-bg-base)',
  bgContainer: 'var(--ant-color-bg-container)',
  bgElevated: 'var(--ant-color-bg-elevated)',
  bgLayout: 'var(--ant-color-bg-layout)',
  bgSpotlight: 'var(--ant-color-bg-spotlight)',

  // 文字颜色
  textPrimary: 'var(--ant-color-text)',
  textSecondary: 'var(--ant-color-text-secondary)',
  textTertiary: 'var(--ant-color-text-tertiary)',
  textQuaternary: 'var(--ant-color-text-quaternary)',

  // 边框颜色
  borderPrimary: 'var(--ant-color-border)',
  borderSecondary: 'var(--ant-color-border-secondary)',

  // 分割线颜色
  split: 'var(--ant-color-split)',

  // 品牌色
  primary: 'var(--ant-color-primary)',
  success: 'var(--ant-color-success)',
  warning: 'var(--ant-color-warning)',
  error: 'var(--ant-color-error)',
  info: 'var(--ant-color-info)',
} as const;

/**
 * 主题感知的样式对象
 * 用于内联样式或样式化组件
 */
export const themeStyles = {
  // 基础背景样式
  bgBase: { backgroundColor: themeColors.bgBase },
  bgContainer: { backgroundColor: themeColors.bgContainer },
  bgElevated: { backgroundColor: themeColors.bgElevated },
  bgLayout: { backgroundColor: themeColors.bgLayout },

  // 文字颜色样式
  textPrimary: { color: themeColors.textPrimary },
  textSecondary: { color: themeColors.textSecondary },
  textTertiary: { color: themeColors.textTertiary },

  // 边框样式
  border: { borderColor: themeColors.borderPrimary },
  borderSecondary: { borderColor: themeColors.borderSecondary },

  // 过渡动画
  transition: {
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  },
} as const;

/**
 * 主题感知的 Tailwind 类名映射
 */
export const themeClasses = {
  // 背景色
  bgBase: 'bg-[var(--ant-color-bg-base)]',
  bgContainer: 'bg-[var(--ant-color-bg-container)]',
  bgElevated: 'bg-[var(--ant-color-bg-elevated)]',
  bgLayout: 'bg-[var(--ant-color-bg-layout)]',

  // 文字颜色
  textPrimary: 'text-[var(--ant-color-text)]',
  textSecondary: 'text-[var(--ant-color-text-secondary)]',
  textTertiary: 'text-[var(--ant-color-text-tertiary)]',

  // 边框颜色
  border: 'border-[var(--ant-color-border)]',
  borderSecondary: 'border-[var(--ant-color-border-secondary)]',

  // 过渡动画
  transition: 'transition-colors duration-200',
} as const;

/**
 * 创建主题感知的类名字符串
 * @param classes 类名数组
 * @returns 合并后的类名字符串
 */
export const createThemeClassName = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 监听主题变化的回调类型
 */
type ThemeChangeCallback = (isDark: boolean) => void;

/**
 * 监听主题变化
 * @param callback 主题变化时的回调函数
 * @returns 清理函数
 */
export const watchThemeChange = (callback: ThemeChangeCallback): (() => void) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
        callback(isDarkTheme());
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });

  return () => observer.disconnect();
};
