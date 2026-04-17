export default {
  common: { save: '保存', cancel: '取消', delete: '删除', edit: '编辑', add: '添加', search: '搜索', loading: '加载中...', confirm: '确认', back: '返回', submit: '提交', update: '更新', export: '导出', import: '导入', reset: '重置' },
  nav: { projects: '项目列表', workbench: '项目工作台', inbox: '收件箱', search: '搜索', settings: '设置' },
  settings: {
    title: '设置', subtitle: '管理工作空间和数据', workspace: '工作空间', dataManagement: '数据管理', about: '关于', workspaceName: '工作空间名称', updateWorkspace: '更新', workspaceNamePlaceholder: '我的工作空间', workspaceNameUpdated: '工作空间名称已成功更新', exportData: '导出数据', exportDataDesc: '将所有数据下载为JSON文件', exportDataButton: '导出数据', exportSuccess: '数据导出成功', exportFailed: '导出数据失败', importData: '导入数据', importDataDesc: '从之前导出的JSON文件导入数据', importFileHint: '仅支持 .json 文件', importUploadText: '点击或拖拽JSON文件到此区域上传', importSuccess: '数据导入成功，请重新加载页面', importFailed: '导入数据失败', invalidImportFile: '无效的导入文件', resetToSample: '重置为示例数据', resetToSampleDesc: '清除所有数据并重新加载示例项目和工作项', resetToSampleButton: '重置为示例数据', resetConfirmTitle: '确定要重置吗？', resetConfirmContent1: '此操作将删除所有当前数据并替换为示例数据。', resetConfirmContent2: '此操作无法撤销。如需保留数据，请先导出。', resetConfirmOk: '是的，重置为示例数据', resetSampleLoaded: '示例数据已加载，正在重新加载页面...', resetFailed: '重置数据失败', language: '语言', languageDesc: '选择应用界面语言', languageChinese: '中文', languageEnglish: 'English', version: '版本', platform: '平台', componentLibrary: '组件库'
  },
  inbox: { title: '收件箱', addItem: '添加项目', placeholder: '输入待办事项...' },
  projects: { title: '项目' },
  search: { title: '搜索', placeholder: '搜索项目、工作项...' },
  app: { name: 'SwissArmyPM', loading: '加载 SwissArmyPM...', initFailed: '初始化失败', retry: '重试', checkConsole: '请检查控制台错误' },
} as const;
