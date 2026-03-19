import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
import type { PaginatedResponse } from '@/shared/api/paginated-response'
import { invalidateAssetRelatedQueries } from '@/shared/api/cache-invalidation'

export interface Asset {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface AssetFormValues {
  name: string
}

export interface AssetDeleteConflictDetails {
  activeOrFutureBookings: number
  historyBookings: number
  totalBookings: number
}

export interface AssetDeleteConflictErrorResponse {
  code?: string
  details?: AssetDeleteConflictDetails
  message?: string | string[]
}

export interface DeleteAssetPayload {
  assetId: string
  removeRelatedBookings?: boolean
}

interface AssetsListParams {
  limit: number
  page: number
}

const DEFAULT_ASSETS_PAGE_LIMIT = 12

export const assetsKeys = {
  all: ['assets'] as const,
  catalog: () => [...assetsKeys.all, 'catalog'] as const,
  detail: (assetId: string) => [...assetsKeys.all, 'detail', assetId] as const,
  list: (limit = DEFAULT_ASSETS_PAGE_LIMIT) =>
    [...assetsKeys.all, 'list', { limit }] as const
}

const getAssets = async ({ limit, page }: AssetsListParams) => {
  const { data } = await axiosInstance.get<PaginatedResponse<Asset>>(
    '/assets',
    {
      params: {
        limit,
        page
      }
    }
  )

  return data
}

const getAssetsCatalog = async () => {
  const { data } = await axiosInstance.get<Asset[]>('/assets/catalog')

  return data
}

const getAsset = async (assetId: string) => {
  const { data } = await axiosInstance.get<Asset>(`/assets/${assetId}`)

  return data
}

const createAsset = async (payload: AssetFormValues) => {
  const { data } = await axiosInstance.post<Asset>('/assets', payload)

  return data
}

const updateAsset = async ({
  assetId,
  payload
}: {
  assetId: string
  payload: AssetFormValues
}) => {
  const { data } = await axiosInstance.patch<Asset>(
    `/assets/${assetId}`,
    payload
  )

  return data
}

const deleteAsset = async ({
  assetId,
  removeRelatedBookings = false
}: DeleteAssetPayload) => {
  await axiosInstance.delete(`/assets/${assetId}`, {
    ...(removeRelatedBookings
      ? {
          params: {
            removeRelatedBookings: true
          }
        }
      : {})
  })

  return {
    removedRelatedBookings: removeRelatedBookings
  }
}

export const useAssetsQuery = (limit = DEFAULT_ASSETS_PAGE_LIMIT) => {
  const query = useInfiniteQuery({
    queryKey: assetsKeys.list(limit),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getAssets({
        limit,
        page: Number(pageParam)
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined
  })
  const pages = query.data?.pages ?? []
  const items = pages.flatMap((page) => page.items)
  const firstPage = pages[0]

  return {
    ...query,
    data: items,
    hasMore: query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
    loadedCount: items.length,
    limit,
    total: firstPage?.total ?? 0,
    totalPages: firstPage?.totalPages ?? 0
  }
}

export const useAssetsCatalogQuery = () => {
  return useQuery({
    queryKey: assetsKeys.catalog(),
    queryFn: getAssetsCatalog
  })
}

export const useAssetQuery = (assetId?: string | null, enabled = true) => {
  return useQuery({
    queryKey: assetsKeys.detail(assetId ?? 'unknown'),
    queryFn: () => getAsset(assetId!),
    enabled: Boolean(assetId) && enabled
  })
}

export const useCreateAssetMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAsset,
    onSuccess: async () => {
      await invalidateAssetRelatedQueries(queryClient)
    }
  })
}

export const useUpdateAssetMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAsset,
    onSuccess: async () => {
      await invalidateAssetRelatedQueries(queryClient)
    }
  })
}

export const useDeleteAssetMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: async () => {
      await invalidateAssetRelatedQueries(queryClient)
    }
  })
}
