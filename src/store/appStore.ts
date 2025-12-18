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

export interface ProductType {
  id: string;
  code: string;
  name: string;
}

export interface ProductNode {
  id: string;
  name: string;
  type: string;
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

// 默认 AI 模型配置（提取为常量，便于数据迁移）
const DEFAULT_AI_MODELS: AIModel[] = [
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
  },
  {
    id: 'sora-image',
    name: 'Sora Image',
    enabled: true,
    providers: [
      { id: 'official', name: '官方', apiKey: '', selected: true },
      { id: 'grsai', name: 'Grsai', apiKey: '', selected: false }
    ]
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    enabled: true,
    providers: [
      { id: 'official', name: '官方', apiKey: '', selected: true },
      { id: 'grsai', name: 'Grsai', apiKey: '', selected: false }
    ]
  },
  {
    id: 'nano-banana-fast',
    name: 'Nano Banana Fast',
    enabled: true,
    providers: [
      { id: 'official', name: '官方', apiKey: '', selected: true },
      { id: 'grsai', name: 'Grsai', apiKey: '', selected: false }
    ]
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    enabled: true,
    providers: [
      { id: 'official', name: '官方', apiKey: '', selected: true },
      { id: 'grsai', name: 'Grsai', apiKey: '', selected: false }
    ]
  }
];

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

  // 产品类型管理
  productTypes: ProductType[];
  setProductTypes: (types: ProductType[]) => void;
  addProductType: (type: ProductType) => void;
  updateProductType: (id: string, updates: Partial<ProductType>) => void;
  removeProductType: (id: string) => void;

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
      aiModels: DEFAULT_AI_MODELS,

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

      productTypes: [
        { id: 'ST', code: 'ST', name: '贴纸' },
        { id: 'HK', code: 'HK', name: '贺卡' },
        { id: 'CD', code: 'CD', name: '卡片' },
        { id: 'WR', code: 'WR', name: '墙纸' },
        { id: 'SC', code: 'SC', name: '手账' }
      ],

      setProductTypes: (types) => set({ productTypes: types }),

      addProductType: (type) => set((state) => ({ 
        productTypes: [...state.productTypes, type] 
      })),

      updateProductType: (id, updates) => set((state) => ({
        productTypes: state.productTypes.map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      })),

      removeProductType: (id) => set((state) => ({
        productTypes: state.productTypes.filter(t => t.id !== id)
      })),

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
        aiTitlePrompt: state.aiTitlePrompt,
        productTypes: state.productTypes
      }),
      // 数据迁移：智能合并新旧数据
      // 原则：用户填写的 API Key 永远不会丢失，新模型/Provider 会自动添加
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        const current = currentState as AppState;
        
        const persistedModels = persisted.aiModels || [];
        const mergedAiModels: AIModel[] = [];
        
        // 1. 遍历所有默认模型，智能合并
        DEFAULT_AI_MODELS.forEach(defaultModel => {
          const existingModel = persistedModels.find(m => m.id === defaultModel.id);
          
          if (existingModel) {
            // 模型已存在：保留用户的 enabled 状态，合并 providers
            const mergedProviders = defaultModel.providers.map(defaultProvider => {
              const existingProvider = existingModel.providers.find(p => p.id === defaultProvider.id);
              if (existingProvider) {
                // Provider 已存在：完全保留用户的配置（API Key、selected 状态）
                return existingProvider;
              }
              // 新 Provider：使用默认值
              return defaultProvider;
            });
            
            // 保留用户可能添加的自定义 Provider
            existingModel.providers.forEach(p => {
              if (!mergedProviders.find(mp => mp.id === p.id)) {
                mergedProviders.push(p);
              }
            });
            
            mergedAiModels.push({
              ...defaultModel,
              enabled: existingModel.enabled, // 保留用户的启用状态
              providers: mergedProviders
            });
          } else {
            // 新模型：直接添加默认配置
            mergedAiModels.push(defaultModel);
          }
        });
        
        // 2. 保留用户自定义的模型（不在默认列表中的）
        persistedModels.forEach(model => {
          if (!mergedAiModels.find(m => m.id === model.id)) {
            mergedAiModels.push(model);
          }
        });
        
        return {
          ...current,
          ...persisted,
          aiModels: mergedAiModels
        };
      }
    }
  )
);

