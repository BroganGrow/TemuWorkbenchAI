import { useState, useCallback } from 'react';
import type { DroppedFile } from '../types';

/**
 * 支持的图片文件扩展名
 */
const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'ico'];

/**
 * 文件拖放Hook
 * 提供拖放状态管理和文件处理功能
 */
export function useFileDrop() {
  // 是否正在拖放中
  const [isDragging, setIsDragging] = useState(false);
  // 已拖放的文件列表
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);

  /**
   * 处理拖放悬停事件
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * 处理拖放离开事件
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 检查是否真的离开了拖放区域（避免子元素触发）
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  /**
   * 检查文件是否为支持的图片格式
   */
  const isImageFile = useCallback((fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? SUPPORTED_IMAGE_EXTENSIONS.includes(extension) : false;
  }, []);

  /**
   * 处理文件放置事件
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    // 过滤出图片文件
    const imageFiles = files.filter(file => isImageFile(file.name));

    // 转换为DroppedFile格式
    const fileInfos: DroppedFile[] = imageFiles.map(file => ({
      name: file.name,
      path: (file as any).path || '', // Electron特有属性
      size: file.size,
      type: file.type
    }));

    setDroppedFiles(prev => [...prev, ...fileInfos]);
    
    return fileInfos;
  }, [isImageFile]);

  /**
   * 清空已拖放的文件列表
   */
  const clearFiles = useCallback(() => {
    setDroppedFiles([]);
  }, []);

  /**
   * 移除指定文件
   */
  const removeFile = useCallback((filePath: string) => {
    setDroppedFiles(prev => prev.filter(file => file.path !== filePath));
  }, []);

  /**
   * 格式化文件大小显示
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }, []);

  return {
    isDragging,
    droppedFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFiles,
    removeFile,
    formatFileSize,
    supportedExtensions: SUPPORTED_IMAGE_EXTENSIONS
  };
}

