import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
import type { PaginatedResponse } from '@/shared/api/paginated-response'
import {
  authKeys,
  type AuthUser,
  type AuthUserSubscriptionStatus
} from '@/shared/api/services/auth'

export interface AdminUser extends AuthUser {}
export interface AdminUsersSummary {
  active: number
  admins: number
  expired: number
  none: number
  totalUsers: number
  trial: number
}

export type AdminUsersAccessFilter = 'active' | 'trial' | 'expired' | 'none'

export interface AdminUsersFilters {
  access?: AdminUsersAccessFilter
  search?: string
}

interface PaginatedAdminUsersResponse extends PaginatedResponse<AdminUser> {
  summary: AdminUsersSummary
}

export type UpdateAdminUserSubscriptionAction =
  | 'grant_month'
  | 'grant_trial'
  | 'clear'

interface UpdateAdminUserPayload {
  isAdmin: boolean
  userId: string
}

interface UpdateAdminUserSubscriptionPayload {
  action: UpdateAdminUserSubscriptionAction
  userId: string
}

interface AdminUsersListParams extends AdminUsersFilters {
  limit: number
  page: number
}

const DEFAULT_ADMIN_USERS_PAGE_LIMIT = 12

export const usersKeys = {
  all: ['users'] as const,
  list: (
    filters: AdminUsersFilters = {},
    limit = DEFAULT_ADMIN_USERS_PAGE_LIMIT
  ) => [...usersKeys.all, 'list', { filters, limit }] as const
}

const getAdminUsers = async ({
  access,
  limit,
  page,
  search
}: AdminUsersListParams) => {
  const { data } = await axiosInstance.get<PaginatedAdminUsersResponse>(
    '/users',
    {
      params: {
        ...(access ? { access } : {}),
        ...(search ? { search } : {}),
        limit,
        page
      }
    }
  )

  return data
}

const updateAdminUser = async ({ isAdmin, userId }: UpdateAdminUserPayload) => {
  const { data } = await axiosInstance.patch<AdminUser>(
    `/users/${userId}/admin`,
    {
      isAdmin
    }
  )

  return data
}

const updateAdminUserSubscription = async ({
  action,
  userId
}: UpdateAdminUserSubscriptionPayload) => {
  const { data } = await axiosInstance.patch<AdminUser>(
    `/users/${userId}/subscription`,
    {
      action
    }
  )

  return data
}

const invalidateAdminQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: usersKeys.all
    }),
    queryClient.invalidateQueries({
      queryKey: authKeys.me()
    })
  ])
}

export const useAdminUsersQuery = (
  filters: AdminUsersFilters = {},
  limit = DEFAULT_ADMIN_USERS_PAGE_LIMIT
) => {
  const query = useInfiniteQuery({
    queryKey: usersKeys.list(filters, limit),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getAdminUsers({
        ...filters,
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
    summary: firstPage?.summary ?? {
      active: 0,
      admins: 0,
      expired: 0,
      none: 0,
      totalUsers: 0,
      trial: 0
    },
    total: firstPage?.total ?? 0
  }
}

export const useUpdateAdminUserMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminUser,
    onSuccess: async () => {
      await invalidateAdminQueries(queryClient)
    }
  })
}

export const useUpdateAdminUserSubscriptionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAdminUserSubscription,
    onSuccess: async () => {
      await invalidateAdminQueries(queryClient)
    }
  })
}

export type { AuthUserSubscriptionStatus }
