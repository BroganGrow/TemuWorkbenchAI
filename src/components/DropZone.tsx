import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  List,
  Progress,
  Space,
  Typography,
  Tag,
  message,
  Modal,
  Input,
  Tooltip,
  Empty
} from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useFileDrop } from '../hooks/useFileDrop';
import type { DroppedFile, ImportResult } from '../types';

const { Text, Title, Paragraph } = Typography;

/**
 * 文件拖放区域组件
 */
export function DropZone() {
  const {
    isDragging,
    droppedFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFiles,
    removeFile,
    formatFileSize,
    supportedExtensions
  } = useFileDrop();

  const [targetFolder, setTargetFolder] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /**
   * 选择目标文件夹
   */
  const handleSelectFolder = useCallback(async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setTargetFolder(folder);
        message.success(`已选择文件夹: ${folder}`);
      }
    } catch (error) {
      message.error('选择文件夹失败');
      console.error(error);
    }
  }, []);

  /**
   * 导入文件
   */
  const handleImport = useCallback(async () => {
    if (droppedFiles.length === 0) {
      message.warning('请先拖放文件');
      return;
    }

    if (!targetFolder) {
      message.warning('请先选择目标文件夹');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const filePaths = droppedFiles.map(file => file.path);
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await window.electronAPI.importFiles(filePaths, targetFolder);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      setImportResult(result);
      setShowResult(true);

      if (result.success.length > 0) {
        message.success(`成功导入 ${result.success.length} 个文件`);
      }
      if (result.failed.length > 0) {
        message.error(`${result.failed.length} 个文件导入失败`);
      }

      // 清空文件列表
      setTimeout(() => {
        clearFiles();
        setImportProgress(0);
      }, 1000);
    } catch (error) {
      message.error('导入失败: ' + (error as Error).message);
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  }, [droppedFiles, targetFolder, clearFiles]);

  /**
   * 处理文件放置
   */
  const onDrop = useCallback((e: React.DragEvent) => {
    const files = handleDrop(e);
    if (files && files.length > 0) {
      message.success(`已添加 ${files.length} 个图片文件`);
    } else if (e.dataTransfer.files.length > 0) {
      message.warning('只支持图片文件');
    }
  }, [handleDrop]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 拖放区域 */}
      <Card
        style={{
          marginBottom: '24px',
          border: isDragging ? '2px dashed #1890ff' : '2px dashed #434343',
          background: isDragging ? 'rgba(24, 144, 255, 0.05)' : '#1f1f1f',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        bodyStyle={{ padding: '48px 24px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
      >
        <div style={{ textAlign: 'center' }}>
          <InboxOutlined
            style={{
              fontSize: '64px',
              color: isDragging ? '#1890ff' : '#8c8c8c',
              marginBottom: '16px',
              transition: 'all 0.3s ease'
            }}
          />
          <Title level={4} style={{ marginBottom: '8px' }}>
            {isDragging ? '松开鼠标放置文件' : '拖放图片文件到这里'}
          </Title>
          <Paragraph type="secondary">
            支持格式：{supportedExtensions.map(ext => ext.toUpperCase()).join(', ')}
          </Paragraph>
          <Paragraph type="secondary" style={{ fontSize: '12px' }}>
            支持批量拖放多个文件
          </Paragraph>
        </div>
      </Card>

      {/* 目标文件夹选择 */}
      <Card
        title={
          <Space>
            <FolderOpenOutlined />
            <span>目标文件夹</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
        styles={{ body: { background: '#1f1f1f' } }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            value={targetFolder}
            placeholder="点击下方按钮选择目标文件夹"
            readOnly
            size="large"
            prefix={<FolderOpenOutlined />}
          />
          <Button
            type="primary"
            icon={<FolderOpenOutlined />}
            onClick={handleSelectFolder}
            size="large"
            block
          >
            选择文件夹
          </Button>
        </Space>
      </Card>

      {/* 文件列表 */}
      <Card
        title={
          <Space>
            <FileImageOutlined />
            <span>待导入文件 ({droppedFiles.length})</span>
          </Space>
        }
        extra={
          droppedFiles.length > 0 && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={clearFiles}
            >
              清空列表
            </Button>
          )
        }
        style={{ marginBottom: '24px' }}
        styles={{ body: { background: '#1f1f1f', maxHeight: '400px', overflow: 'auto' } }}
      >
        {droppedFiles.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无文件"
            style={{ padding: '32px 0' }}
          />
        ) : (
          <List
            dataSource={droppedFiles}
            renderItem={(file: DroppedFile) => (
              <List.Item
                key={file.path}
                actions={[
                  <Tooltip title="移除">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeFile(file.path)}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: '#141414',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileImageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{file.name}</Text>
                      <Tag color="blue">{file.name.split('.').pop()?.toUpperCase()}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        大小: {formatFileSize(file.size)}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: '12px' }}
                        ellipsis={{ tooltip: file.path }}
                      >
                        路径: {file.path}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 导入进度 */}
      {isImporting && (
        <Card style={{ marginBottom: '24px' }} styles={{ body: { background: '#1f1f1f' } }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Text strong>正在导入文件...</Text>
            <Progress
              percent={importProgress}
              status={importProgress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Space>
        </Card>
      )}

      {/* 导入按钮 */}
      <Button
        type="primary"
        size="large"
        block
        icon={<CloudUploadOutlined />}
        onClick={handleImport}
        loading={isImporting}
        disabled={droppedFiles.length === 0 || !targetFolder}
        style={{ height: '56px', fontSize: '16px' }}
      >
        {isImporting ? '导入中...' : `导入 ${droppedFiles.length} 个文件`}
      </Button>

      {/* 导入结果对话框 */}
      <Modal
        title="导入结果"
        open={showResult}
        onOk={() => setShowResult(false)}
        onCancel={() => setShowResult(false)}
        width={600}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowResult(false)}>
            确定
          </Button>
        ]}
      >
        {importResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 成功列表 */}
            {importResult.success.length > 0 && (
              <div>
                <Title level={5}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  成功 ({importResult.success.length})
                </Title>
                <List
                  size="small"
                  dataSource={importResult.success}
                  renderItem={item => (
                    <List.Item>
                      <Text type="success">{item}</Text>
                    </List.Item>
                  )}
                  style={{ maxHeight: '200px', overflow: 'auto' }}
                />
              </div>
            )}

            {/* 失败列表 */}
            {importResult.failed.length > 0 && (
              <div>
                <Title level={5}>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                  失败 ({importResult.failed.length})
                </Title>
                <List
                  size="small"
                  dataSource={importResult.failed}
                  renderItem={item => (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Text type="danger">{item.file}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.error}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                  style={{ maxHeight: '200px', overflow: 'auto' }}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}

