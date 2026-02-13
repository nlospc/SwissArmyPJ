export default {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    confirm: 'Confirm',
    back: 'Back',
    submit: 'Submit',
    update: 'Update',
    export: 'Export',
    import: 'Import',
    reset: 'Reset',
  },
  nav: {
    dashboard: 'Dashboard',
    inbox: 'Inbox',
    portfolio: 'Portfolio',
    projects: 'Projects',
    myWork: 'My Work',
    search: 'Search',
    settings: 'Settings',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your workspace and data',
    workspace: 'Workspace',
    dataManagement: 'Data Management',
    about: 'About',
    
    // Workspace
    workspaceName: 'Workspace Name',
    updateWorkspace: 'Update',
    workspaceNamePlaceholder: 'My Workspace',
    workspaceNameUpdated: 'Workspace name updated successfully',
    
    // Data Management
    exportData: 'Export Data',
    exportDataDesc: 'Download all your data as a JSON file',
    exportDataButton: 'Export Data',
    exportSuccess: 'Data exported successfully',
    exportFailed: 'Failed to export data',
    
    importData: 'Import Data',
    importDataDesc: 'Import data from a previously exported JSON file',
    importFileHint: 'Support for .json files only',
    importUploadText: 'Click or drag JSON file to this area to upload',
    importSuccess: 'Data imported successfully. Please reload the page.',
    importFailed: 'Failed to import data',
    invalidImportFile: 'Invalid import file',
    
    resetToSample: 'Reset to Sample Data',
    resetToSampleDesc: 'Clear all data and reload sample projects and work items',
    resetToSampleButton: 'Reset to Sample Data',
    resetConfirmTitle: 'Are you absolutely sure?',
    resetConfirmContent1: 'This action will delete ALL your current data and replace it with sample data.',
    resetConfirmContent2: 'This action cannot be undone. Make sure to export your data first if you want to keep it.',
    resetConfirmOk: 'Yes, reset to sample data',
    resetSampleLoaded: 'Sample data loaded. Reloading page...',
    resetFailed: 'Failed to reset data',
    
    // Language
    language: 'Language',
    languageDesc: 'Select application interface language',
    languageChinese: '中文',
    languageEnglish: 'English',
    
    // About
    version: 'Version',
    platform: 'Platform',
    componentLibrary: 'Component Library',
  },
  dashboard: {
    title: 'Dashboard',
    overview: 'Overview',
    recentProjects: 'Recent Projects',
    myWorkItems: 'My Work Items',
    quickStats: 'Quick Stats',
  },
  inbox: {
    title: 'Inbox',
    addItem: 'Add Item',
    placeholder: 'Enter a to-do item...',
  },
  portfolio: {
    title: 'Portfolio',
  },
  projects: {
    title: 'Projects',
  },
  myWork: {
    title: 'My Work',
  },
  search: {
    title: 'Search',
    placeholder: 'Search projects, work items...',
  },
  app: {
    name: 'SwissArmyPM',
    loading: 'Loading SwissArmyPM...',
    initFailed: 'Failed to initialize',
    retry: 'Retry',
    checkConsole: 'Please check the console for errors',
  },
} as const;
