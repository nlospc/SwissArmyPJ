# Gantt Chart 项目属性 CRUD 功能完善

## 问题描述

在 `ExcelGanttChart.tsx` 的项目编辑功能中，Modal 表单只包含了部分字段，缺少了以下重要属性：
- `description` - 项目描述
- `tags` - 项目标签
- `portfolio_id` - 所属 Portfolio（当前版本未实现，已预留接口）

## 已完成的修改

### 1. 扩展了编辑 Modal 表单 (`ExcelGanttChart.tsx`)

**位置：** 第 1942-1973 行

**新增字段：**

```tsx
{/* 描述字段 */}
<Form.Item name="description" label="Description">
  <Input.TextArea rows={3} placeholder="Project description..." />
</Form.Item>

{/* 标签字段 */}
<Form.Item name="tags" label="Tags">
  <Select
    mode="tags"
    style={{ width: '100%' }}
    placeholder="Add tags..."
    tokenSeparators={[',']}
  />
</Form.Item>
```

**优化布局：**
- 将 `owner` 和 `status` 字段改为并排显示（使用 flex 布局）
- 提升表单紧凑性和视觉效果

### 2. 更新了 `handleOpenProjectEdit` 函数

**位置：** 第 782-798 行

**修改内容：**
```typescript
projectForm.setFieldsValue({
  name: project.name,
  owner: project.owner || '',
  status: project.status,
  dates: project.start_date || project.end_date
    ? [project.start_date ? dayjs(project.start_date) : null, project.end_date ? dayjs(project.end_date) : null]
    : null,
  description: project.description || '',      // 新增
  tags: project.tags || [],                    // 新增
  portfolio_id: project.portfolio_id || null,  // 新增（预留）
});
```

### 3. 更新了 `handleProjectModalOk` 函数

**位置：** 第 800-818 行

**修改内容：**
```typescript
onProjectUpdate(editingProject.id, {
  name: values.name,
  owner: values.owner || undefined,
  status: values.status,
  start_date: start ? start.format('YYYY-MM-DD') : undefined,
  end_date: end ? end.format('YYYY-MM-DD') : undefined,
  description: values.description || undefined,                                    // 新增
  tags: values.tags && values.tags.length > 0 ? values.tags : undefined,          // 新增
  portfolio_id: values.portfolio_id || undefined,                                  // 新增（预留）
});
```

## 功能特性

### ✅ 已实现的功能

1. **项目名称 (name)** - 必填字段，支持编辑
2. **项目描述 (description)** - 多行文本框，支持长文本输入
3. **负责人 (owner)** - 单行文本输入
4. **状态 (status)** - 下拉选择：Not Started / In Progress / Blocked / Done
5. **日期范围 (dates)** - 使用 DatePicker.RangePicker 支持选择开始和结束日期
6. **标签 (tags)** - 使用 Select (mode="tags") 支持：
   - 自由输入新标签
   - 多标签选择
   - 使用逗号快速分隔标签

### 🔄 预留接口（未完全实现）

- **portfolio_id** - 已在后端保存逻辑中预留，但 UI 中尚未实现
  - **原因**：需要决定数据来源方式（props 传入 vs store 获取）
  - **当前状态**：
    - ✅ 数据初始化支持 `portfolio_id`
    - ✅ 保存逻辑支持 `portfolio_id`
    - ❌ UI 表单中尚未添加 Portfolio 选择器
  - **后续完善建议**：
    1. 方案一：通过 props 传入 portfolios
       ```tsx
       interface ExcelGanttChartProps {
         // ... 其他 props
         portfolios?: Portfolio[];
       }
       ```
    2. 方案二：在组件内使用 usePortfolioStore
       ```tsx
       import { usePortfolioStore } from '@/stores/usePortfolioStore';
       // ...
       const { portfolios, loadPortfolios } = usePortfolioStore();
       
       useEffect(() => {
         loadPortfolios();
       }, []);
       ```
    3. 添加表单字段：
       ```tsx
       <Form.Item name="portfolio_id" label="Portfolio">
         <Select
           allowClear
           placeholder="Select portfolio..."
           options={portfolios.map(p => ({ 
             label: p.name, 
             value: p.id 
           }))}
         />
       </Form.Item>
       ```

## 使用示例

### 编辑项目

1. 在 Gantt Chart 中点击选中一个项目行
2. 点击工具栏的 "Edit" 按钮（<EditOutlined />）
3. Modal 弹出，显示所有可编辑字段
4. 修改字段后点击 "Save"
5. 调用 `onProjectUpdate` 回调更新后端数据

### 标签编辑

- 输入标签名称后按 Enter 添加
- 输入多个标签用逗号分隔（自动分割）
- 点击标签上的 × 删除标签

## 代码风格

- ✅ 保持了原有的 Ant Design 组件使用风格
- ✅ 使用了内联样式和 Tailwind CSS 类名
- ✅ 遵循了 TypeScript 类型约束
- ✅ 字段均为可选（除 name 必填）

## 文件修改清单

- `src/renderer/components/gantt/ExcelGanttChart.tsx`
  - 修改 `handleOpenProjectEdit` 函数
  - 修改 `handleProjectModalOk` 函数
  - 扩展项目编辑 Modal 表单

## 测试建议

1. **基础编辑测试**
   - 测试所有字段的读取和保存
   - 测试必填字段验证（name）
   - 测试可选字段的清空操作

2. **标签功能测试**
   - 输入单个标签
   - 输入多个标签（逗号分隔）
   - 删除标签
   - 保存空标签列表

3. **日期范围测试**
   - 选择完整日期范围
   - 只选择开始日期
   - 只选择结束日期
   - 清空日期

4. **描述字段测试**
   - 输入长文本
   - 输入特殊字符
   - 清空描述

## 下一步改进

1. 添加 Portfolio 下拉选择框（需要获取 portfolios 数据）
2. 考虑添加表单验证规则（如日期范围校验）
3. 添加字段变更的撤销/重做功能
4. 优化 Modal 宽度以适应更多字段
