import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#fd7a45',
          borderRadius: 6,
          colorInfo: '#fd7a45',
          colorLink: '#fd7a45',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

