// Helpers slice for Redux state management
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Helper } from '../../types/api';
import { apiService } from '../../services/api';

export interface HelpersState {
  items: Helper[];
  loading: boolean;
  error: string | null;
  selectedHelper: Helper | null;
  filters: {
    search: string;
    sortBy: 'name' | 'parkrunId' | 'createdAt';
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

const initialState: HelpersState = {
  items: [],
  loading: false,
  error: null,
  selectedHelper: null,
  filters: {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  pagination: {
    page: 1,
    itemsPerPage: 10,
    totalItems: 0,
  },
};

// Async thunks
export const fetchHelpers = createAsyncThunk(
  'helpers/fetchHelpers',
  async (_, { rejectWithValue }) => {
    try {
      const helpers = await apiService.getHelpers();
      return helpers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch helpers');
    }
  }
);

export const createHelper = createAsyncThunk(
  'helpers/createHelper',
  async (helperData: Omit<Helper, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, { rejectWithValue }) => {
    try {
      const helper = await apiService.createHelper(helperData);
      return helper;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create helper');
    }
  }
);

export const updateHelper = createAsyncThunk(
  'helpers/updateHelper',
  async ({ id, data }: { id: string; data: Partial<Helper> }, { rejectWithValue }) => {
    try {
      const helper = await apiService.updateHelper(id, data);
      return helper;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update helper');
    }
  }
);

export const deleteHelper = createAsyncThunk(
  'helpers/deleteHelper',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteHelper(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete helper');
    }
  }
);

export const helpersSlice = createSlice({
  name: 'helpers',
  initialState,
  reducers: {
    setSelectedHelper: (state, action: PayloadAction<Helper | null>) => {
      state.selectedHelper = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to first page when searching
    },
    setSortFilter: (state, action: PayloadAction<{ sortBy: 'name' | 'parkrunId' | 'createdAt'; sortOrder: 'asc' | 'desc' }>) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.pagination.itemsPerPage = action.payload;
      state.pagination.page = 1; // Reset to first page
    },
    clearError: (state) => {
      state.error = null;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    // Fetch helpers
    builder
      .addCase(fetchHelpers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHelpers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.pagination.totalItems = action.payload.length;
        state.error = null;
      })
      .addCase(fetchHelpers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create helper
    builder
      .addCase(createHelper.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHelper.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.pagination.totalItems += 1;
        state.error = null;
      })
      .addCase(createHelper.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update helper
    builder
      .addCase(updateHelper.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHelper.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(helper => helper.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedHelper?.id === action.payload.id) {
          state.selectedHelper = action.payload;
        }
        state.error = null;
      })
      .addCase(updateHelper.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete helper
    builder
      .addCase(deleteHelper.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHelper.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(helper => helper.id !== action.payload);
        state.pagination.totalItems -= 1;
        if (state.selectedHelper?.id === action.payload) {
          state.selectedHelper = null;
        }
        state.error = null;
      })
      .addCase(deleteHelper.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedHelper,
  setSearchFilter,
  setSortFilter,
  setPage,
  setItemsPerPage,
  clearError,
  clearFilters,
} = helpersSlice.actions;

// Selectors
export const selectHelpers = (state: { helpers: HelpersState }) => state.helpers.items;
export const selectHelpersLoading = (state: { helpers: HelpersState }) => state.helpers.loading;
export const selectHelpersError = (state: { helpers: HelpersState }) => state.helpers.error;
export const selectSelectedHelper = (state: { helpers: HelpersState }) => state.helpers.selectedHelper;
export const selectHelpersFilters = (state: { helpers: HelpersState }) => state.helpers.filters;
export const selectHelpersPagination = (state: { helpers: HelpersState }) => state.helpers.pagination;

// Complex selectors
export const selectFilteredHelpers = (state: { helpers: HelpersState }) => {
  const { items, filters } = state.helpers;
  const { search, sortBy, sortOrder } = filters;

  let filtered = items;

  // Apply search filter
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    filtered = items.filter(helper =>
      helper.name.toLowerCase().includes(searchLower) ||
      helper.parkrunId.toLowerCase().includes(searchLower) ||
      helper.email?.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue: string | Date;
    let bValue: string | Date;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'parkrunId':
        aValue = a.parkrunId.toLowerCase();
        bValue = b.parkrunId.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
};

export const selectPaginatedHelpers = (state: { helpers: HelpersState }) => {
  const filtered = selectFilteredHelpers(state);
  const { page, itemsPerPage } = state.helpers.pagination;
  const startIndex = (page - 1) * itemsPerPage;
  return filtered.slice(startIndex, startIndex + itemsPerPage);
};