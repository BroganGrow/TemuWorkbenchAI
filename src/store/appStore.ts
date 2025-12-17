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

// 历史记录项
export interface HistoryItem {
  productId: string | null;
  folderId: string | null;
  timestamp: number;
}

export interface AppState {
  // 当前选中的分类
  currentCategory: string;
  // 选中的产品
  selectedProduct: string | null;
  // 选中的子文件夹
  selectedFolder: string | null;
  // 主题设置
  theme: 'light' | 'dark' | 'system';
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
  // 浏览历史
  history: HistoryItem[];
  // 当前历史位置
  historyIndex: number;

  // Actions
  setCurrentCategory: (category: string) => void;
  setSelectedProduct: (product: string | null, recordHistory?: boolean) => void;
  setSelectedFolder: (folder: string | null, recordHistory?: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setRootPath: (path: string) => void;
  setProducts: (products: ProductNode[]) => void;
  addProduct: (product: ProductNode) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<ProductNode>) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setSearchKeyword: (keyword: string) => void;
  // 历史导航
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentCategory: 'Dashboard',
      selectedProduct: null,
      selectedFolder: null,
      theme: 'dark',
      rootPath: '',
      products: [],
      sidebarCollapsed: false,
      viewMode: 'list',
      searchKeyword: '',
      history: [],
      historyIndex: -1,

      // Actions
      setCurrentCategory: (category) => set({ currentCategory: category, selectedProduct: null }),
      
      setSelectedProduct: (product, recordHistory = true) => set((state) => {
        const newState: any = { 
          selectedProduct: product, 
          selectedFolder: null 
        };

        // 记录历史
        if (recordHistory) {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push({
            productId: product,
            folderId: null,
            timestamp: Date.now()
          });
          
          // 限制历史记录数量（最多50条）
          if (newHistory.length > 50) {
            newHistory.shift();
          } else {
            newState.historyIndex = state.historyIndex + 1;
          }
          
          newState.history = newHistory;
        }

        return newState;
      }),
      
      setSelectedFolder: (folder, recordHistory = true) => set((state) => {
        const newState: any = { selectedFolder: folder };

        // 记录历史（仅当有选中的产品时）
        if (recordHistory && state.selectedProduct) {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push({
            productId: state.selectedProduct,
            folderId: folder,
            timestamp: Date.now()
          });
          
          // 限制历史记录数量（最多50条）
          if (newHistory.length > 50) {
            newHistory.shift();
          } else {
            newState.historyIndex = state.historyIndex + 1;
          }
          
          newState.history = newHistory;
        }

        return newState;
      }),
      
      setTheme: (theme) => set({ theme }),
      
      setRootPath: (path) => set({ rootPath: path, history: [], historyIndex: -1 }),
      
      setProducts: (products) => set({ products }),
      
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
      
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

      // 历史导航
      goBack: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const historyItem = state.history[newIndex];
          
          set({
            historyIndex: newIndex,
            selectedProduct: historyItem.productId,
            selectedFolder: historyItem.folderId
          });
        }
      },

      goForward: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const historyItem = state.history[newIndex];
          
          set({
            historyIndex: newIndex,
            selectedProduct: historyItem.productId,
            selectedFolder: historyItem.folderId
          });
        }
      },

      canGoBack: () => {
        const state = get();
        return state.historyIndex > 0;
      },

      canGoForward: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      }
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

