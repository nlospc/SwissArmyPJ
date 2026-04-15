import { theme } from 'antd';

/**
 * Ant Design 主题配置
 * https://ant.design/docs/react/customize-theme-cn
 */
export const antdTheme = {
  token: {
    // 主色调
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',

    // 字体
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,

    // 圆角
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 8,

    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,

    // 颜色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
  },

  components: {
    Button: {
      borderRadius: 4,
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
    },
    Input: {
      borderRadius: 4,
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
    },
    Modal: {
      borderRadiusLG: 8,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Select: {
      borderRadius: 4,
      controlHeight: 36,
    },
  },
};

/**
 * 暗色主题配置
 */
export const antdDarkTheme = {
  ...antdTheme,
  token: {
    ...antdTheme.token,
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#141414',
  },
};

/**
 * 获取主题算法
 */
export const getThemeAlgorithm = (isDark: boolean) => {
  return isDark ? [theme.darkAlgorithm] : [theme.defaultAlgorithm];
};
