# 技术栈

本文档详细介绍了 SwissArmyPM 项目使用的技术栈和选型理由。

## 🎯 核心技术栈

### 桌面应用框架
**Electron v29.0.0**
- 跨平台桌面应用开发框架
- 丰富的生态系统和社区支持
- 强大的原生 API 集成能力

### 前端框架
**React v19.0.0 + Vite v6.0.11**
- React: 主流的 UI 组件库
- Vite: 极速的开发构建工具
- TypeScript: 类型安全的开发体验

### UI 组件库
**Ant Design v5** (正在迁移中)
- 企业级 UI 设计语言
- 丰富的组件库和设计规范
- 优秀的主题定制能力
- 内置暗色模式支持

### 状态管理
**Zustand v5.0.2**
- 轻量级状态管理库
- 简洁的 API 设计
- 优秀的性能表现

### 样式方案
**Tailwind CSS v3.4.17 + Ant Design Theme**
- Tailwind CSS: 原子化 CSS 框架
- Ant Design Theme: 组件主题定制
- CSS Modules: 组件级样式隔离

### 本地数据库
**SQLite + FTS5**
- better-sqlite3 v9.6.0: 同步 SQLite 绑定
- FTS5: 全文搜索扩展
- 零配置的嵌入式数据库

## 🛠️ 开发工具链

### 构建工具
- **Vite** - 前端构建工具
- **vite-plugin-electron** - Electron 集成插件
- **TypeScript** - 类型检查和编译

### 代码质量
- **ESLint** - 代码检查（待配置）
- **Prettier** - 代码格式化（待配置）

### 开发辅助
- **electron-rebuild** - Native 模块重建
- **electron-devtools-installer** - React DevTools 集成

## 📦 主要依赖库

### UI 相关
```json
{
  "antd": "^5.x.x",           // Ant Design 组件库
  "@ant-design/icons": "^x.x.x", // Ant Design 图标库
  "lucide-react": "^0.468.0"   // 轻量级图标库（可保留）
}
```

### 工具库
```json
{
  "date-fns": "^4.1.0",       // 日期处理
  "immer": "^11.1.3",         // 不可变数据
  "clsx": "^2.1.1",           // 类名工具
  "tailwind-merge": "^2.5.5"  // Tailwind 类名合并
}
```

## 🔄 迁移状态

### 从 Radix UI 到 Ant Design v5

| 组件类型 | Radix UI | Ant Design v5 | 迁移状态 |
|---------|----------|---------------|----------|
| 按钮 | - | Button | ✅ 计划中 |
| 输入框 | - | Input | ✅ 计划中 |
| 对话框 | Dialog | Modal | ✅ 计划中 |
| 下拉菜单 | Dropdown Menu | Dropdown | ✅ 计划中 |
| 标签页 | Tabs | Tabs | ✅ 计划中 |
| 复选框 | Checkbox | Checkbox | ✅ 计划中 |
| 选择器 | Select | Select | ✅ 计划中 |
| 弹出提示 | Popover | Popover | ✅ 计划中 |
| 进度条 | Progress | Progress | ✅ 计划中 |
| 分隔线 | Separator | Divider | ✅ 计划中 |
| 提示消息 | Toast | message | ✅ 计划中 |
| 警告对话框 | Alert Dialog | Modal.confirm | ✅ 计划中 |

详见 [迁移指南](./migration-guide.md)

## 📊 性能优化策略

### 渲染性能
- React 19 的并发特性
- 虚拟滚动处理大列表
- 组件懒加载和代码分割

### 数据性能
- SQLite 索引优化
- FTS5 全文搜索
- Zustand 状态管理优化

### 构建性能
- Vite HMR 快速更新
- 按需加载减少包体积
- Electron 缓存策略

## 🔐 安全性考虑

- Electron 安全最佳实践
- Context Isolation 启用
- Node.js 集成控制
- CSP (Content Security Policy)

## 🌐 国际化支持

计划中：使用 react-i18next 实现多语言支持
