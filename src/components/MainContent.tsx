import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Empty, Card, Tag, Tooltip, Button, List, Image, Modal, Spin, message, Space, Input, Dropdown, Popconfirm 
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
  EyeInvisibleOutlined,
  DownloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UndoOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  FileMarkdownOutlined,
  CopyOutlined,
  RobotOutlined,
  LoadingOutlined,
  FormatPainterOutlined,
  DragOutlined,
  PushpinOutlined,
  ArrowsAltOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { generateCompletion } from '../utils/aiService';
import { NewProductDialog } from './NewProductDialog';

interface FileItem {
  name: string;
  path: string;
  size: number;
  createTime?: Date;
  modifyTime?: Date;
  isDirectory?: boolean;
}

// 工作流分类（使用产品结构）
const WORKFLOW_CATEGORIES = [
  '01_In_Progress',
  '02_Listing',
  '03_Waiting',
  '04_Active',
  '05_Archive'
];

export function MainContent() {
  const { 
    selectedProduct, 
    selectedFolder,
    products,
    viewMode,
    currentCategory,
    aiTitlePrompt
  } = useAppStore();

  const { aiModels } = useAppStore();
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
  const [optimizingTitle, setOptimizingTitle] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [normalizeConfirmOpen, setNormalizeConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  // 编辑产品弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProductInfo, setEditProductInfo] = useState<{ path: string; folderName: string } | undefined>(undefined);
  // 图片预览工具条自动隐藏
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const toolbarTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 预览图片分辨率
  const [previewResolution, setPreviewResolution] = useState<{ width: number; height: number } | null>(null);
  // 文件列表图片分辨率缓存
  const [fileResolutions, setFileResolutions] = useState<Record<string, { width: number; height: number }>>({});

  // 工具条位置：'corner' 右下角垂直 | 'center' 底部中央水平（从 localStorage 读取记忆）
  const [toolbarPosition, setToolbarPosition] = useState<'corner' | 'center'>(() => {
    const saved = localStorage.getItem('preview-toolbar-position');
    return (saved === 'center' ? 'center' : 'corner');
  });
  // 是否自动隐藏工具条（从 localStorage 读取记忆，默认不隐藏）
  const [autoHideToolbar, setAutoHideToolbar] = useState<boolean>(() => {
    const saved = localStorage.getItem('preview-toolbar-auto-hide');
    return saved === 'true';
  });

  // 判断是否是工作流分类
  const isWorkflowCategory = WORKFLOW_CATEGORIES.includes(currentCategory);

  const selectedProductData = useMemo(() => {
    // 工作流分类：从 products 中查找
    if (isWorkflowCategory) {
      return products.find(p => p.id === selectedProduct);
    }
    // 普通文件夹：不需要产品数据
    return null;
  }, [products, selectedProduct, currentCategory, isWorkflowCategory]);

  // 打开编辑产品弹窗
  const handleEditProduct = useCallback(() => {
    if (!selectedProductData) return;
    
    // 从路径中提取文件夹名
    const pathParts = selectedProductData.path.split(/[/\\]/);
    const folderName = pathParts[pathParts.length - 1];
    
    setEditProductInfo({
      path: selectedProductData.path,
      folderName
    });
    setEditDialogOpen(true);
  }, [selectedProductData]);

  // 编辑成功后刷新产品列表
  const handleEditSuccess = useCallback(() => {
    // 触发产品列表刷新
    useAppStore.getState().triggerRefresh();
  }, []);

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
      // 切换文件夹时清空分辨率缓存
      setFileResolutions({});
      
      // 工作流模式：需要产品数据和子文件夹
      if (isWorkflowCategory) {
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
      }
      // 普通文件夹模式：直接从路径加载
      else {
        if (!selectedProduct) {
          setFiles([]);
          return;
        }

        setLoading(true);
        try {
          if (window.electronAPI?.listFiles) {
            const fileList = await window.electronAPI.listFiles(selectedProduct);
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
      }
    };

    loadFiles();
  }, [selectedFolder, selectedProductData, selectedProduct, isWorkflowCategory]);

  // 加载图片分辨率
  useEffect(() => {
    // 找出是图片且尚未加载分辨率的文件
    const imagesToLoad = files.filter(f => isImageFile(f.name) && !fileResolutions[f.path]);
    
    if (imagesToLoad.length === 0) return;

    imagesToLoad.forEach(file => {
      const img = new window.Image();
      img.src = `file://${file.path}`;
      img.onload = () => {
        setFileResolutions(prev => ({
          ...prev,
          [file.path]: { width: img.naturalWidth, height: img.naturalHeight }
        }));
      };
      // 避免死循环：如果加载失败，这里目前没有处理，下次可能会重试
      // 但由于 useEffect 只依赖 files，files 不变就不会重试，所以是安全的
    });
  }, [files]);

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
      return; // 用户取消或没有拖放文件，静默返回
    }

    // 获取文件路径并过滤有效文件
    const filePaths = droppedFiles
      .map(file => (file as any).path)
      .filter(path => path && typeof path === 'string');
    
    // 如果没有有效的文件路径，静默返回（可能是拖放了非文件项）
    if (filePaths.length === 0) {
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
      // 调用导入API，传入产品ID用于生成标准化文件名
      if (window.electronAPI?.importFiles) {
        // 获取产品ID（如 AD006）
        const productId = selectedProductData.id;
        
        const result = await window.electronAPI.importFiles(filePaths, targetFolder, productId);
        
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

  // 批量规范化文件命名 - 打开确认弹窗
  const handleNormalizeFileNames = () => {
    if (!selectedProductData || !selectedFolder) {
      message.warning('请先选择一个文件夹');
      return;
    }
    setNormalizeConfirmOpen(true);
  };

  // 执行规范化命名
  const doNormalizeFileNames = async () => {
    if (!selectedProductData || !selectedFolder) return;

    const folderKeyMap: Record<string, keyof typeof selectedProductData.subFolders> = {
      'ref_images': 'ref_images',
      'ai_raw': 'ai_raw',
      'ai_handle': 'ai_handle',
      'final_goods': 'final_goods'
    };

    const targetFolderKey = folderKeyMap[selectedFolder];
    if (!targetFolderKey) {
      message.error('无效的文件夹');
      return;
    }

    const folderPath = selectedProductData.subFolders[targetFolderKey];
    const productId = selectedProductData.id;

    setNormalizeConfirmOpen(false);
    setNormalizing(true);
    
    try {
      const result = await window.electronAPI.normalizeFileNames(folderPath, productId);
      
      if (result.success) {
        if (result.renamed.length > 0) {
          message.success(`成功重命名 ${result.renamed.length} 个文件`);
        }
        if (result.skipped.length > 0) {
          message.info(`跳过 ${result.skipped.length} 个已规范化的文件`);
        }
        
        // 刷新文件列表
        const fileList = await window.electronAPI.listFiles(folderPath);
        const filesOnly = fileList.filter(f => !f.isDirectory);
        setFiles(filesOnly);
      } else {
        message.error(`操作失败: ${result.error}`);
      }
      
      if (result.failed.length > 0) {
        message.warning(`${result.failed.length} 个文件重命名失败`);
        console.error('重命名失败的文件:', result.failed);
      }
    } catch (error) {
      console.error('规范化命名失败:', error);
      message.error('规范化命名失败');
    } finally {
      setNormalizing(false);
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
      return <FileOutlined style={{ fontSize: '40px', color: 'var(--text-secondary)' }} />;
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
      setPreviewResolution(fileResolutions[file.path] || null); // 尝试从缓存获取
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
    setPreviewResolution(fileResolutions[prevFile.path] || null);
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
    setPreviewResolution(fileResolutions[nextFile.path] || null);
    setCurrentPreviewIndex(fileIndex);
    setImageScale(1); // 重置缩放
  };

  // 缩放控制
  const handleZoomIn = () => {
    setImageScale(prev => {
      // 每次放大 10%
      const newScale = Math.round((prev + 0.1) * 10) / 10;
      return Math.min(newScale, 5); // 最大5倍
    });
  };

  const handleZoomOut = () => {
    setImageScale(prev => {
      // 每次缩小 10%
      const newScale = Math.round((prev - 0.1) * 10) / 10;
      return Math.max(newScale, 0.1); // 最小0.1倍
    });
  };

  const handleZoomReset = () => {
    setImageScale(1);
  };

  // 工具条自动隐藏控制
  const showToolbar = useCallback(() => {
    setToolbarVisible(true);
    // 清除之前的定时器
    if (toolbarTimerRef.current) {
      clearTimeout(toolbarTimerRef.current);
    }
    // 只有开启自动隐藏时才设置定时器
    if (autoHideToolbar) {
      toolbarTimerRef.current = setTimeout(() => {
        setToolbarVisible(false);
      }, 2000);
    }
  }, [autoHideToolbar]);

  // 切换工具条位置（并保存到 localStorage）
  const toggleToolbarPosition = useCallback(() => {
    setToolbarPosition(prev => {
      const newPosition = prev === 'corner' ? 'center' : 'corner';
      localStorage.setItem('preview-toolbar-position', newPosition);
      return newPosition;
    });
  }, []);

  // 切换自动隐藏（并保存到 localStorage）
  const toggleAutoHideToolbar = useCallback(() => {
    setAutoHideToolbar(prev => {
      const newValue = !prev;
      localStorage.setItem('preview-toolbar-auto-hide', String(newValue));
      // 如果关闭自动隐藏，确保工具条显示
      if (!newValue) {
        setToolbarVisible(true);
        if (toolbarTimerRef.current) {
          clearTimeout(toolbarTimerRef.current);
          toolbarTimerRef.current = null;
        }
      }
      return newValue;
    });
  }, []);

  const handleImageAreaMouseMove = useCallback(() => {
    showToolbar();
  }, [showToolbar]);

  const handleToolbarMouseEnter = useCallback(() => {
    // 鼠标悬停在工具条上时，清除隐藏定时器，保持显示
    if (toolbarTimerRef.current) {
      clearTimeout(toolbarTimerRef.current);
      toolbarTimerRef.current = null;
    }
    setToolbarVisible(true);
  }, []);

  const handleToolbarMouseLeave = useCallback(() => {
    // 鼠标离开工具条后，重新开始计时隐藏
    showToolbar();
  }, [showToolbar]);

  // 预览打开时显示工具条
  useEffect(() => {
    if (previewVisible) {
      showToolbar();
    }
    return () => {
      if (toolbarTimerRef.current) {
        clearTimeout(toolbarTimerRef.current);
      }
    };
  }, [previewVisible, showToolbar]);

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
        // F 键切换全屏模式
        if (isFullscreen) {
          handleExitFullscreen();
        } else {
          handleFullscreen();
        }
      }
    };

    let wheelTimeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      if (!previewVisible || previewType !== 'image') return;
      
      // Ctrl + 滚轮：缩放
      if (e.ctrlKey) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
          // 向上滚动，放大
          handleZoomIn();
        } else {
          // 向下滚动，缩小
          handleZoomOut();
        }
      } 
      // 普通滚轮：切换图片（带防抖）
      else {
        e.preventDefault();
        
        // 防抖处理：200ms 内只触发一次
        if (wheelTimeout) return;
        
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 200);
        
        if (e.deltaY < 0) {
          // 向上滚动，上一张
          handlePrevImage();
        } else {
          // 向下滚动，下一张
          handleNextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [previewVisible, previewType, currentPreviewIndex, files, isFullscreen]);

  // 重置缩放和全屏当打开新预览时
  useEffect(() => {
    if (previewVisible) {
      setImageScale(1);
      setIsFullscreen(false);
    }
  }, [previewVisible]);

  // Ctrl+V 粘贴文件功能
  useEffect(() => {
    const handlePaste = async (e: KeyboardEvent) => {
      // 只在按下 Ctrl+V 时触发
      if (!e.ctrlKey || e.key !== 'v') return;
      
      // 如果焦点在输入框或文本区域，不拦截粘贴
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // 必须选中了产品和子文件夹
      if (!selectedProductData || !selectedFolder) {
        return;
      }
      
      e.preventDefault();
      
      // 从剪贴板读取文件
      try {
        const electronAPI = window.electronAPI as any;
        if (!electronAPI?.getClipboardFiles) {
          message.warning('当前版本不支持粘贴功能');
          return;
        }
        
        const result = await electronAPI.getClipboardFiles() as { success: boolean; files?: string[]; error?: string };
        
        if (!result.success || !result.files || result.files.length === 0) {
          if (result.error && result.error !== '剪贴板中没有文件') {
            message.warning('剪贴板中没有文件');
          }
          return;
        }
        
        // 获取目标文件夹路径
        const folderKeyMap: Record<string, keyof typeof selectedProductData.subFolders> = {
          'ref_images': 'ref_images',
          'ai_raw': 'ai_raw',
          'ai_handle': 'ai_handle',
          'final_goods': 'final_goods'
        };
        
        const targetFolderKey = folderKeyMap[selectedFolder];
        if (!targetFolderKey) {
          message.error('无效的文件夹');
          return;
        }
        
        const targetFolder = selectedProductData.subFolders[targetFolderKey];
        if (!targetFolder) {
          message.error('目标文件夹不存在');
          return;
        }
        
        // 导入文件
        setImporting(true);
        const productId = selectedProductData.id;
        const importResult = await window.electronAPI.importFiles(result.files, targetFolder, productId);
        
        if (importResult.success.length > 0) {
          message.success(`成功粘贴 ${importResult.success.length} 个文件`);
          
          // 刷新文件列表
          const fileList = await window.electronAPI.listFiles(targetFolder);
          const filesOnly = fileList.filter(f => !f.isDirectory);
          setFiles(filesOnly);
        }
        
        if (importResult.failed.length > 0) {
          message.error(`${importResult.failed.length} 个文件粘贴失败`);
          console.error('粘贴失败的文件:', importResult.failed);
        }
      } catch (error) {
        console.error('粘贴文件失败:', error);
        message.error('粘贴文件失败');
      } finally {
        setImporting(false);
      }
    };
    
    window.addEventListener('keydown', handlePaste);
    
    return () => {
      window.removeEventListener('keydown', handlePaste);
    };
  }, [selectedProductData, selectedFolder]);

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

  const handleCopyFile = async (filePath: string) => {
    try {
      if (window.electronAPI?.copyFileToClipboard) {
        const result = await window.electronAPI.copyFileToClipboard(filePath);
        if (result.success) {
          message.success('文件已复制到剪贴板');
        } else {
          message.error(result.error || '复制失败');
        }
      }
    } catch (error) {
      console.error('复制文件失败:', error);
      message.error('复制文件失败');
    }
  };

  // 删除文件
  const handleDeleteFile = async (file: FileItem) => {
    try {
      if (window.electronAPI?.deleteFile) {
        const result = await window.electronAPI.deleteFile(file.path);
        if (result.success) {
          message.success('文件已删除');
          // 从列表中移除
          setFiles(prev => prev.filter(f => f.path !== file.path));
        } else {
          message.error(result.error || '删除失败');
        }
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      message.error('删除文件失败');
    }
  };

  // 文件右键菜单项
  const getFileContextMenuItems = (file: FileItem) => [
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制文件',
      onClick: () => handleCopyFile(file.path)
    },
    {
      key: 'show-in-folder',
      icon: <FolderOpenOutlined />,
      label: '打开文件位置',
      onClick: () => handleOpenInFolder(file)
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除文件',
      danger: true,
      onClick: () => {
        setFileToDelete(file);
        setDeleteConfirmOpen(true);
      }
    }
  ];

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

  // AI 优化标题
  const handleOptimizeTitle = async () => {
    if (!goodsInfo) return;

    // 提取当前标题 (第一行，移除 # 和空格)
    const lines = goodsInfo.split('\n');
    const titleLineIndex = lines.findIndex(line => line.trim().startsWith('# '));
    if (titleLineIndex === -1) {
      message.warning('未找到产品标题，请确保第一行为 "# 标题" 格式');
      return;
    }

    const currentTitle = lines[titleLineIndex].replace(/^#\s*/, '').trim();
    if (!currentTitle) {
      message.warning('标题内容为空');
      return;
    }

    setOptimizingTitle(true);
    try {
      const prompt = aiTitlePrompt.replace('{title}', currentTitle);

      const optimizedTitle = await generateCompletion(aiModels, [
        { role: 'user', content: prompt }
      ]);

      if (optimizedTitle) {
        // 更新标题
        const newLines = [...lines];
        newLines[titleLineIndex] = `# ${optimizedTitle.trim()}`;
        const newContent = newLines.join('\n');
        
        handleGoodsInfoChange(newContent);
        message.success('标题优化成功');
      }
    } catch (error) {
      message.error(`优化失败: ${(error as Error).message}`);
    } finally {
      setOptimizingTitle(false);
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
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>
    );
  }

  // 工作流模式下，如果产品数据不存在，显示错误
  if (isWorkflowCategory && !selectedProductData) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Empty
          description="产品不存在"
          style={{ color: 'var(--text-secondary)' }}
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
      {/* 产品信息卡片 - 只在工作流模式下显示 */}
      {isWorkflowCategory && selectedProductData && (
      <Card
        style={{ 
          marginBottom: '16px', 
          flexShrink: 0,
          maxHeight: '40%',
          overflow: 'hidden'
        }}
        styles={{ 
          body: { 
            background: 'var(--card-bg)',
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
            <Tooltip title="编辑产品">
              <Button type="text" icon={<EditOutlined />} onClick={handleEditProduct} />
            </Tooltip>
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpenOutlined style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>路径：</span>
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
            <CalendarOutlined style={{ color: 'var(--text-secondary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>创建时间：</span>
            <span style={{ fontSize: '12px' }}>
              {formatDate(selectedProductData.createdAt)}
            </span>
          </div>
          
          {/* GoodsInfo.md 编辑 */}
          <div style={{ 
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileMarkdownOutlined style={{ color: '#fd7a45' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>产品信息</span>
                {isEditingGoodsInfo && (
                  <Tag color="green" style={{ fontSize: '10px', padding: '0 6px', lineHeight: '18px' }}>
                    编辑中
                  </Tag>
                )}
              </div>
              <Space size="small">
                <Tooltip title="AI 优化标题">
                  <Button
                    type="text"
                    size="small"
                    icon={optimizingTitle ? <LoadingOutlined /> : <RobotOutlined />}
                    onClick={handleOptimizeTitle}
                    disabled={!goodsInfo || goodsInfoLoading || optimizingTitle}
                    style={{ color: optimizingTitle ? '#1890ff' : 'var(--text-secondary)' }}
                  >
                    AI 优化
                  </Button>
                </Tooltip>
                <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 4px' }} />
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
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    resize: 'none',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                  styles={{
                    textarea: {
                      color: 'var(--text-primary)'
                    }
                  }}
                />
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)', 
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {goodsInfo.length} 字符 · 输入后 1 秒自动保存
              </div>
            </Spin>
          </div>
        </div>
      </Card>
      )}

      {/* 文件列表/网格 */}
      {(isWorkflowCategory ? selectedFolder : selectedProduct) ? (
        <div 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
          onDragEnter={(e) => selectedFolder && handleDragEnter(e, selectedFolder)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => selectedFolder && handleDrop(e, selectedFolder)}
        >
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {isWorkflowCategory 
                    ? (selectedFolder && folderNames[selectedFolder] || selectedFolder)
                    : (selectedProduct?.split('/').pop() || '文件列表')
                  }
                </span>
                {selectedFolder && dragOverFolder === selectedFolder && (
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
                  : 'var(--card-bg)',
                overflow: 'auto',
                height: '100%',
                border: dragOverFolder === selectedFolder 
                  ? '2px dashed #fd7a45' 
                  : 'none',
                transition: 'all 0.3s'
              } 
            }}
            extra={
              <Space size="small">
                <Tooltip title="批量规范化文件命名">
                  <Button
                    type="text"
                    size="small"
                    icon={normalizing ? <LoadingOutlined /> : <FormatPainterOutlined />}
                    onClick={handleNormalizeFileNames}
                    disabled={files.length === 0 || normalizing || !isWorkflowCategory}
                  >
                    规范命名
                  </Button>
                </Tooltip>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {files.length} 个文件
                </span>
              </Space>
            }
            style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: dragOverFolder === selectedFolder 
                ? '2px dashed #fd7a45' 
                : '1px solid var(--border-color)'
            }}
          >
          <Spin spinning={loading || importing}>
            {files.length === 0 ? (
              <Empty
                image={<FileImageOutlined style={{ fontSize: '64px', color: dragOverFolder === selectedFolder ? '#fd7a45' : 'var(--text-secondary)' }} />}
                description={
                  <div>
                    <div>文件夹为空</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
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
                  <Dropdown
                    menu={{ items: getFileContextMenuItems(file) }}
                    trigger={['contextMenu']}
                  >
                    <List.Item
                      key={file.path}
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                      onDoubleClick={() => handlePreview(file, index)}
                    >
                      <List.Item.Meta
                        avatar={getFileIcon(file.name)}
                        title={
                          <div style={{ 
                            color: 'var(--text-primary)',
                            wordBreak: 'break-all',
                            whiteSpace: 'normal',
                            lineHeight: '1.4'
                          }}>
                            {file.name}
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                            <span>{formatFileSize(file.size)}</span>
                            {fileResolutions[file.path] && (
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {fileResolutions[file.path].width} x {fileResolutions[file.path].height}
                              </span>
                            )}
                            {file.modifyTime && (
                              <span>{formatDate(file.modifyTime)}</span>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  </Dropdown>
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
                  <Dropdown
                    key={file.path}
                    menu={{ items: getFileContextMenuItems(file) }}
                    trigger={['contextMenu']}
                  >
                    <Card
                      hoverable
                      size="small"
                      cover={
                        isImageFile(file.name) ? (
                          <div style={{
                            height: '150px',
                            background: 'var(--bg-tertiary)',
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
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getFileIcon(file.name)}
                          </div>
                        )
                      }
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        cursor: 'pointer'
                      }}
                      onDoubleClick={() => handlePreview(file, index)}
                    >
                      <Card.Meta
                        title={
                          <div style={{
                            fontSize: '12px',
                            lineHeight: '1.4',
                            wordBreak: 'break-all',
                            whiteSpace: 'normal'
                          }}>
                            {file.name}
                          </div>
                        }
                        description={
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{formatFileSize(file.size)}</span>
                              {fileResolutions[file.path] && (
                                <span>{fileResolutions[file.path].width}x{fileResolutions[file.path].height}</span>
                              )}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Dropdown>
                ))}
              </div>
            )}
          </Spin>
        </Card>
        </div>
      ) : selectedProductData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Card
            title="标准文件夹"
            styles={{ 
              body: { 
                background: 'var(--card-bg)',
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
                  background: dragOverFolder === folder.key ? 'rgba(253, 122, 69, 0.15)' : 'var(--card-bg)',
                  border: dragOverFolder === folder.key ? '2px dashed #fd7a45' : '1px solid var(--border-color)',
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
                      color: 'var(--text-secondary)',
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
      ) : (
        <Empty description="请选择一个产品" style={{ marginTop: '100px' }} />
      )}

      {/* 预览模态框 */}
      {!isFullscreen ? (
        <Modal
          open={previewVisible}
          className={previewType === 'image' ? 'image-preview-modal' : ''}
          title={
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
              {/* 文件名居中 - 使用绝对定位确保不受其他元素影响 */}
              <span style={{ 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '400px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                {previewTitle}
              </span>
              {/* 分辨率、大小、全屏按钮放右侧 */}
              <div style={{ 
                marginLeft: 'auto',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                paddingRight: '32px'
              }}>
                {previewType === 'image' && previewResolution && (
                  <Tag color="default" style={{ margin: 0, fontSize: '12px', lineHeight: '20px' }}>
                    {previewResolution.width} × {previewResolution.height}
                  </Tag>
                )}
                {previewType === 'image' && files[currentPreviewIndex] && (
                  <Tag color="default" style={{ margin: 0, fontSize: '12px', lineHeight: '20px' }}>
                    {formatFileSize(files[currentPreviewIndex].size)}
                  </Tag>
                )}
                {previewType === 'image' && (
                  <Tooltip title="全屏 (F)">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowsAltOutlined />}
                      onClick={handleFullscreen}
                      style={{ color: '#fff', height: '22px', width: '22px', padding: 0 }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
          }
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width={previewType === 'image' ? '90%' : '70%'}
          centered
          styles={{
            body: {
              height: previewType === 'image' ? '75vh' : 'auto',
              maxHeight: '80vh',
              overflow: 'hidden',
              background: previewType === 'image' ? 'var(--image-preview-bg)' : 'var(--card-bg)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          }}
        >
          {previewType === 'image' ? (
            <div 
              style={{ width: '100%', height: '100%', position: 'relative', cursor: 'none' }}
              onMouseMove={handleImageAreaMouseMove}
            >
              {/* 图片容器 */}
              <div style={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: imageScale > 1 ? 'auto' : 'hidden',
                cursor: toolbarVisible ? (imageScale > 1 ? 'move' : 'default') : 'none'
              }}>
                <img
                  src={previewContent}
                  alt={previewTitle}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setPreviewResolution({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  style={{
                    maxWidth: imageScale === 1 ? '100%' : 'none',
                    maxHeight: imageScale === 1 ? '100%' : 'none',
                    width: imageScale === 1 ? 'auto' : 'auto',
                    height: imageScale === 1 ? 'auto' : 'auto',
                    transform: `scale(${imageScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-out',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* 控制栏 - 支持两种布局 */}
              <div 
                onMouseEnter={handleToolbarMouseEnter}
                onMouseLeave={handleToolbarMouseLeave}
                style={{
                  position: 'absolute',
                  ...(toolbarPosition === 'corner' ? {
                    bottom: '16px',
                    right: '16px',
                  } : {
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }),
                  opacity: (autoHideToolbar ? toolbarVisible : true) ? 1 : 0,
                  pointerEvents: (autoHideToolbar ? toolbarVisible : true) ? 'auto' : 'none',
                  transition: 'all 0.3s ease-in-out',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: toolbarPosition === 'corner' ? '12px' : '8px 16px',
                  borderRadius: toolbarPosition === 'corner' ? '12px' : '24px',
                  display: 'flex',
                  flexDirection: toolbarPosition === 'corner' ? 'column' : 'row',
                  gap: toolbarPosition === 'corner' ? '4px' : '8px',
                  alignItems: 'center',
                  zIndex: 10
                }}>
                {/* 固定/自动隐藏按钮 */}
                <Tooltip title={autoHideToolbar ? '固定工具条' : '自动隐藏'} placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                  <Button
                    type="text"
                    icon={autoHideToolbar ? <EyeInvisibleOutlined /> : <PushpinOutlined />}
                    onClick={toggleAutoHideToolbar}
                    style={{ color: autoHideToolbar ? '#fff' : 'var(--ant-color-primary)' }}
                    size="small"
                  />
                </Tooltip>

                {/* 切换位置按钮 */}
                <Tooltip title={toolbarPosition === 'corner' ? '切换到底部' : '切换到右下角'} placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                  <Button
                    type="text"
                    icon={<DragOutlined />}
                    onClick={toggleToolbarPosition}
                    style={{ color: '#fff' }}
                    size="small"
                  />
                </Tooltip>

                <div style={toolbarPosition === 'corner' 
                  ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
                  : { width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} 
                />

                {/* 切换图片按钮 */}
                <Space size="small" direction={toolbarPosition === 'corner' ? 'vertical' : 'horizontal'}>
                  <Tooltip title="上一张 (←)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                    <Button
                      type="text"
                      icon={toolbarPosition === 'corner' ? <UpOutlined /> : <LeftOutlined />}
                      onClick={handlePrevImage}
                      disabled={
                        files.filter(f => isImageFile(f.name))
                          .findIndex(f => f.path === files[currentPreviewIndex]?.path) <= 0
                      }
                      style={{ color: '#fff' }}
                      size="small"
                    />
                  </Tooltip>
                  
                  <span style={{ 
                    color: '#fff', 
                    fontSize: '11px', 
                    padding: toolbarPosition === 'corner' ? '2px 0' : '0 8px',
                    textAlign: 'center',
                    minWidth: toolbarPosition === 'corner' ? 'auto' : '40px'
                  }}>
                    {files.filter(f => isImageFile(f.name))
                      .findIndex(f => f.path === files[currentPreviewIndex]?.path) + 1}
                    {' / '}
                    {files.filter(f => isImageFile(f.name)).length}
                  </span>
                  
                  <Tooltip title="下一张 (→)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                    <Button
                      type="text"
                      icon={toolbarPosition === 'corner' ? <DownOutlined /> : <RightOutlined />}
                      onClick={handleNextImage}
                      disabled={
                        files.filter(f => isImageFile(f.name))
                          .findIndex(f => f.path === files[currentPreviewIndex]?.path) >= 
                        files.filter(f => isImageFile(f.name)).length - 1
                      }
                      style={{ color: '#fff' }}
                      size="small"
                    />
                  </Tooltip>
                </Space>

                <div style={toolbarPosition === 'corner' 
                  ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
                  : { width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} 
                />

                {/* 缩放按钮 */}
                <Space size="small" direction={toolbarPosition === 'corner' ? 'vertical' : 'horizontal'}>
                  <Tooltip title="放大" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                    <Button
                      type="text"
                      icon={<ZoomInOutlined />}
                      onClick={handleZoomIn}
                      disabled={imageScale >= 5}
                      style={{ color: '#fff' }}
                      size="small"
                    />
                  </Tooltip>
                  
                  <span style={{ 
                    color: '#fff', 
                    fontSize: '11px', 
                    minWidth: toolbarPosition === 'corner' ? 'auto' : '40px', 
                    textAlign: 'center',
                    padding: toolbarPosition === 'corner' ? '2px 0' : '0'
                  }}>
                    {Math.round(imageScale * 100)}%
                  </span>
                  
                  <Tooltip title="缩小" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                    <Button
                      type="text"
                      icon={<ZoomOutOutlined />}
                      onClick={handleZoomOut}
                      disabled={imageScale <= 0.25}
                      style={{ color: '#fff' }}
                      size="small"
                    />
                  </Tooltip>
                  
                  <Tooltip title="重置" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                    <Button
                      type="text"
                      icon={<UndoOutlined />}
                      onClick={handleZoomReset}
                      disabled={imageScale === 1}
                      style={{ color: '#fff' }}
                      size="small"
                    />
                  </Tooltip>
                </Space>

                <div style={toolbarPosition === 'corner' 
                  ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
                  : { width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} 
                />

                {/* 复制按钮 */}
                <Tooltip title="复制文件" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyFile(files[currentPreviewIndex]?.path)}
                    style={{ color: '#fff' }}
                    size="small"
                  />
                </Tooltip>

                <div style={toolbarPosition === 'corner' 
                  ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
                  : { width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} 
                />

                {/* 全屏按钮 */}
                <Tooltip title="全屏 (F)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                  <Button
                    type="text"
                    icon={<FullscreenOutlined />}
                    onClick={handleFullscreen}
                    style={{ color: '#fff' }}
                    size="small"
                  />
                </Tooltip>
              </div>
          </div>
        ) : (
          <pre style={{
            background: 'var(--bg-tertiary)',
            padding: '16px',
            borderRadius: '4px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.6',
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            {previewContent}
          </pre>
        )}
      </Modal>
      ) : null}

      {/* 全屏预览 */}
      {isFullscreen && previewType === 'image' && (
        <div
          onMouseMove={handleImageAreaMouseMove}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--image-preview-bg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: toolbarVisible ? 'default' : 'none'
          }}
        >
          {/* 图片容器 */}
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: imageScale > 1 ? 'auto' : 'hidden',
            cursor: toolbarVisible ? (imageScale > 1 ? 'move' : 'default') : 'none'
          }}>
            <img
              src={previewContent}
              alt={previewTitle}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setPreviewResolution({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              style={{
                maxWidth: imageScale === 1 ? '100%' : 'none',
                maxHeight: imageScale === 1 ? '100%' : 'none',
                transform: `scale(${imageScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* 控制栏 - 支持两种布局 */}
          <div 
            onMouseEnter={handleToolbarMouseEnter}
            onMouseLeave={handleToolbarMouseLeave}
            style={{
              position: 'fixed',
              ...(toolbarPosition === 'corner' ? {
                bottom: '32px',
                right: '32px',
              } : {
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
              }),
              opacity: (autoHideToolbar ? toolbarVisible : true) ? 1 : 0,
              pointerEvents: (autoHideToolbar ? toolbarVisible : true) ? 'auto' : 'none',
              transition: 'all 0.3s ease-in-out',
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: toolbarPosition === 'corner' ? '16px' : '12px 20px',
              borderRadius: toolbarPosition === 'corner' ? '16px' : '32px',
              display: 'flex',
              flexDirection: toolbarPosition === 'corner' ? 'column' : 'row',
              gap: toolbarPosition === 'corner' ? '6px' : '12px',
              alignItems: 'center',
              zIndex: 10000
            }}>
            {/* 固定/自动隐藏按钮 */}
            <Tooltip title={autoHideToolbar ? '固定工具条' : '自动隐藏'} placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
              <Button
                type="text"
                icon={autoHideToolbar ? <EyeInvisibleOutlined /> : <PushpinOutlined />}
                onClick={toggleAutoHideToolbar}
                style={{ color: autoHideToolbar ? '#fff' : 'var(--ant-color-primary)' }}
                size="large"
              />
            </Tooltip>

            {/* 切换位置按钮 */}
            <Tooltip title={toolbarPosition === 'corner' ? '切换到底部' : '切换到右下角'} placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
              <Button
                type="text"
                icon={<DragOutlined />}
                onClick={toggleToolbarPosition}
                style={{ color: '#fff' }}
                size="large"
              />
            </Tooltip>

            <div style={toolbarPosition === 'corner' 
              ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
              : { width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} 
            />

            {/* 切换图片按钮 */}
            <Space size="small" direction={toolbarPosition === 'corner' ? 'vertical' : 'horizontal'}>
              <Tooltip title="上一张 (←)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                <Button
                  type="text"
                  icon={toolbarPosition === 'corner' ? <UpOutlined /> : <LeftOutlined />}
                  onClick={handlePrevImage}
                  disabled={
                    files.filter(f => isImageFile(f.name))
                      .findIndex(f => f.path === files[currentPreviewIndex]?.path) <= 0
                  }
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <span style={{ 
                color: '#fff', 
                fontSize: '14px', 
                padding: toolbarPosition === 'corner' ? '4px 0' : '0 12px',
                textAlign: 'center'
              }}>
                {files.filter(f => isImageFile(f.name))
                  .findIndex(f => f.path === files[currentPreviewIndex]?.path) + 1}
                {' / '}
                {files.filter(f => isImageFile(f.name)).length}
              </span>
              
              <Tooltip title="下一张 (→)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                <Button
                  type="text"
                  icon={toolbarPosition === 'corner' ? <DownOutlined /> : <RightOutlined />}
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

            <div style={toolbarPosition === 'corner' 
              ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
              : { width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} 
            />

            {/* 缩放按钮 */}
            <Space size="small" direction={toolbarPosition === 'corner' ? 'vertical' : 'horizontal'}>
              <Tooltip title="放大" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                <Button
                  type="text"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={imageScale >= 5}
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <span style={{ 
                color: '#fff', 
                fontSize: '14px', 
                minWidth: '50px', 
                textAlign: 'center',
                padding: toolbarPosition === 'corner' ? '4px 0' : '0'
              }}>
                {Math.round(imageScale * 100)}%
              </span>
              
              <Tooltip title="缩小" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
                <Button
                  type="text"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={imageScale <= 0.25}
                  style={{ color: '#fff' }}
                  size="large"
                />
              </Tooltip>
              
              <Tooltip title="重置" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
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

            <div style={toolbarPosition === 'corner' 
              ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
              : { width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} 
            />

            {/* 复制按钮 */}
            <Tooltip title="复制文件" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopyFile(files[currentPreviewIndex]?.path)}
                style={{ color: '#fff' }}
                size="large"
              />
            </Tooltip>

            <div style={toolbarPosition === 'corner' 
              ? { width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }
              : { width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} 
            />

            {/* 退出全屏 */}
            <Tooltip title="退出全屏 (ESC)" placement={toolbarPosition === 'corner' ? 'left' : 'top'}>
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

      {/* 编辑产品弹窗 */}
      <NewProductDialog
        open={editDialogOpen}
        onCancel={() => setEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
        editProduct={editProductInfo}
      />

      {/* 规范化命名确认弹窗 */}
      <Modal
        title="批量规范化命名"
        open={normalizeConfirmOpen}
        onOk={doNormalizeFileNames}
        onCancel={() => setNormalizeConfirmOpen(false)}
        okText="开始重命名"
        cancelText="取消"
        centered
      >
        <div>
          <p>将对文件夹内所有未规范命名的文件进行重命名。</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            命名格式：{selectedProductData?.id}_日期时间_序号.扩展名
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            注意：此操作不可撤销，请确保已备份重要文件。
          </p>
        </div>
      </Modal>

      {/* 删除文件确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteConfirmOpen}
        onOk={() => {
          if (fileToDelete) {
            handleDeleteFile(fileToDelete);
          }
          setDeleteConfirmOpen(false);
          setFileToDelete(null);
        }}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setFileToDelete(null);
        }}
        okText="删除"
        okType="danger"
        cancelText="取消"
        centered
      >
        <p>确定要删除文件 "{fileToDelete?.name}" 吗？</p>
        <p style={{ color: '#ff4d4f', fontSize: '12px' }}>此操作不可撤销。</p>
      </Modal>
    </div>
  );
}
