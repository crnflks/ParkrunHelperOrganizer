// RTK Query API slice for efficient data fetching and caching
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Helper, SecureDataResponse } from '../../types/api';
import { RootState } from '../index';

// Base query with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('x-correlation-id', `web-${Date.now()}-${Math.random()}`);
    return headers;
  },
});

// Base query with auth error handling
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Token expired, trigger logout
    api.dispatch({ type: 'auth/logout' });
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Helper', 'SecureData', 'HealthCheck'],
  endpoints: (builder) => ({
    // Health check
    getHealth: builder.query<{ status: string; timestamp: string }, void>({
      query: () => '',
      providesTags: ['HealthCheck'],
    }),

    // Secure data
    getSecureData: builder.query<SecureDataResponse, void>({
      query: () => 'secure-data',
      providesTags: ['SecureData'],
    }),

    // Helpers CRUD operations
    getHelpers: builder.query<Helper[], void>({
      query: () => 'helpers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Helper' as const, id })),
              { type: 'Helper', id: 'LIST' },
            ]
          : [{ type: 'Helper', id: 'LIST' }],
    }),

    getHelper: builder.query<Helper, string>({
      query: (id) => `helpers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Helper', id }],
    }),

    createHelper: builder.mutation<Helper, Omit<Helper, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
      query: (helper) => ({
        url: 'helpers',
        method: 'POST',
        body: helper,
      }),
      invalidatesTags: [{ type: 'Helper', id: 'LIST' }],
    }),

    updateHelper: builder.mutation<Helper, { id: string; data: Partial<Helper> }>({
      query: ({ id, data }) => ({
        url: `helpers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Helper', id },
        { type: 'Helper', id: 'LIST' },
      ],
    }),

    deleteHelper: builder.mutation<void, string>({
      query: (id) => ({
        url: `helpers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Helper', id },
        { type: 'Helper', id: 'LIST' },
      ],
    }),

    // Search helpers
    searchHelpers: builder.query<Helper[], { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => `helpers/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Helper' as const, id })),
              { type: 'Helper', id: 'SEARCH' },
            ]
          : [{ type: 'Helper', id: 'SEARCH' }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetHealthQuery,
  useGetSecureDataQuery,
  useGetHelpersQuery,
  useGetHelperQuery,
  useCreateHelperMutation,
  useUpdateHelperMutation,
  useDeleteHelperMutation,
  useSearchHelpersQuery,
  useLazyGetHelperQuery,
  useLazySearchHelpersQuery,
} = apiSlice;

// Export endpoints for use in thunks
export const { endpoints } = apiSlice;