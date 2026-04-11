# UI Standards Skill

瑞士军刀项目UI规范，确保界面一致性和主题适配。

## 核心原则

### 1. 主题适配 (Theme Adherence)

**DO:**
```tsx
// ✅ 使用 Ant Design theme token 获取主题色
import { theme } from 'antd';

function MyComponent() {
  const { token } = theme.useToken();

  return (
    <div style={{
      backgroundColor: token.colorBgContainer,
      color: token.colorText,
      border: `1px solid ${token.colorBorder}`
    }}>
      Content
    </div>
  );
}
```

**DON'T:**
```tsx
// ❌ 硬编码颜色 - 不支持深色模式
function BadComponent() {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      color: '#262626',
      border: '1px solid #F0F0F0'
    }}>
      Content
    </div>
  );
}
```

### 2. 常用 Token 映射

| 用途 | Light Token | Dark Token | 使用 Token |
|------|------------|------------|------------|
| 背景容器 | `#ffffff` | `#1f1f1f` | `token.colorBgContainer` |
| 页面背景 | `#f5f5f5` | `#000000` | `token.colorBgLayout` |
| 边框 | `#d9d9d9` | `#434343` | `token.colorBorder` |
| 次级边框 | `#f0f0f0` | `#303030` | `token.colorBorderSecondary` |
| 主要文字 | `rgba(0,0,0,0.88)` | `rgba(255,255,255,0.88)` | `token.colorText` |
| 次要文字 | `rgba(0,0,0,0.65)` | `rgba(255,255,255,0.65)` | `token.colorTextSecondary` |
| 主题色 | `#1677ff` | `#177ddc` | `token.colorPrimary` |
| 成功色 | `#52c41a` | `#49aa19` | `token.colorSuccess` |
| 警告色 | `#faad14` | `#d89614` | `token.colorWarning` |
| 错误色 | `#ff4d4f` | `#d32029` | `token.colorError` |
| 悬停背景 | `#f5f5f5` | `#262626` | `token.colorFillAlter` |

### 3. 布局规范 (Layout Standards)

**全高度容器:**
```tsx
// ✅ 正确：占满父容器高度
<div className="h-full flex flex-col">
  <div className="flex-1 overflow-auto">
    {/* 内容区自动占满剩余空间 */}
  </div>
</div>
```

**固定头部 + 滚动内容:**
```tsx
// ✅ 头部固定高度，内容区域滚动
<div className="h-full flex flex-col">
  <div className="flex-shrink-0 h-16">固定头部</div>
  <div className="flex-1 overflow-auto">可滚动内容</div>
</div>
```

**冻结表格布局 (Gantt/表格类组件):**
```tsx
// ✅ 左侧冻结列，右侧可滚动区域
<div className="flex h-full">
  {/* 左侧冻结列 - 不横向滚动 */}
  <div className="w-80 flex-shrink-0 overflow-y-auto">
    {/* 表头 */}
    <div className="sticky top-0 z-10">表头</div>
    {/* 表体 */}
    <div>表格内容</div>
  </div>

  {/* 右侧可滚动区域 */}
  <div className="flex-1 overflow-auto">
    可滚动内容
  </div>
</div>
```

**Flex 子元素全高度 (重要!):**
```tsx
// ❌ 错误：flex-1 父元素 + h-full 子元素高度失效
<div className="flex-1 overflow-hidden">
  <div className="h-full">
    {/* 这个 h-full 不会正确工作，因为 flex-1 没有显式高度 */}
  </div>
</div>

// ✅ 方案1：flex-1 父元素添加 min-h-0
<div className="flex-1 overflow-hidden min-h-0">
  <div className="h-full">
    {/* 现在 h-full 可以正确引用父元素的计算高度 */}
  </div>
</div>

// ✅ 方案2：子元素也使用 flex-1
<div className="flex-1 overflow-hidden">
  <div className="flex-1">
    {/* 子元素直接填充父元素 */}
  </div>
</div>

// ✅ 方案3：父元素使用 h-0 强制计算高度
<div className="flex-1 h-0 overflow-hidden">
  <div className="h-full">
    {/* h-0 让 flex-1 有计算高度，h-full 子元素可以正确引用 */}
  </div>
</div>
```

