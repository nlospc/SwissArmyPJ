import { theme } from 'antd';

/**
 * 全局主题配置
 * 为深色和亮色主题提供统一的配置，确保所有组件都能正确适配
 */

// 亮色主题的 Token 配置
export const lightThemeTokens = {
  // 基础颜色
  colorPrimary: '#1677ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',
  colorInfo: '#1677ff',

  // 中性色
  colorBgBase: '#ffffff',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#f5f5f5',
  colorBgSpotlight: '#ffffff',

  // 边框颜色
  colorBorder: '#d9d9d9',
  colorBorderSecondary: '#f0f0f0',

  // 文字颜色
  colorText: 'rgba(0, 0, 0, 0.88)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
  colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

  // 分割线
  colorSplit: 'rgba(0, 0, 0, 0.06)',

  // 圆角
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,

  // 间距
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,

  // 字体
  fontSize: 14,
  fontSizeSM: 12,
  fontSizeLG: 16,
  fontSizeXL: 20,

  // 其他
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
};

// 深色主题的 Token 配置
export const darkThemeTokens = {
  // 基础颜色
  colorPrimary: '#177ddc',
  colorSuccess: '#49aa19',
  colorWarning: '#d89614',
  colorError: '#d32029',
  colorInfo: '#177ddc',

  // 中性色
  colorBgBase: '#141414',
  colorBgContainer: '#1f1f1f',
  colorBgElevated: '#262626',
  colorBgLayout: '#000000',
  colorBgSpotlight: '#262626',

  // 边框颜色
  colorBorder: '#434343',
  colorBorderSecondary: '#303030',

  // 文字颜色
  colorText: 'rgba(255, 255, 255, 0.88)',
  colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
  colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
  colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

  // 分割线
  colorSplit: 'rgba(255, 255, 255, 0.12)',

  // 圆角
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusSM: 4,

  // 间距
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,

  // 字体
  fontSize: 14,
  fontSizeSM: 12,
  fontSizeLG: 16,
  fontSizeXL: 20,

  // 其他
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
};

// 组件级别的主题配置
export const getComponentTokenConfig = (isDark: boolean) => ({
  // Button 按钮组件
  Button: {
    colorPrimary: isDark ? '#177ddc' : '#1677ff',
    algorithm: true,
  },

  // Input 输入框组件
  Input: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    colorPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
  },

  // TextArea 文本域组件
  TextArea: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    colorPlaceholder: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
  },

  // Select 选择器组件
  Select: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    optionSelectedBg: isDark ? '#177ddc' : '#e6f4ff',
  },

  // Card 卡片组件
  Card: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorderSecondary: isDark ? '#303030' : '#f0f0f0',
    headerBg: isDark ? '#1f1f1f' : '#fafafa',
  },

  // Table 表格组件
  Table: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    headerBg: isDark ? '#1f1f1f' : '#fafafa',
    headerColor: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    rowHoverBg: isDark ? '#262626' : '#f5f5f5',
    borderColor: isDark ? '#434343' : '#f0f0f0',
  },

  // Modal 弹窗组件
  Modal: {
    contentBg: isDark ? '#1f1f1f' : '#ffffff',
    headerBg: isDark ? '#1f1f1f' : '#ffffff',
  },

  // Drawer 抽屉组件
  Drawer: {
    contentBg: isDark ? '#1f1f1f' : '#ffffff',
    headerBg: isDark ? '#1f1f1f' : '#ffffff',
  },

  // Menu 菜单组件
  Menu: {
    darkItemBg: '#141414',
    darkItemHoverBg: '#1f1f1f',
    darkItemSelectedBg: '#177ddc',
    darkItemColor: 'rgba(255, 255, 255, 0.65)',
    darkItemSelectedColor: '#ffffff',
    darkMenuBg: '#141414',
  },

  // Tabs 标签页组件
  Tabs: {
    itemActiveColor: isDark ? '#177ddc' : '#1677ff',
    itemHoverColor: isDark ? '#177ddc' : '#1677ff',
    itemSelectedColor: isDark ? '#177ddc' : '#1677ff',
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
  },

  // Divider 分割线组件
  Divider: {
    colorSplit: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
  },

  // Badge 徽标数组件
  Badge: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
  },

  // Tag 标签组件
  Tag: {
    defaultBg: isDark ? '#1f1f1f' : '#fafafa',
    defaultColor: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },

  // Space 间距组件
  Space: {
    itemGap: 16,
  },

  // Alert 警告提示组件
  Alert: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },

  // Steps 步骤条组件
  Steps: {
    descriptionColor: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)',
  },

  // Empty 空状态组件
  Empty: {
    colorText: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
  },

  // Typography 排版组件
  Typography: {
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
  },

  // Radio 单选框组件
  Radio: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // Checkbox 复选框组件
  Checkbox: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // Form 表单组件
  Form: {
    itemLabelColor: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },

  // Tooltip 文字提示组件
  Tooltip: {
    colorBgDefault: isDark ? '#434343' : 'rgba(0, 0, 0, 0.85)',
    colorText: '#ffffff',
  },

  // Popover 气泡卡片组件
  Popover: {
    colorBgElevated: isDark ? '#1f1f1f' : '#ffffff',
  },

  // DatePicker 日期选择器组件
  DatePicker: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // TimePicker 时间选择器组件
  TimePicker: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // Dropdown 下拉菜单组件
  Dropdown: {
    colorBgElevated: isDark ? '#1f1f1f' : '#ffffff',
    colorBgSpotlight: isDark ? '#262626' : '#f5f5f5',
  },

  // Layout 布局组件
  Layout: {
    headerBg: isDark ? '#1f1f1f' : '#ffffff',
    bodyBg: isDark ? '#141414' : '#f5f5f5',
    siderBg: isDark ? '#1f1f1f' : '#ffffff',
  },

  // Collapse 折叠面板组件
  Collapse: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // Progress 进度条组件
  Progress: {
    colorInfo: isDark ? '#177ddc' : '#1677ff',
  },

  // Spin 加载中组件
  Spin: {
    colorBgContainer: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
  },

  // Switch 开关组件
  Switch: {
    colorPrimary: isDark ? '#177ddc' : '#1677ff',
  },

  // Slider 滑动输入条组件
  Slider: {
    colorPrimary: isDark ? '#177ddc' : '#1677ff',
  },

  // Upload 上传组件
  Upload: {
    colorBorder: isDark ? '#434343' : '#d9d9d9',
  },

  // Timeline 时间轴组件
  Timeline: {
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
  },

  // Calendar 日历组件
  Calendar: {
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBgElevated: isDark ? '#262626' : '#ffffff',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },

  // Statistic 统计数值组件
  Statistic: {
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },

  // Descriptions 描述列表组件
  Descriptions: {
    colorLabel: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
    colorText: isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.88)',
  },
});

/**
 * 获取完整的主题配置
 * @param isDark 是否为深色主题
 */
export const getThemeConfig = (isDark: boolean) => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: isDark ? darkThemeTokens : lightThemeTokens,
  components: getComponentTokenConfig(isDark),
});

export default getThemeConfig;
