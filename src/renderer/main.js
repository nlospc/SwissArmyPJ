import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/globals.css';
import './styles/dark-mode-fixes.css';
import 'antd/dist/reset.css';
// 开发环境下加载主题验证工具
if (process.env.NODE_ENV === 'development') {
    import('./utils/themeValidator');
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(ConfigProvider, { locale: zhCN, children: _jsx(App, {}) }) }));
