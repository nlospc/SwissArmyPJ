# 主题配置使用指南

本项目已实现完善的深色/亮色主题适配系统，确保所有组件都能正确响应主题变化。

## 🎨 主题系统概览

### 已完成的配置

#### 1. 全局主题配置 (`src/renderer/config/theme.ts`)
- ✅ 完整的 Ant Design Token 配置
- ✅ 30+ 组件级别的主题适配
- ✅ 亮色和深色主题的完整定义

#### 2. CSS 变量系统 (`src/renderer/styles/globals.css`)
- ✅ Ant Design Token CSS 变量
- ✅ 自定义 CSS 变量
- ✅ 主题切换过渡动画

#### 3. 主题管理 Hook (`src/renderer/hooks/useTheme.ts`)
- ✅ 主题状态管理
- ✅ localStorage 持久化
- ✅ 系统主题偏好检测
- ✅ 主题切换功能

#### 4. 工具函数 (`src/renderer/utils/theme.ts`)
- ✅ 主题 Token 访问工具
- ✅ 主题感知的样式对象
- ✅ 主题变化监听

## 📖 使用方法

### 方式一：使用 Ant Design 组件（推荐）

所有 Ant Design 组件会自动响应主题变化：

```tsx
import { Button, Card, Input, Table } from 'antd';

function MyComponent() {
  return (
    <Card title="标题">
      <Input placeholder="输入框" />
      <Button type="primary">按钮</Button>
      <Table dataSource={[]} columns={[]} />
    </Card>
  );
}
```

### 方式二：使用 Tailwind CSS 的主题类名

使用自定义的主题感知类名：

```tsx
function MyComponent() {
  return (
    <div className="bg-theme-container text-theme-primary border-theme-primary">
      主题感知的背景和文字颜色
    </div>
  );
}
```

### 方式三：使用 CSS 变量

直接使用 CSS 变量：

```tsx
function MyComponent() {
  return (
    <div style={{
      backgroundColor: 'var(--ant-color-bg-container)',
      color: 'var(--ant-color-text)',
      borderColor: 'var(--ant-color-border)'
    }}>
      使用 CSS 变量
    </div>
  );
}
```

### 方式四：使用主题工具函数

```tsx
import { themeStyles, themeClasses } from '@/utils/theme';

function MyComponent() {
  return (
    <div style={themeStyles.bgContainer} className={themeClasses.textPrimary}>
      使用工具函数
    </div>
  );
}
```

### 方式五：监听主题变化

```tsx
import { useEffect } from 'react';
import { watchThemeChange } from '@/utils/theme';

function MyComponent() {
  useEffect(() => {
    const cleanup = watchThemeChange((isDark) => {
      console.log('主题已切换:', isDark ? '深色' : '亮色');
      // 执行主题切换后的逻辑
    });

    return cleanup;
  }, []);

  return <div>组件内容</div>;
}
```

## 🎨 可用的主题 Token

### 背景色
- `--ant-color-bg-base`: 基础背景色
- `--ant-color-bg-container`: 容器背景色
- `--ant-color-bg-elevated`: 浮层背景色
- `--ant-color-bg-layout`: 布局背景色
- `--ant-color-bg-spotlight`: 聚光灯背景色

### 文字色
- `--ant-color-text`: 主要文字色
- `--ant-color-text-secondary`: 次要文字色
- `--ant-color-text-tertiary`: 第三级文字色
- `--ant-color-text-quaternary`: 第四级文字色

### 边框色
- `--ant-color-border`: 主要边框色
- `--ant-color-border-secondary`: 次要边框色

### 品牌色
- `--ant-color-primary`: 主色
- `--ant-color-success`: 成功色
- `--ant-color-warning`: 警告色
- `--ant-color-error`: 错误色
- `--ant-color-info`: 信息色

### 其他
- `--ant-color-split`: 分割线色

## 🔧 主题切换功能

### 使用主题切换按钮

