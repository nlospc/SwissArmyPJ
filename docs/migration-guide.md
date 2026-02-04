# 从 Radix UI 迁移到 Ant Design v5

本文档提供从 Radix UI 到 Ant Design v5 的详细迁移指南。

## 📋 迁移概览

### 为什么要迁移？

- **更完整的功能** - Ant Design 提供更丰富的开箱即用组件
- **更好的企业级支持** - 成熟的设计系统和长期维护
- **更少的手动样式** - 内置主题和样式系统
- **更好的开发体验** - 统一的 API 设计和 TypeScript 支持
- **国际化支持** - 内置多语言支持

### 迁移策略

建议采用**渐进式迁移**策略：
1. 先安装 Ant Design，与 Radix UI 共存
2. 新功能使用 Ant Design 组件
3. 逐步重构现有组件
4. 最后移除 Radix UI 依赖

## 🔄 组件对照表

| Radix UI | Ant Design v5 | 迁移难度 | 说明 |
|----------|---------------|----------|------|
| `Dialog` | `Modal` | 🟢 简单 | API 相似 |
| `DropdownMenu` | `Dropdown` | 🟡 中等 | 数据结构不同 |
| `Tabs` | `Tabs` | 🟢 简单 | API 基本一致 |
| `Checkbox` | `Checkbox` | 🟢 简单 | 直接替换 |
| `Select` | `Select` | 🟡 中等 | 数据格式不同 |
| `Popover` | `Popover` | 🟢 简单 | API 相似 |
| `Toast` | `message` | 🟡 中等 | 调用方式不同 |
| `AlertDialog` | `Modal.confirm` | 🟡 中等 | 需要调整 |
| `Progress` | `Progress` | 🟢 简单 | 直接替换 |
| `Separator` | `Divider` | 🟢 简单 | 直接替换 |
| `Label` | `Form.Item label` | 🟡 中等 | 通常配合表单使用 |
| `Accordion` | `Collapse` | 🟡 中等 | API 略有不同 |

## 📝 详细迁移示例

### Dialog → Modal

```tsx
// Ant Design v5
import { Modal, Button } from 'antd';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        打开对话框
      </Button>
      <Modal
        title="标题"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <p>对话框内容</p>
      </Modal>
    </>
  );
}
```

### AlertDialog → Modal.confirm

```tsx
import { Button, Modal } from 'antd';

function DeleteButton() {
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除？',
      content: '此操作无法撤销',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        // 执行删除
      },
    });
  };

  return (
    <Button type="primary" danger onClick={handleDelete}>
      删除
    </Button>
  );
}
```

### DropdownMenu → Dropdown

```tsx
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';

function MyComponent() {
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: () => console.log('edit'),
    },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      onClick: () => console.log('delete'),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button>操作</Button>
    </Dropdown>
  );
}
```

### Toast → message

```tsx
import { Button, message } from 'antd';

function MyComponent() {
  const handleAction = () => {
    message.success('操作已完成');
  };

  return <Button onClick={handleAction}>执行操作</Button>;
}
```

## 📋 迁移检查清单

### 准备阶段
- [ ] 阅读 Ant Design v5 文档
- [ ] 安装 Ant Design 和图标库
- [ ] 配置主题系统
- [ ] 设置暗色模式（如果需要）

### 组件迁移
- [ ] Modal / Dialog 组件
- [ ] Button 组件
- [ ] Input / Form 组件
- [ ] Select / Dropdown 组件
- [ ] Tabs 组件
- [ ] Toast / message 组件
- [ ] 其他 UI 组件

### 测试阶段
- [ ] 功能测试
- [ ] 样式测试
- [ ] 响应式测试
- [ ] 暗色模式测试

### 清理阶段
- [ ] 移除 Radix UI 依赖
- [ ] 移除相关类型定义
- [ ] 清理无用代码
- [ ] 更新文档

## 📚 延伸阅读

- [Ant Design v5 官方文档](https://ant.design/)
- [项目组件库指南](./component-library.md)
