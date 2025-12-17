import { useState, useEffect } from 'react';
import { Layout, Typography, Button, Card, Space, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const [appPath, setAppPath] = useState<string>('');

  useEffect(() => {
    // 获取应用信息
    const getAppInfo = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        const path = await window.electronAPI.getAppPath();
        setAppVersion(version);
        setAppPath(path);
      } catch (error) {
        console.error('获取应用信息失败:', error);
      }
    };

    getAppInfo();
  }, []);

  const handleTestAPI = async () => {
    try {
      const result = await window.electronAPI.checkFileExists(appPath);
      if (result.success) {
        message.success(`路径检查成功: ${result.exists ? '存在' : '不存在'}`);
      } else {
        message.error(`路径检查失败: ${result.error}`);
      }
    } catch (error) {
      message.error('API调用失败');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider width={240} theme="dark" style={{ background: '#141414' }}>
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          borderBottom: '1px solid #303030'
        }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Temu素材管理
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            v{appVersion || '1.0.0'}
          </Text>
        </div>
        
        <div style={{ padding: '20px 0' }}>
          <Button 
            type="text" 
            block 
            icon={<AppstoreOutlined />}
            style={{ 
              height: '48px', 
              textAlign: 'left',
              paddingLeft: '24px',
              color: '#fff',
              background: '#1890ff'
            }}
          >
            素材库
          </Button>
          <Button 
            type="text" 
            block 
            icon={<CloudUploadOutlined />}
            style={{ 
              height: '48px', 
              textAlign: 'left',
              paddingLeft: '24px',
              color: 'rgba(255, 255, 255, 0.65)',
              marginTop: '8px'
            }}
          >
            上传管理
          </Button>
          <Button 
            type="text" 
            block 
            icon={<FolderOpenOutlined />}
            style={{ 
              height: '48px', 
              textAlign: 'left',
              paddingLeft: '24px',
              color: 'rgba(255, 255, 255, 0.65)',
              marginTop: '8px'
            }}
          >
            文件管理
          </Button>
          <Button 
            type="text" 
            block 
            icon={<SettingOutlined />}
            style={{ 
              height: '48px', 
              textAlign: 'left',
              paddingLeft: '24px',
              color: 'rgba(255, 255, 255, 0.65)',
              marginTop: '8px'
            }}
          >
            设置
          </Button>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        <Header style={{ 
          background: '#1f1f1f', 
          padding: '0 24px',
          borderBottom: '1px solid #303030',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            欢迎使用 Temu 素材管理系统
          </Title>
        </Header>

        <Content style={{ 
          margin: '24px',
          background: '#141414',
          borderRadius: '8px',
          padding: '24px'
        }}>
          {/* 欢迎卡片 */}
          <Card 
            style={{ marginBottom: '24px' }}
            styles={{ body: { background: '#1f1f1f' } }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={3} style={{ marginBottom: '8px' }}>
                  🎉 应用已成功启动！
                </Title>
                <Paragraph type="secondary">
                  这是一个基于 Electron + React + TypeScript 的现代化桌面应用框架
                </Paragraph>
              </div>

              <div>
                <Text strong>技术栈：</Text>
                <div style={{ marginTop: '12px' }}>
                  <Space wrap>
                    <Tag color="blue">Electron 28+</Tag>
                    <Tag color="cyan">React 18</Tag>
                    <Tag color="geekblue">TypeScript 5</Tag>
                    <Tag color="purple">Vite 5</Tag>
                    <Tag color="magenta">Ant Design 5</Tag>
                    <Tag color="orange">Zustand</Tag>
                  </Space>
                </div>
              </div>

              <div>
                <Text strong>系统信息：</Text>
                <div style={{ marginTop: '12px' }}>
                  <Paragraph>
                    <Text type="secondary">应用版本：</Text>
                    <Text code>{appVersion || '加载中...'}</Text>
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">数据目录：</Text>
                    <Text code style={{ fontSize: '12px' }}>{appPath || '加载中...'}</Text>
                  </Paragraph>
                </div>
              </div>

              <Space>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleTestAPI}>
                  测试 IPC 通信
                </Button>
                <Button>开始使用</Button>
              </Space>
            </Space>
          </Card>

          {/* 功能预览卡片 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            <Card title="📁 素材管理" styles={{ body: { background: '#1f1f1f' } }}>
              <Paragraph type="secondary">
                支持图片、视频等多种素材类型的统一管理，快速检索和预览。
              </Paragraph>
            </Card>

            <Card title="☁️ 云端同步" styles={{ body: { background: '#1f1f1f' } }}>
              <Paragraph type="secondary">
                自动同步到云端存储，多设备无缝协作，数据永不丢失。
              </Paragraph>
            </Card>

            <Card title="🚀 批量操作" styles={{ body: { background: '#1f1f1f' } }}>
              <Paragraph type="secondary">
                支持批量上传、下载、重命名等操作，大幅提升工作效率。
              </Paragraph>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