```tsx
import { ThemeToggle } from '@/components/common/ThemeToggle';

function SettingsPage() {
  return (
    <div>
      <h1>设置</h1>
      <ThemeToggle />
    </div>
  );
}
```

### 手动控制主题

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { mode, isDark, toggleTheme, setLightTheme, setDarkTheme } = useTheme();

  return (
    <div>
      <p>当前主题: {mode}</p>
      <button onClick={toggleTheme}>切换主题</button>
      <button onClick={setLightTheme}>设为亮色</button>
      <button onClick={setDarkTheme}>设为深色</button>
    </div>
  );
}
```

## 🎯 最佳实践

### 1. 优先使用 Ant Design 组件
Ant Design 组件已经完美适配主题，无需额外处理：

```tsx
// ✅ 推荐
<Card title="标题">内容</Card>
<Input.TextArea />

// ❌ 避免
<div style={{ backgroundColor: '#ffffff' }}>内容</div>
```

### 2. 使用语义化的颜色 Token
使用 Token 而不是硬编码颜色：

```tsx
// ✅ 推荐
<div style={{ color: 'var(--ant-color-text)' }}>文本</div>

// ❌ 避免
<div style={{ color: '#000000' }}>文本</div>
```

### 3. 添加主题过渡动画
为自定义样式添加过渡效果：

```tsx
// ✅ 推荐
<div style={{
  backgroundColor: 'var(--ant-color-bg-container)',
  transition: 'background-color 0.2s ease'
}}>
  内容
</div>
```

### 4. 使用主题感知的工具类
利用预定义的工具类：

```tsx
// ✅ 推荐
<div className="bg-theme-container text-theme-primary theme-transition">
  内容
</div>
```

## 🐛 常见问题

### Q: 为什么有些组件没有响应主题变化？
**A**: 确保这些组件使用的是 Ant Design 组件或使用了主题 Token。检查是否有硬编码的颜色值。

### Q: 如何为自定义组件添加主题支持？
**A**: 使用 CSS 变量或主题工具函数：

```tsx
const MyCustomComponent = () => {
  return (
    <div style={{
      backgroundColor: 'var(--ant-color-bg-container)',
      color: 'var(--ant-color-text)',
      border: `1px solid var(--ant-color-border)`
    }}>
      自定义组件内容
    </div>
  );
};
```

### Q: 主题切换时出现闪烁？
**A**: 确保在 `index.html` 或根组件初始化时立即设置主题：

```tsx
// 在 useTheme hook 中已完成
useEffect(() => {
  const saved = localStorage.getItem('swiss-army-pm-theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
  }
}, []);
```

## 📚 相关文件

- `src/renderer/config/theme.ts` - 主题配置
- `src/renderer/hooks/useTheme.ts` - 主题管理 Hook
- `src/renderer/utils/theme.ts` - 主题工具函数
- `src/renderer/styles/globals.css` - CSS 变量定义
- `src/renderer/components/common/ThemeToggle.tsx` - 主题切换组件

## 🚀 扩展主题

### 添加新的主题 Token

在 `src/renderer/config/theme.ts` 中添加：

```typescript
export const lightThemeTokens = {
  // ... 现有配置
  colorMyCustom: '#custom-color',
};

export const darkThemeTokens = {
  // ... 现有配置
  colorMyCustom: '#custom-dark-color',
};
```

### 添加自定义 CSS 变量

在 `src/renderer/styles/globals.css` 中添加：

```css
:root {
  --my-custom-color: #value;
}

.dark {
  --my-custom-color: #dark-value;
}
```

## 📝 注意事项

1. **避免硬编码颜色**: 始终使用主题 Token 或 CSS 变量
2. **测试两种主题**: 确保在深色和亮色模式下都测试过
3. **考虑对比度**: 确保文字在两种主题下都清晰可读
4. **使用过渡动画**: 为主题切换添加平滑的过渡效果
5. **保持一致性**: 在整个应用中使用相同的主题系统

---

如有问题或建议，请查看相关文件或联系开发团队。
