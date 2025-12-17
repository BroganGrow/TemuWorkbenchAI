import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  selected: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  providers: AIProvider[];
  enabled: boolean;
}

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

  // 刷新计数器（用于触发强制重新加载）
  refreshKey: number;
  
  // AI 模型配置
  aiModels: AIModel[];

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
  triggerRefresh: () => void;
  // AI 模型 Actions
  setAIModels: (models: AIModel[]) => void;
  updateAIModel: (modelId: string, updates: Partial<AIModel>) => void;
  updateAIProvider: (modelId: string, providerId: string, updates: Partial<AIProvider>) => void;
  
  // AI 优化 Prompt
  aiTitlePrompt: string;
  setAITitlePrompt: (prompt: string) => void;

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
      refreshKey: 0,
      
      // 默认 AI 模型配置
      aiModels: [
        {
          id: 'deepseek',
          name: 'Deepseek',
          enabled: true,
          providers: [
            { id: 'official', name: '官方', apiKey: '', selected: true },
            { id: 'siliconflow', name: '硅基流动', apiKey: '', selected: false }
          ]
        },
        {
          id: 'openai',
          name: 'OpenAI',
          enabled: true,
          providers: [
            { id: 'official', name: '官方', apiKey: '', selected: true }
          ]
        },
        {
          id: 'claude',
          name: 'Claude',
          enabled: true,
          providers: [
            { id: 'official', name: '官方', apiKey: '', selected: true }
          ]
        }
      ],

      // Actions
      setCurrentCategory: (category) => set({ currentCategory: category, selectedProduct: null }),
      
      triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

      setAIModels: (models) => set({ aiModels: models }),

      updateAIModel: (modelId, updates) => set((state) => ({
        aiModels: state.aiModels.map(model => 
          model.id === modelId ? { ...model, ...updates } : model
        )
      })),

      updateAIProvider: (modelId, providerId, updates) => set((state) => ({
        aiModels: state.aiModels.map(model => {
          if (model.id === modelId) {
            return {
              ...model,
              providers: model.providers.map(provider => {
                if (provider.id === providerId) {
                  return { ...provider, ...updates };
                }
                // 如果是选中操作，取消其他 provider 的选中状态（如果是单选逻辑）
                // 假设同个模型下只能选中一个 provider
                if (updates.selected && provider.id !== providerId) {
                  return { ...provider, selected: false };
                }
                return provider;
              })
            };
          }
          return model;
        })
      })),

      aiTitlePrompt: `请优化以下 Temu 产品标题，使其更具吸引力，包含高搜索量的关键词，符合 SEO 标准，且通顺自然。
请直接返回优化后的标题（包含中文和英文，用括号隔开，格式如：中文标题 (English Title)），不要包含其他解释或引导语。

原标题：{title}`,
      
      setAITitlePrompt: (prompt) => set({ aiTitlePrompt: prompt }),

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
        viewMode: state.viewMode,
        aiModels: state.aiModels,
        aiTitlePrompt: state.aiTitlePrompt
      })
    }
  )
);

