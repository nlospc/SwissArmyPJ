# Ant Design v5 集成指南

本文档介绍如何在 SwissArmyPM 项目中集成和使用 Ant Design v5。

## 📦 安装依赖

### 1. 安装 Ant Design 和相关依赖

```bash
npm install antd@^5.22.0 @ant-design/icons@^5.5.0
```

### 2. 卸载旧的 Radix UI 依赖（可选）

迁移完成后，可以卸载 Radix UI 相关依赖：

```bash
npm uninstall @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-avatar \
  @radix-ui/react-checkbox \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-label \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slot \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  class-variance-authority \
  tailwindcss-animate
```

## 🎨 基础配置

### 1. 全局样式导入

在 `src/renderer/index.css` 或 `src/renderer/main.tsx` 中：

```tsx
// src/renderer/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css'; // Ant Design v5 重置样式
import './index.css'; // 你的自定义样式

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2. 主题配置（推荐）

Ant Design v5 使用 CSS-in-JS 进行主题定制。创建一个主题配置文件：

```tsx
// src/renderer/theme/index.ts
import { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    
    // 字体
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    
    // 圆角
    borderRadius: 6,
    
    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  
  components: {
    // 组件级别的主题定制
    Button: {
      borderRadius: 4,
    },
    Input: {
      borderRadius: 4,
    },
    Modal: {
      borderRadiusLG: 8,
    },
  },
  
  algorithm: [
    // 可以在这里添加主题算法，如暗色模式
    // theme.darkAlgorithm,
  ],
};

export default theme;
```

### 3. 在应用中使用主题

```tsx
// src/renderer/App.tsx
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import customTheme from './theme';

function App() {
  return (
    <ConfigProvider
      theme={customTheme}
      locale={zhCN}
    >
      {/* 你的应用内容 */}
    </ConfigProvider>
  );
}

export default App;
```

## 🔧 组件使用示例

### 按钮 (Button)

```tsx
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

function MyComponent() {
  return (
    <div>
      <Button type="primary">主要按钮</Button>
      <Button>默认按钮</Button>
      <Button type="dashed">虚线按钮</Button>
      <Button type="link">链接按钮</Button>
      <Button type="primary" icon={<PlusOutlined />}>
        新建
      </Button>
      <Button type="primary" danger>
        危险操作
      </Button>
    </div>
  );
}
```

### 输入框 (Input)

```tsx
import { Input, Space } from 'antd';

function MyComponent() {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input placeholder="基础输入框" />
      <Input.Search placeholder="搜索输入框" />
      <Input.TextArea placeholder="多行文本" rows={4} />
      <Input.Password placeholder="密码输入框" />
    </Space>
  );
}
```

### 对话框 (Modal)

```tsx
import { Modal, Button } from 'antd';
import { useState } from 'react';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleOk = () => setIsModalOpen(false);
  const handleCancel = () => setIsModalOpen(false);

  return (
    <>
      <Button type="primary" onClick={showModal}>
        打开对话框
      </Button>
      <Modal
        title="对话框标题"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>对话框内容...</p>
      </Modal>
    </>
  );
}
```

### 表格 (Table)

```tsx
import { Table } from 'antd';

const columns = [
  {
    title: '任务名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
  },
];

const data = [
  { key: '1', name: '完成文档', status: '进行中', priority: '高' },
  { key: '2', name: '代码审查', status: '待开始', priority: '中' },
];

function MyComponent() {
  return <Table columns={columns} dataSource={data} />;
}
```

### 消息提示 (message)

```tsx
import { message, Button } from 'antd';

function MyComponent() {
  const showMessage = () => {
    message.success('操作成功！');
  };
  
  const showError = () => {
    message.error('操作失败，请重试');
  };

  return (
    <>
      <Button onClick={showMessage}>成功提示</Button>
      <Button onClick={showError} danger>错误提示</Button>
    </>
  );
}
```

## 🌙 暗色模式配置

### 1. 实现主题切换

```tsx
// src/renderer/hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { theme } from 'antd';

type ThemeMode = 'light' | 'dark';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // 从 localStorage 或系统偏好读取
    return localStorage.getItem('theme') as ThemeMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return {
    mode,
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    toggleTheme,
  };
}
```

### 2. 在应用中使用

```tsx
// src/renderer/App.tsx
import { ConfigProvider } from 'antd';
import { useTheme } from './hooks/useTheme';

function App() {
  const { algorithm, mode, toggleTheme } = useTheme();

  return (
    <ConfigProvider theme={{ algorithm }}>
      <button onClick={toggleTheme}>
        切换到{mode === 'light' ? '暗色' : '亮色'}模式
      </button>
      {/* 应用内容 */}
    </ConfigProvider>
  );
}
```

## 🎯 最佳实践

### 1. 按需引入

Ant Design v5 支持 Tree Shaking，直接引入需要的组件即可：

```tsx
// ✅ 推荐 - 按需引入
import { Button, Input, Table } from 'antd';

// ❌ 不推荐 - 引入整个库
// import * as antd from 'antd';
```

### 2. 图标使用

```tsx
// 推荐使用 @ant-design/icons
import { UserOutlined, PlusOutlined } from '@ant-design/icons';

<Button icon={<UserOutlined />}>用户</Button>
```

### 3. 样式定制

优先使用主题配置进行样式定制，避免直接覆盖组件样式：

```tsx
// ✅ 推荐 - 使用主题
const theme = {
  components: {
    Button: {
      borderRadius: 4,
      fontWeight: 600,
    },
  },
};

// ❌ 不推荐 - 直接覆盖样式
// const customStyle = { '.ant-btn': { borderRadius: '4px' } };
```

### 4. 表单处理

配合 Ant Design 的 Form 组件使用：

```tsx
import { Form, Input, Button } from 'antd';

function MyForm() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('表单值:', values);
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item name="title" label="标题" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  );
}
```

## 📚 参考资料

- [Ant Design 官方文档](https://ant.design/)
- [Ant Design 主题定制](https://ant.design/docs/react/customize-theme-cn)
- [Ant Design 图标库](https://ant.design/components/icon-cn/)
- [迁移指南](./migration-guide.md)
