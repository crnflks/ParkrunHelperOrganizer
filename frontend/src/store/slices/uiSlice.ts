// UI slice for managing application UI state
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export interface ModalState {
  id: string;
  type: string;
  props?: any;
  isOpen: boolean;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: NotificationState[];
  modals: ModalState[];
  loading: {
    global: boolean;
    operations: { [key: string]: boolean };
  };
  online: boolean;
  lastSyncTime: number | null;
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  modals: [],
  loading: {
    global: false,
    operations: {},
  },
  online: navigator.onLine,
  lastSyncTime: null,
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<NotificationState, 'id' | 'timestamp'>>) => {
      const notification: NotificationState = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
      
      // Limit to 5 notifications
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<{ type: string; props?: any }>) => {
      const modal: ModalState = {
        id: `modal-${Date.now()}`,
        type: action.payload.type,
        props: action.payload.props,
        isOpen: true,
      };
      state.modals.push(modal);
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },
    closeAllModals: (state) => {
      state.modals = [];
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setOperationLoading: (state, action: PayloadAction<{ operation: string; loading: boolean }>) => {
      if (action.payload.loading) {
        state.loading.operations[action.payload.operation] = true;
      } else {
        delete state.loading.operations[action.payload.operation];
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.online = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<number>) => {
      state.lastSyncTime = action.payload;
    },
    setAccessibilityPreference: (state, action: PayloadAction<Partial<UIState['accessibility']>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearAllNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalLoading,
  setOperationLoading,
  setOnlineStatus,
  setLastSyncTime,
  setAccessibilityPreference,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.loading.global;
export const selectOperationLoading = (state: { ui: UIState }) => (operation: string) => 
  state.ui.loading.operations[operation] || false;
export const selectOnlineStatus = (state: { ui: UIState }) => state.ui.online;
export const selectLastSyncTime = (state: { ui: UIState }) => state.ui.lastSyncTime;
export const selectAccessibilityPreferences = (state: { ui: UIState }) => state.ui.accessibility;

// Complex selectors
export const selectIsLoading = (state: { ui: UIState }) => 
  state.ui.loading.global || Object.keys(state.ui.loading.operations).length > 0;

export const selectActiveModal = (state: { ui: UIState }) => 
  state.ui.modals.find(modal => modal.isOpen) || null;