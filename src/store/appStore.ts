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

// 标签页项
export interface TabItem {
  id: string; // 使用 product path 作为唯一标识
  productPath: string;
  productId: string; // 产品ID（用于查找产品数据）
  productName: string;
  folderId: string | null; // 当前选中的子文件夹
}

// 拆分面板项
export interface SplitPanel {
  id: string; // 面板唯一标识
  tabs: TabItem[]; // 面板内的标签页
  activeTabId: string | null; // 面板内的活动标签页
}

// 拆分布局类型
export type SplitDirection = 'horizontal' | 'vertical';

// 拆分布局节点
export interface SplitNode {
  id: string;
  type: 'panel' | 'split';
  // 如果是 panel 类型
  panelId?: string;
  // 如果是 split 类型
  direction?: SplitDirection;
  children?: [SplitNode, SplitNode];
  sizes?: [number, number]; // 百分比，总和为 100
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
  theme: 'light' | 'dark' | 'system' | 'eye-care' | 'reading' | 'paper';
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
  
  // 标签页管理
  tabs: TabItem[];
  activeTabId: string | null;
  
  // 拆分面板管理
  splitPanels: SplitPanel[];
  splitLayout: SplitNode | null; // 拆分布局树
  activePanelId: string | null; // 当前活动的面板
  
  // 文件选择状态（用于状态栏显示）
  selectedFileCount: number;
  
  // AI 模型配置
  aiModels: AIModel[];

  // Actions
  setCurrentCategory: (category: string) => void;
  setSelectedProduct: (product: string | null, recordHistory?: boolean) => void;
  setSelectedFolder: (folder: string | null, recordHistory?: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system' | 'eye-care' | 'reading' | 'paper') => void;
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

  // 标签页管理
  openTab: (productPath: string, productId: string, productName: string, switchToTab?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabFolder: (tabId: string, folderId: string | null) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  reorderTabs: (oldIndex: number, newIndex: number) => void;
  
  // 拆分面板管理
  splitTab: (tabId: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  closeSplitPanel: (panelId: string) => void;
  setActivePanelId: (panelId: string) => void;
  openTabInPanel: (panelId: string, productPath: string, productId: string, productName: string) => void;
  closeTabInPanel: (panelId: string, tabId: string) => void;
  setActiveTabInPanel: (panelId: string, tabId: string) => void;
  updateTabFolderInPanel: (panelId: string, tabId: string, folderId: string | null) => void;
  
  // 文件选择管理
  setSelectedFileCount: (count: number) => void;
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
      tabs: [],
      activeTabId: null,
      splitPanels: [],
      splitLayout: null,
      activePanelId: null,
      selectedFileCount: 0,
      
      // 默认 AI 模型配置
      aiModels: DEFAULT_AI_MODELS,

      // Actions
      setCurrentCategory: (category) => {
        const state = get();
        // 如果有活动标签页，保持标签页内容不变；否则清空选择
        if (state.activeTabId) {
          // 有活动标签页，只切换分类，不清空选择
          set({ currentCategory: category });
        } else {
          // 没有活动标签页，切换分类并清空选择
          set({ currentCategory: category, selectedProduct: null, selectedFolder: null });
        }
      },
      
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
      },

      // 标签页管理
      openTab: (productPath, productId, productName, switchToTab = true) => {
        const state = get();
        const tabId = productPath;
        
        // 检查标签页是否已存在
        const existingTab = state.tabs.find(t => t.id === tabId);
        
        if (existingTab) {
          // 标签页已存在
          if (switchToTab) {
            // 切换到该标签页
            set({ 
              activeTabId: tabId,
              selectedProduct: existingTab.productId, // 使用产品ID，不是路径
              selectedFolder: existingTab.folderId
            });
          }
          // 如果不切换，什么都不做，保持当前活动标签页
        } else {
          // 创建新标签页
          const newTab: TabItem = {
            id: tabId,
            productPath,
            productId,
            productName,
            folderId: null
          };
          
          set({ 
            tabs: [...state.tabs, newTab],
            activeTabId: tabId,
            selectedProduct: productId, // 使用产品ID，不是路径
            selectedFolder: null
          });
        }
      },

      closeTab: (tabId) => {
        const state = get();
        const tabIndex = state.tabs.findIndex(t => t.id === tabId);
        
        if (tabIndex === -1) return;
        
        const newTabs = state.tabs.filter(t => t.id !== tabId);
        
        // 如果关闭的是当前活动标签页，需要切换到其他标签页
        if (state.activeTabId === tabId) {
          if (newTabs.length > 0) {
            // 优先切换到右侧标签页，如果没有则切换到左侧
            const newActiveTab = newTabs[tabIndex] || newTabs[tabIndex - 1];
            set({
              tabs: newTabs,
              activeTabId: newActiveTab.id,
              selectedProduct: newActiveTab.productId, // 使用产品ID，不是路径
              selectedFolder: newActiveTab.folderId
            });
          } else {
            // 没有标签页了
            set({
              tabs: [],
              activeTabId: null,
              selectedProduct: null,
              selectedFolder: null
            });
          }
        } else {
          set({ tabs: newTabs });
        }
      },

      setActiveTab: (tabId) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);
        
        if (tab) {
          set({
            activeTabId: tabId,
            selectedProduct: tab.productId, // 使用产品ID，不是路径
            selectedFolder: tab.folderId
          });
        }
      },

