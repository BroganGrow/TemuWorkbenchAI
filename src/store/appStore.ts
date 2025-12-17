import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductNode {
  id: string;
  name: string;
  type: 'ST' | 'CD';
  category: string;
  path: string;
  subFolders: {
    ref_images: string;
    ai_raw: string;
    ai_handle: string;
    final_goods: string;
  };
  createdAt: Date;
}

export interface AppState {
  // 当前选中的分类
  currentCategory: string;
  // 选中的产品
  selectedProduct: string | null;
  // 选中的子文件夹
  selectedFolder: string | null;
  // 主题
  theme: 'light' | 'dark';
  // 根目录路径
  rootPath: string;
  // 产品列表
  products: ProductNode[];
  // 侧边栏是否折叠
  sidebarCollapsed: boolean;
  // 视图模式
  viewMode: 'list' | 'grid';
  // 搜索关键词
  searchKeyword: string;

  // Actions
  setCurrentCategory: (category: string) => void;
  setSelectedProduct: (product: string | null) => void;
  setSelectedFolder: (folder: string | null) => void;
  toggleTheme: () => void;
  setRootPath: (path: string) => void;
  addProduct: (product: ProductNode) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<ProductNode>) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setSearchKeyword: (keyword: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      currentCategory: '01_In_Progress',
      selectedProduct: null,
      selectedFolder: null,
      theme: 'dark',
      rootPath: '',
      products: [],
      sidebarCollapsed: false,
      viewMode: 'list',
      searchKeyword: '',

      // Actions
      setCurrentCategory: (category) => set({ currentCategory: category, selectedProduct: null }),
      
      setSelectedProduct: (product) => set({ selectedProduct: product, selectedFolder: null }),
      
      setSelectedFolder: (folder) => set({ selectedFolder: folder }),
      
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      setRootPath: (path) => set({ rootPath: path }),
      
      addProduct: (product) => set((state) => ({ 
        products: [...state.products, product] 
      })),
      
      removeProduct: (productId) => set((state) => ({
        products: state.products.filter(p => p.id !== productId),
        selectedProduct: state.selectedProduct === productId ? null : state.selectedProduct
      })),
      
      updateProduct: (productId, updates) => set((state) => ({
        products: state.products.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        )
      })),
      
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword })
    }),
    {
      name: 'super-tools-storage',
      partialize: (state) => ({
        theme: state.theme,
        rootPath: state.rootPath,
        sidebarCollapsed: state.sidebarCollapsed,
        viewMode: state.viewMode
      })
    }
  )
);