**Ant Design 包装器高度问题:**
```tsx
// ❌ ConfigProvider/AntApp 会创建没有高度的 div，导致 h-full 失效

// ✅ 解决方案：在全局 CSS 中添加（见 src/renderer/styles/layout-fixes.css）
// #root > div,
// #root [class^="css-dev-only-do-not-override"],
// .ant-app,
// .ant-app > div {
//   height: 100% !important;
// }
```

### 4. 颜色使用规范

**状态颜色:**
```tsx
// 使用 Ant Design Tag 颜色
const STATUS_COLORS = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

// 或使用 token
const getStatusColor = (status: string) => {
  const { token } = theme.useToken();
  switch (status) {
    case 'done': return token.colorSuccess;
    case 'blocked': return token.colorError;
    case 'in_progress': return token.colorInfo;
    default: return token.colorTextSecondary;
  }
};
```

**优先级颜色:**
```tsx
const PRIORITY_COLORS = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};
```

### 5. 禁止模式

```tsx
// ❌ 禁止使用硬编码颜色值
backgroundColor: '#FAFAFA'
border: '1px solid #F0F0F0'
color: '#262626'
boxShadow: '0 2px 8px rgba(0,0,0,0.1)'

// ✅ 正确方式
backgroundColor: token.colorBgContainer
border: `1px solid ${token.colorBorder}`
color: token.colorText
boxShadow: token.boxShadow
```

### 6. 组件开发检查清单

开发新组件时，确保：

- [ ] 使用 `theme.useToken()` 获取主题色
- [ ] 不硬编码任何颜色值 (除了透明度 `rgba(0,0,0,0.X)`)
- [ ] 深色/浅色模式都测试过
- [ ] 布局使用 `h-full` 和 `flex` 正确处理高度
- [ ] **flex-1 父元素的 h-full 子元素: 添加 `min-h-0` 到父元素**
- [ ] 滚动区域正确配置 (`overflow-auto` 或 `overflow-hidden`)
- [ ] 边框使用 `token.colorBorder` 系列
- [ ] 文字使用 `token.colorText` 系列
- [ ] 背景使用 `token.colorBg*` 系列

### 7. 常见修复模板

**转换为主题化组件:**
```tsx
// 修复前
function OldComponent() {
  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '16px',
      borderRadius: '4px'
    }}>
      <span style={{ color: '#333' }}>Text</span>
    </div>
  );
}

// 修复后
import { theme } from 'antd';

function NewComponent() {
  const { token } = theme.useToken();

  return (
    <div style={{
      backgroundColor: token.colorBgContainer,
      padding: token.paddingMD,
      borderRadius: `${token.borderRadius}px`
    }}>
      <span style={{ color: token.colorText }}>Text</span>
    </div>
  );
}
```

### 8. 主题配置位置

主题配置文件: `src/renderer/config/theme.ts`
- `lightThemeTokens`: 浅色主题 Token
- `darkThemeTokens`: 深色主题 Token
- `getComponentTokenConfig(isDark)`: 组件级配置

如需新增组件 Token，在 `getComponentTokenConfig` 中添加。

### 9. 使用主题钩子

```tsx
import { useTheme } from '@/hooks/useTheme';

function Component() {
  const { isDark } = useTheme();
  // 根据主题调整逻辑
}
```

### 10. CSS 变量备用方案

对于 CSS 文件（非内联样式），使用 CSS 变量：

```css
/* 支持主题的 CSS */
.my-component {
  background-color: var(--antd-color-bg-container);
  color: var(--antd-color-text);
  border: 1px solid var(--antd-color-border);
}
```

Ant Design v5 会自动注入 CSS 变量，无需手动配置。
