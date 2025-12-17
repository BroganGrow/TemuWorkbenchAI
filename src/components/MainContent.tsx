import { useState, useEffect, useMemo } from 'react';
import { 
  Empty, Card, Tag, Tooltip, Button, List, Image, Modal, Spin, message 
} from 'antd';
import {
  FileImageOutlined,
  FolderOpenOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';

interface FileItem {
  name: string;
  path: string;
  size: number;
  createTime?: Date;
  modifyTime?: Date;
  isDirectory?: boolean;
}

export function MainContent() {
  const { 
    selectedProduct, 
    selectedFolder,
    products,
    viewMode
  } = useAppStore();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewType, setPreviewType] = useState<'image' | 'text'>('image');
  const [previewTitle, setPreviewTitle] = useState('');

  const selectedProductData = useMemo(() => {
    return products.find(p => p.id === selectedProduct);
  }, [products, selectedProduct]);

  // 加载文件列表
  useEffect(() => {
    const loadFiles = async () => {
      if (!selectedFolder || !selectedProductData) {
        setFiles([]);
        return;
      }

      setLoading(true);
      try {
        // 获取选中文件夹的路径
        const folderKeyMap: Record<string, keyof typeof selectedProductData.subFolders> = {
          'ref_images': 'ref_images',
          'ai_raw': 'ai_raw',
          'ai_handle': 'ai_handle',
          'final_goods': 'final_goods'
        };

        const folderKey = folderKeyMap[selectedFolder];
        if (!folderKey) {
          setFiles([]);
          return;
        }

        const folderPath = selectedProductData.subFolders[folderKey];
        
        if (window.electronAPI?.listFiles) {
          const fileList = await window.electronAPI.listFiles(folderPath);
          // 只显示文件，不显示文件夹
          const filesOnly = fileList.filter(f => !f.isDirectory);
          setFiles(filesOnly);
        }
      } catch (error) {
        console.error('加载文件失败:', error);
        message.error('加载文件失败');
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [selectedFolder, selectedProductData]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const textExts = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx'];
    
    if (imageExts.includes(ext || '')) {
      return <FileImageOutlined style={{ fontSize: '40px', color: '#52c41a' }} />;
    } else if (ext === 'pdf') {
      return <FilePdfOutlined style={{ fontSize: '40px', color: '#ff4d4f' }} />;
    } else if (textExts.includes(ext || '')) {
      return <FileTextOutlined style={{ fontSize: '40px', color: '#1890ff' }} />;
    } else {
      return <FileOutlined style={{ fontSize: '40px', color: '#8c8c8c' }} />;
    }
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  };

  const isTextFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx'].includes(ext || '');
  };

  const handlePreview = async (file: FileItem) => {
    if (isImageFile(file.name)) {
      setPreviewType('image');
      setPreviewContent(`file://${file.path}`);
      setPreviewTitle(file.name);
      setPreviewVisible(true);
    } else if (isTextFile(file.name)) {
      try {
        if (window.electronAPI?.readFile) {
          const result = await window.electronAPI.readFile(file.path);
          if (result.success && result.data) {
            setPreviewType('text');
            setPreviewContent(result.data);
            setPreviewTitle(file.name);
            setPreviewVisible(true);
          } else {
            message.error('读取文件失败');
          }
        }
      } catch (error) {
        console.error('读取文件失败:', error);
        message.error('读取文件失败');
      }
    } else {
      message.info('此文件类型暂不支持预览');
    }
  };

  const handleOpenInFolder = async (file: FileItem) => {
    try {
      if (window.electronAPI?.showInFolder) {
        await window.electronAPI.showInFolder(file.path);
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
      message.error('打开文件夹失败');
    }
  };

  if (!selectedProduct) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请从左侧选择一个产品"
          style={{ color: '#8c8c8c' }}
        />
      </div>
    );
  }

  if (!selectedProductData) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Empty
          description="产品不存在"
          style={{ color: '#8c8c8c' }}
        />
      </div>
    );
  }

  const folderNames: Record<string, string> = {
    'ref_images': '📸 参考图',
    'ai_raw': '🤖 AI原图',
    'ai_handle': '✨ AI处理',
    'final_goods': '⭐ 最终成品'
  };

  return (
    <div style={{ 
      padding: '24px',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* 产品信息卡片 */}
      <Card
        style={{ marginBottom: '24px' }}
        styles={{ body: { background: '#1f1f1f' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Tag color={selectedProductData.type === 'ST' ? 'blue' : 'purple'}>
              {selectedProductData.type}{selectedProductData.id.match(/\d+/)?.[0]}
            </Tag>
            <span>{selectedProductData.name}</span>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title="编辑">
              <Button type="text" icon={<EditOutlined />} />
            </Tooltip>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpenOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>路径：</span>
            <Tooltip title={selectedProductData.path}>
              <span style={{ 
                fontSize: '12px',
                maxWidth: '500px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedProductData.path}
              </span>
            </Tooltip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>创建时间：</span>
            <span style={{ fontSize: '12px' }}>
              {formatDate(selectedProductData.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* 文件列表/网格 */}
      {selectedFolder ? (
        <Card
          title={folderNames[selectedFolder] || selectedFolder}
          styles={{ body: { background: '#1f1f1f' } }}
          extra={
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {files.length} 个文件
            </span>
          }
        >
          <Spin spinning={loading}>
            {files.length === 0 ? (
              <Empty
                image={<FileImageOutlined style={{ fontSize: '64px', color: '#8c8c8c' }} />}
                description="文件夹为空"
                style={{ padding: '48px 0' }}
              >
                <Button type="primary" icon={<FolderOpenOutlined />}>
                  打开文件夹
                </Button>
              </Empty>
            ) : viewMode === 'list' ? (
              // 列表视图
              <List
                dataSource={files}
                renderItem={(file) => (
                  <List.Item
                    key={file.path}
                    actions={[
                      <Tooltip title="预览" key="preview">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(file)}
                        />
                      </Tooltip>,
                      <Tooltip title="在文件夹中显示" key="folder">
                        <Button 
                          type="text" 
                          icon={<FolderOpenOutlined />}
                          onClick={() => handleOpenInFolder(file)}
                        />
                      </Tooltip>
                    ]}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #303030'
                    }}
                  >
                    <List.Item.Meta
                      avatar={getFileIcon(file.name)}
                      title={
                        <div style={{ 
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                          <span>{formatFileSize(file.size)}</span>
                          {file.modifyTime && (
                            <span>{formatDate(file.modifyTime)}</span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              // 网格视图
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px'
              }}>
                {files.map((file) => (
                  <Card
                    key={file.path}
                    hoverable
                    size="small"
                    cover={
                      isImageFile(file.name) ? (
                        <div style={{
                          height: '150px',
                          background: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={`file://${file.path}`}
                            alt={file.name}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          height: '150px',
                          background: '#141414',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getFileIcon(file.name)}
                        </div>
                      )
                    }
                    actions={[
                      <Tooltip title="预览" key="preview">
                        <EyeOutlined onClick={() => handlePreview(file)} />
                      </Tooltip>,
                      <Tooltip title="在文件夹中显示" key="folder">
                        <FolderOpenOutlined onClick={() => handleOpenInFolder(file)} />
                      </Tooltip>
                    ]}
                    style={{
                      background: '#141414'
                    }}
                  >
                    <Card.Meta
                      title={
                        <Tooltip title={file.name}>
                          <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '13px'
                          }}>
                            {file.name}
                          </div>
                        </Tooltip>
                      }
                      description={
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                          {formatFileSize(file.size)}
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            )}
          </Spin>
        </Card>
      ) : (
        <Card
          title="标准文件夹"
          styles={{ body: { background: '#1f1f1f' } }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' 
              ? 'repeat(auto-fill, minmax(200px, 1fr))' 
              : '1fr',
            gap: '16px'
          }}>
            {[
              { key: 'ref_images', label: '📸 参考图', fullLabel: '01_Ref_Images', path: selectedProductData.subFolders.ref_images },
              { key: 'ai_raw', label: '🤖 AI原图', fullLabel: '02_Ai_Raw', path: selectedProductData.subFolders.ai_raw },
              { key: 'ai_handle', label: '✨ AI处理', fullLabel: '03_AI_Handle', path: selectedProductData.subFolders.ai_handle },
              { key: 'final_goods', label: '⭐ 最终成品', fullLabel: '04_Final_Goods_Images', path: selectedProductData.subFolders.final_goods }
            ].map(folder => (
              <Card
                key={folder.key}
                hoverable
                size="small"
                style={{ 
                  cursor: 'pointer',
                  background: '#141414'
                }}
                styles={{ body: { padding: '16px' } }}
                onClick={() => useAppStore.getState().setSelectedFolder(folder.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{folder.label.split(' ')[0]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{folder.label}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {folder.fullLabel}
                    </div>
                  </div>
                  <FolderOpenOutlined style={{ fontSize: '20px', color: '#fd7a45' }} />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={previewType === 'image' ? '80%' : '70%'}
        centered
        styles={{
          body: {
            maxHeight: '70vh',
            overflow: 'auto',
            background: previewType === 'image' ? '#000' : '#1f1f1f'
          }
        }}
      >
        {previewType === 'image' ? (
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewContent}
              alt={previewTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </div>
        ) : (
          <pre style={{
            background: '#141414',
            padding: '16px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
            lineHeight: '1.6',
            maxHeight: '60vh',
            overflow: 'auto'
          }}>
            {previewContent}
          </pre>
        )}
      </Modal>
    </div>
  );
}
