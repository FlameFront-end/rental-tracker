import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
import {
  authKeys,
  type AuthUser,
  type AuthUserSubscriptionStatus
} from '@/shared/api/services/auth'

export interface AdminUser extends AuthUser {}

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

export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const
}

const getAdminUsers = async () => {
  const { data } = await axiosInstance.get<AdminUser[]>('/users')

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

export const useAdminUsersQuery = () => {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: getAdminUsers
  })
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