      updateTabFolder: (tabId, folderId) => {
        set((state) => ({
          tabs: state.tabs.map(t => 
            t.id === tabId ? { ...t, folderId } : t
          ),
          selectedFolder: state.activeTabId === tabId ? folderId : state.selectedFolder
        }));
      },

      closeAllTabs: () => {
        set({
          tabs: [],
          activeTabId: null,
          selectedProduct: null,
          selectedFolder: null
        });
      },

      closeOtherTabs: (tabId) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);
        
        if (tab) {
          set({
            tabs: [tab],
            activeTabId: tabId,
            selectedProduct: tab.productId, // 使用产品ID，不是路径
            selectedFolder: tab.folderId
          });
        }
      },

      reorderTabs: (oldIndex, newIndex) => {
        const state = get();
        const newTabs = [...state.tabs];
        const [movedTab] = newTabs.splice(oldIndex, 1);
        newTabs.splice(newIndex, 0, movedTab);
        set({ tabs: newTabs });
      },

      // 拆分标签页
      splitTab: (tabId, direction) => {
        const state = get();
        const tab = state.tabs.find(t => t.id === tabId);
        
        if (!tab) return;

        // 生成新面板ID
        const newPanelId = `panel_${Date.now()}`;
        
        // 创建新面板，包含复制的标签页
        const newPanel: SplitPanel = {
          id: newPanelId,
          tabs: [{
            ...tab,
            id: `${tab.id}_${Date.now()}` // 新的唯一ID
          }],
          activeTabId: `${tab.id}_${Date.now()}`
        };

        // 如果当前没有拆分布局，创建初始拆分
        if (!state.splitLayout) {
          // 创建主面板
          const mainPanelId = 'main_panel';
          const mainPanel: SplitPanel = {
            id: mainPanelId,
            tabs: state.tabs,
            activeTabId: state.activeTabId
          };

          // 根据方向创建拆分布局
          const isHorizontal = direction === 'left' || direction === 'right';
          const newPanelFirst = direction === 'up' || direction === 'left';

          const splitNode: SplitNode = {
            id: `split_${Date.now()}`,
            type: 'split',
            direction: isHorizontal ? 'horizontal' : 'vertical',
            sizes: [50, 50],
            children: newPanelFirst
              ? [
                  { id: newPanelId, type: 'panel', panelId: newPanelId },
                  { id: mainPanelId, type: 'panel', panelId: mainPanelId }
                ]
              : [
                  { id: mainPanelId, type: 'panel', panelId: mainPanelId },
                  { id: newPanelId, type: 'panel', panelId: newPanelId }
                ]
          };

          set({
            splitPanels: [mainPanel, newPanel],
            splitLayout: splitNode,
            activePanelId: newPanelId,
            tabs: [], // 清空主标签页，全部由面板管理
            activeTabId: null
          });
        } else {
          // TODO: 处理已有拆分布局的情况（在已有面板中再次拆分）
          // 暂时简化：只添加新面板到列表
          set({
            splitPanels: [...state.splitPanels, newPanel],
            activePanelId: newPanelId
          });
        }
      },

      // 关闭拆分面板
      closeSplitPanel: (panelId) => {
        const state = get();
        const remainingPanels = state.splitPanels.filter(p => p.id !== panelId);

        // 如果只剩一个面板，恢复到非拆分模式
        if (remainingPanels.length === 1) {
          const lastPanel = remainingPanels[0];
          set({
            splitPanels: [],
            splitLayout: null,
            activePanelId: null,
            tabs: lastPanel.tabs,
            activeTabId: lastPanel.activeTabId,
            selectedProduct: lastPanel.activeTabId 
              ? lastPanel.tabs.find(t => t.id === lastPanel.activeTabId)?.productId || null
              : null,
            selectedFolder: lastPanel.activeTabId
              ? lastPanel.tabs.find(t => t.id === lastPanel.activeTabId)?.folderId || null
              : null
          });
        } else if (remainingPanels.length === 0) {
          // 所有面板都关闭了
          set({
            splitPanels: [],
            splitLayout: null,
            activePanelId: null,
            tabs: [],
            activeTabId: null,
            selectedProduct: null,
            selectedFolder: null
          });
        } else {
          // 还有多个面板，只更新面板列表
          // TODO: 更新 splitLayout 树结构
          set({
            splitPanels: remainingPanels,
            activePanelId: state.activePanelId === panelId 
              ? remainingPanels[0].id 
              : state.activePanelId
          });
        }
      },

      // 设置活动面板
      setActivePanelId: (panelId) => {
        const state = get();
        const panel = state.splitPanels.find(p => p.id === panelId);
        
        if (panel && panel.activeTabId) {
          const activeTab = panel.tabs.find(t => t.id === panel.activeTabId);
          set({
            activePanelId: panelId,
            selectedProduct: activeTab?.productId || null,
            selectedFolder: activeTab?.folderId || null,
            selectedFileCount: 0 // 切换面板时清空选中计数
          });
        } else {
          set({ 
            activePanelId: panelId,
            selectedFileCount: 0 // 切换面板时清空选中计数
          });
        }
      },

      // 在指定面板中打开标签页
      openTabInPanel: (panelId, productPath, productId, productName) => {
        const state = get();
        const panel = state.splitPanels.find(p => p.id === panelId);
        
        if (!panel) return;

        const tabId = productPath;
        const existingTab = panel.tabs.find(t => t.id === tabId);

        if (existingTab) {
          // 标签页已存在，激活它
          set({
            splitPanels: state.splitPanels.map(p =>
              p.id === panelId ? { ...p, activeTabId: tabId } : p
            ),
            activePanelId: panelId,
            selectedProduct: productId,
            selectedFolder: existingTab.folderId
          });
        } else {
          // 创建新标签页
          const newTab: TabItem = {
            id: tabId,
            productPath,
            productId,
            productName,
            folderId: null
          };

          set({
            splitPanels: state.splitPanels.map(p =>
              p.id === panelId 
                ? { ...p, tabs: [...p.tabs, newTab], activeTabId: tabId }
                : p
            ),
            activePanelId: panelId,
            selectedProduct: productId,
            selectedFolder: null
          });
        }
      },

      // 关闭面板中的标签页
      closeTabInPanel: (panelId, tabId) => {
        const state = get();
        const panel = state.splitPanels.find(p => p.id === panelId);
        
        if (!panel) return;

        const newTabs = panel.tabs.filter(t => t.id !== tabId);

        // 如果面板中没有标签页了，关闭整个面板
        if (newTabs.length === 0) {
          get().closeSplitPanel(panelId);
          return;
        }

        // 更新面板的标签页列表
        let newActiveTabId = panel.activeTabId;
        if (panel.activeTabId === tabId) {
          // 关闭的是活动标签页，切换到其他标签页
          const tabIndex = panel.tabs.findIndex(t => t.id === tabId);
          const newActiveTab = newTabs[tabIndex] || newTabs[tabIndex - 1];
          newActiveTabId = newActiveTab.id;
        }

        set({
          splitPanels: state.splitPanels.map(p =>
            p.id === panelId 
              ? { ...p, tabs: newTabs, activeTabId: newActiveTabId }
              : p
          )
        });

        // 如果是当前活动面板，更新选中状态
        if (state.activePanelId === panelId && newActiveTabId) {
          const activeTab = newTabs.find(t => t.id === newActiveTabId);
          if (activeTab) {
            set({
              selectedProduct: activeTab.productId,
              selectedFolder: activeTab.folderId
            });
          }
        }
      },

      // 设置面板中的活动标签页
      setActiveTabInPanel: (panelId, tabId) => {
        const state = get();
        const panel = state.splitPanels.find(p => p.id === panelId);
        
        if (!panel) return;

        const tab = panel.tabs.find(t => t.id === tabId);
        
        if (tab) {
          set({
            splitPanels: state.splitPanels.map(p =>
              p.id === panelId ? { ...p, activeTabId: tabId } : p
            ),
            activePanelId: panelId,
            selectedProduct: tab.productId,
            selectedFolder: tab.folderId
          });
        }
      },

      // 更新面板中标签页的文件夹
      updateTabFolderInPanel: (panelId, tabId, folderId) => {
        const state = get();
        
        set({
          splitPanels: state.splitPanels.map(p =>
            p.id === panelId
              ? {
                  ...p,
                  tabs: p.tabs.map(t =>
                    t.id === tabId ? { ...t, folderId } : t
                  )
                }
              : p
          )
        });

        // 如果是当前活动面板和标签页，更新选中状态
        const panel = state.splitPanels.find(p => p.id === panelId);
        if (state.activePanelId === panelId && panel?.activeTabId === tabId) {
          set({ selectedFolder: folderId });
        }
      },

      // 设置选中的文件数量
      setSelectedFileCount: (count) => set({ selectedFileCount: count })
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
        productTypes: state.productTypes,
        tabs: state.tabs,
        activeTabId: state.activeTabId
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

