import { useState, useEffect, useMemo } from 'react';
import { 
  Empty, Card, Tag, Tooltip, Button, List, Image, Modal, Spin, message, Space, Input 
} from 'antd';

const { TextArea } = Input;
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
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FileMarkdownOutlined
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
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [imageScale, setImageScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [goodsInfo, setGoodsInfo] = useState<string>('');
  const [goodsInfoLoading, setGoodsInfoLoading] = useState(false);
  const [isEditingGoodsInfo, setIsEditingGoodsInfo] = useState(false);
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const selectedProductData = useMemo(() => {
    return products.find(p => p.id === selectedProduct);
  }, [products, selectedProduct]);

  // 加载 GoodsInfo.md
  useEffect(() => {
    const loadGoodsInfo = async () => {
      if (!selectedProductData) {
        setGoodsInfo('');
        return;
      }

      setGoodsInfoLoading(true);
      try {
        const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
        
        if (window.electronAPI?.readFile) {
          const result = await window.electronAPI.readFile(goodsInfoPath);
          if (result.success && result.data) {
            setGoodsInfo(result.data);
          } else {
            setGoodsInfo('');
          }
        }
      } catch (error) {
        console.error('加载产品信息失败:', error);
        setGoodsInfo('');
      } finally {
        setGoodsInfoLoading(false);
      }
    };

    loadGoodsInfo();
  }, [selectedProductData]);

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

  // 处理文件拖放
  const handleDragEnter = (e: React.DragEvent, folderKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  };

  const handleDrop = async (e: React.DragEvent, folderKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    if (!selectedProductData) {
      message.error('请先选择产品');
      return;
    }

    // 获取拖放的文件
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) {
      return;
    }

    // 获取目标文件夹路径
    const folderKeyMap: Record<string, keyof typeof selectedProductData.subFolders> = {
      'ref_images': 'ref_images',
      'ai_raw': 'ai_raw',
      'ai_handle': 'ai_handle',
      'final_goods': 'final_goods'
    };

    const targetFolderKey = folderKeyMap[folderKey];
    if (!targetFolderKey) {
      message.error('无效的文件夹');
      return;
    }

    const targetFolder = selectedProductData.subFolders[targetFolderKey];
    if (!targetFolder) {
      message.error('目标文件夹不存在');
      return;
    }

    setImporting(true);
    try {
      // 获取文件路径
      const filePaths = droppedFiles.map(file => (file as any).path);
      
      // 调用导入API
      if (window.electronAPI?.importFiles) {
        const result = await window.electronAPI.importFiles(filePaths, targetFolder);
        
        if (result.success.length > 0) {
          message.success(`成功导入 ${result.success.length} 个文件`);
          
          // 如果当前选中的是目标文件夹，刷新文件列表
          if (selectedFolder === folderKey) {
            const fileList = await window.electronAPI.listFiles(targetFolder);
            const filesOnly = fileList.filter(f => !f.isDirectory);
            setFiles(filesOnly);
          }
        }
        
        if (result.failed.length > 0) {
          message.error(`${result.failed.length} 个文件导入失败`);
          console.error('导入失败的文件:', result.failed);
        }
      }
    } catch (error) {
      console.error('导入文件失败:', error);
      message.error('导入文件失败');
    } finally {
      setImporting(false);
    }
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

  const handlePreview = async (file: FileItem, index?: number) => {
    if (isImageFile(file.name)) {
      setPreviewType('image');
      setPreviewContent(`file://${file.path}`);
      setPreviewTitle(file.name);
      setCurrentPreviewIndex(index !== undefined ? index : files.findIndex(f => f.path === file.path));
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

  // 切换到上一张/下一张图片（不循环）
  const handlePrevImage = () => {
    const imageFiles = files.filter(f => isImageFile(f.name));
    if (imageFiles.length === 0) return;
    
    const currentImageIndex = imageFiles.findIndex(f => f.path === files[currentPreviewIndex]?.path);
    if (currentImageIndex <= 0) return; // 已经是第一张，不切换
    
    const prevIndex = currentImageIndex - 1;
    const prevFile = imageFiles[prevIndex];
    const fileIndex = files.findIndex(f => f.path === prevFile.path);
    
    setPreviewContent(`file://${prevFile.path}`);
    setPreviewTitle(prevFile.name);
    setCurrentPreviewIndex(fileIndex);
    setImageScale(1); // 重置缩放
  };

  const handleNextImage = () => {
    const imageFiles = files.filter(f => isImageFile(f.name));
    if (imageFiles.length === 0) return;
    
    const currentImageIndex = imageFiles.findIndex(f => f.path === files[currentPreviewIndex]?.path);
    if (currentImageIndex >= imageFiles.length - 1) return; // 已经是最后一张，不切换
    
    const nextIndex = currentImageIndex + 1;
    const nextFile = imageFiles[nextIndex];
    const fileIndex = files.findIndex(f => f.path === nextFile.path);
    
    setPreviewContent(`file://${nextFile.path}`);
    setPreviewTitle(nextFile.name);
    setCurrentPreviewIndex(fileIndex);
    setImageScale(1); // 重置缩放
  };

  // 缩放控制
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 5)); // 最大5倍
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.25)); // 最小0.25倍
  };

  const handleZoomReset = () => {
    setImageScale(1);
  };

  // 全屏控制
  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // 键盘和滚轮事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewVisible || previewType !== 'image') return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          handleExitFullscreen();
        } else {
          setPreviewVisible(false);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!isFullscreen) {
          handleFullscreen();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!previewVisible || previewType !== 'image' || !e.ctrlKey) return;
      
      e.preventDefault();
      
      if (e.deltaY < 0) {
        // 向上滚动，放大
        handleZoomIn();
      } else {
        // 向下滚动，缩小
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [previewVisible, previewType, currentPreviewIndex, files]);

  // 重置缩放和全屏当打开新预览时
  useEffect(() => {
    if (previewVisible) {
      setImageScale(1);
      setIsFullscreen(false);
    }
  }, [previewVisible]);

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

  const handleOpenGoodsInfo = async () => {
    if (!selectedProductData) return;
    
    const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
    try {
      if (window.electronAPI?.openFile) {
        await window.electronAPI.openFile(goodsInfoPath);
      }
    } catch (error) {
      console.error('打开文件失败:', error);
      message.error('打开文件失败');
    }
  };

  const handleViewGoodsInfo = () => {
    if (!goodsInfo) {
      message.info('产品信息为空');
      return;
    }
    
    setPreviewType('text');
    setPreviewContent(goodsInfo);
    setPreviewTitle('GoodsInfo.md');
    setPreviewVisible(true);
  };

  // 保存 GoodsInfo.md
  const saveGoodsInfo = async (content: string) => {
    if (!selectedProductData) return;
    
    const goodsInfoPath = `${selectedProductData.path}/GoodsInfo.md`;
    try {
      if (window.electronAPI?.writeFile) {
        const result = await window.electronAPI.writeFile(goodsInfoPath, content);
        if (!result.success) {
          message.error('保存失败');
        }
        // 成功时不显示提示
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  // 处理内容变化（带防抖）
  const handleGoodsInfoChange = (value: string) => {
    setGoodsInfo(value);
    
    // 清除之前的定时器
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    
    // 设置新的定时器，1秒后自动保存
    const timer = setTimeout(() => {
      saveGoodsInfo(value);
    }, 1000);
    
    setSaveTimer(timer);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [saveTimer]);

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
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* 产品信息卡片 */}
      <Card
        style={{ 
          marginBottom: '16px', 
          flexShrink: 0,
          maxHeight: '40%',
          overflow: 'hidden'
        }}
        styles={{ 
          body: { 
            background: '#1f1f1f',
            overflow: 'auto'
          } 
        }}
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
          
          {/* GoodsInfo.md 编辑 */}
          <div style={{ 
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #303030'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileMarkdownOutlined style={{ color: '#fd7a45' }} />
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>产品信息</span>
                {isEditingGoodsInfo && (
                  <Tag color="green" style={{ fontSize: '10px', padding: '0 6px', lineHeight: '18px' }}>
                    编辑中
                  </Tag>
                )}
              </div>
              <Space size="small">
                <Tooltip title="查看完整内容">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={handleViewGoodsInfo}
                    disabled={!goodsInfo || goodsInfoLoading}
                  >
                    全屏查看
                  </Button>
                </Tooltip>
                <Tooltip title="用外部编辑器打开">
                  <Button
                    type="text"
                    size="small"
                    icon={<FolderOpenOutlined />}
                    onClick={handleOpenGoodsInfo}
                  >
                    打开文件
                  </Button>
                </Tooltip>
              </Space>
            </div>
            
            <Spin spinning={goodsInfoLoading}>
              <div style={{ 
                maxHeight: '200px',
                overflow: 'hidden'
              }}>
                <TextArea
                  value={goodsInfo}
                  onChange={(e) => handleGoodsInfoChange(e.target.value)}
                  onFocus={() => setIsEditingGoodsInfo(true)}
                  onBlur={() => setIsEditingGoodsInfo(false)}
                  placeholder="点击输入产品信息... 支持 Markdown 格式，自动保存"
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  style={{
                    background: '#141414',
                    border: '1px solid #303030',
                    borderRadius: '4px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#d9d9d9',
                    resize: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  styles={{
                    textarea: {
                      color: '#d9d9d9'
                    }
                  }}
                />
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#8c8c8c', 
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {goodsInfo.length} 字符 · 输入后 1 秒自动保存
              </div>
            </Spin>
          </div>
        </div>
      </Card>

      {/* 文件列表/网格 */}
      {selectedFolder ? (
        <div 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
          onDragEnter={(e) => handleDragEnter(e, selectedFolder)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, selectedFolder)}
        >
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{folderNames[selectedFolder] || selectedFolder}</span>
                {dragOverFolder === selectedFolder && (
                  <Tag color="orange" style={{ margin: 0 }}>
                    拖放文件到这里
                  </Tag>
                )}
              </div>
            }
            styles={{ 
              body: { 
                background: dragOverFolder === selectedFolder 
                  ? 'rgba(253, 122, 69, 0.08)' 
                  : '#1f1f1f',
                overflow: 'auto',
                height: '100%',
                border: dragOverFolder === selectedFolder 
                  ? '2px dashed #fd7a45' 
                  : 'none',
                transition: 'all 0.3s'
              } 
            }}
            extra={
              <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {files.length} 个文件
              </span>
            }
            style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: dragOverFolder === selectedFolder 
                ? '2px dashed #fd7a45' 
                : '1px solid #434343'
            }}
          >
          <Spin spinning={loading || importing}>
            {files.length === 0 ? (
              <Empty
                image={<FileImageOutlined style={{ fontSize: '64px', color: dragOverFolder === selectedFolder ? '#fd7a45' : '#8c8c8c' }} />}
                description={
                  <div>
                    <div>文件夹为空</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
                      拖拽文件到这里导入
                    </div>
                  </div>
                }
                style={{ padding: '48px 0' }}
              >
                <Button type="primary" icon={<FolderOpenOutlined />} onClick={() => {
                  if (selectedProductData && selectedFolder) {
                    const folderKeyMap: Record<string, keyof typeof selectedProductData.subFolders> = {
                      'ref_images': 'ref_images',
                      'ai_raw': 'ai_raw',
                      'ai_handle': 'ai_handle',
                      'final_goods': 'final_goods'
                    };
                    const targetFolderKey = folderKeyMap[selectedFolder];
                    const folderPath = selectedProductData.subFolders[targetFolderKey];
                    if (folderPath && window.electronAPI?.showInFolder) {
                      window.electronAPI.showInFolder(folderPath);
                    }
                  }
                }}>
                  打开文件夹
                </Button>
              </Empty>
            ) : viewMode === 'list' ? (
              // 列表视图
              <List
                dataSource={files}
                renderItem={(file, index) => (
                  <List.Item
                    key={file.path}
                    actions={[
                      <Tooltip title="预览" key="preview">
                        <Button 
                          type="text" 
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(file, index)}
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
                {files.map((file, index) => (
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
                        <EyeOutlined onClick={() => handlePreview(file, index)} />
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
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Card
            title="标准文件夹"
            styles={{ 
              body: { 
                background: '#1f1f1f',
                overflow: 'auto',
                height: '100%'
              } 
            }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
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
                  background: dragOverFolder === folder.key ? 'rgba(253, 122, 69, 0.15)' : '#141414',
                  border: dragOverFolder === folder.key ? '2px dashed #fd7a45' : '1px solid #434343',
                  transition: 'all 0.3s'
                }}
                styles={{ body: { padding: '16px' } }}
                onClick={() => useAppStore.getState().setSelectedFolder(folder.key)}
                onDragEnter={(e) => handleDragEnter(e, folder.key)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{folder.label.split(' ')[0]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      {folder.label}
                      {dragOverFolder === folder.key && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#fd7a45' }}>
                          释放以导入
                        </span>
                      )}
                    </div>
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
        </div>
      )}

      {/* 预览模态框 */}
      {!isFullscreen ? (
        <Modal
          open={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width={previewType === 'image' ? '90%' : '70%'}
          centered
          styles={{
            body: {
              height: previewType === 'image' ? '75vh' : 'auto',
              maxHeight: '80vh',
              overflow: 'hidden',
              background: previewType === 'image' ? '#000' : '#1f1f1f',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          }}
        >
          {previewType === 'image' ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* 图片容器 */}
              <div style={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: imageScale > 1 ? 'auto' : 'hidden'
              }}>
                <img
                  src={previewContent}
                  alt={previewTitle}
                  style={{
                    maxWidth: imageScale === 1 ? '100%' : 'none',
                    maxHeight: imageScale === 1 ? '100%' : 'none',
                    width: imageScale === 1 ? 'auto' : 'auto',
                    height: imageScale === 1 ? 'auto' : 'auto',
                    transform: `scale(${imageScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s',
                    cursor: imageScale > 1 ? 'move' : 'default',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* 控制栏 */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px 16px',
                borderRadius: '24px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                zIndex: 10
              }}>
              {/* 切换按钮 */}
              <Space size="small">
                <Tooltip title="上一张 (←)">
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={handlePrevImage}
                    disabled={
                      files.filter(f => isImageFile(f.name))
                        .findIndex(f => f.path === files[currentPreviewIndex]?.path) <= 0
                    }
                    style={{ color: '#fff' }}
                  />
                </Tooltip>
                
                <span style={{ color: '#fff', fontSize: '12px', padding: '0 8px' }}>
                  {files.filter(f => isImageFile(f.name))
                    .findIndex(f => f.path === files[currentPreviewIndex]?.path) + 1}
                  {' / '}
                  {files.filter(f => isImageFile(f.name)).length}
                </span>
                
                <Tooltip title="下一张 (→)">
                  <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={handleNextImage}
                    disabled={
                      files.filter(f => isImageFile(f.name))
                        .findIndex(f => f.path === files[currentPreviewIndex]?.path) >= 
                      files.filter(f => isImageFile(f.name)).length - 1
                    }
                    style={{ color: '#fff' }}
                  />
                </Tooltip>
              </Space>

              <div style={{ width: '1px', height: '20px', background: '#434343' }} />

              {/* 缩放按钮 */}
              <Space size="small">
                <Tooltip title="放大 (Ctrl + 滚轮)">
                  <Button
                    type="text"
                    icon={<ZoomInOutlined />}
                    onClick={handleZoomIn}
                    disabled={imageScale >= 5}
                    style={{ color: '#fff' }}
                  />
                </Tooltip>
                
                <span style={{ color: '#fff', fontSize: '12px', minWidth: '45px', textAlign: 'center' }}>
                  {Math.round(imageScale * 100)}%
                </span>
                
                <Tooltip title="缩小 (Ctrl + 滚轮)">
                  <Button
                    type="text"
                    icon={<ZoomOutOutlined />}
                    onClick={handleZoomOut}
                    disabled={imageScale <= 0.25}
                    style={{ color: '#fff' }}
                  />
                </Tooltip>
                
                <Tooltip title="重置">
                  <Button
                    type="text"
                    icon={<UndoOutlined />}
                    onClick={handleZoomReset}
                    disabled={imageScale === 1}
                    style={{ color: '#fff' }}
                  />
                </Tooltip>
              </Space>

              <div style={{ width: '1px', height: '20px', background: '#434343' }} />

              {/* 全屏按钮 */}
              <Tooltip title="全屏 (F)">
                <Button
                  type="text"
                  icon={<FullscreenOutlined />}
                  onClick={handleFullscreen}
                  style={{ color: '#fff' }}
                />
              </Tooltip>
            </div>
          </div>
        ) : (
          <pre style={{
            background: '#141414',
            padding: '16px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
            lineHeight: '1.6',
            maxHeight: '70vh',
            overflow: 'auto'
          }}>
            {previewContent}
          </pre>
        )}
      </Modal>
      ) : null}

      {/* 全屏预览 */}
      {isFullscreen && previewType === 'image' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* 图片容器 */}
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: imageScale > 1 ? 'auto' : 'hidden'
          }}>
            <img
              src={previewContent}
              alt={previewTitle}
              style={{
                maxWidth: imageScale === 1 ? '100%' : 'none',
                maxHeight: imageScale === 1 ? '100%' : 'none',
                transform: `scale(${imageScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s',
                cursor: imageScale > 1 ? 'move' : 'default',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* 控制栏 */}
          <div style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '12px 20px',
            borderRadius: '32px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            zIndex: 10000
          }}>
            {/* 切换按钮 */}
            <Space size="small">
              <Tooltip title="上一张 (←)">
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={handlePrevImage}
                  disabled={
                    files.filter(f => isImageFile(f.name))
                      .findIndex(f => f.path === files[currentPreviewIndex]?.path) <= 0
                  }
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <span style={{ color: '#fff', fontSize: '14px', padding: '0 12px' }}>
                {files.filter(f => isImageFile(f.name))
                  .findIndex(f => f.path === files[currentPreviewIndex]?.path) + 1}
                {' / '}
                {files.filter(f => isImageFile(f.name)).length}
              </span>
              
              <Tooltip title="下一张 (→)">
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={handleNextImage}
                  disabled={
                    files.filter(f => isImageFile(f.name))
                      .findIndex(f => f.path === files[currentPreviewIndex]?.path) >= 
                    files.filter(f => isImageFile(f.name)).length - 1
                  }
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
            </Space>

            <div style={{ width: '1px', height: '24px', background: '#434343' }} />

            {/* 缩放按钮 */}
            <Space size="small">
              <Tooltip title="放大">
                <Button
                  type="text"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={imageScale >= 5}
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <span style={{ color: '#fff', fontSize: '14px', minWidth: '50px', textAlign: 'center' }}>
                {Math.round(imageScale * 100)}%
              </span>
              
              <Tooltip title="缩小">
                <Button
                  type="text"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={imageScale <= 0.25}
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <Tooltip title="重置">
                <Button
                  type="text"
                  icon={<UndoOutlined />}
                  onClick={handleZoomReset}
                  disabled={imageScale === 1}
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
            </Space>

            <div style={{ width: '1px', height: '24px', background: '#434343' }} />

            {/* 退出全屏 */}
            <Tooltip title="退出全屏 (ESC)">
              <Button
                type="text"
                icon={<FullscreenExitOutlined />}
                onClick={handleExitFullscreen}
                style={{ color: '#fff' }}
                size="large"
              />
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
