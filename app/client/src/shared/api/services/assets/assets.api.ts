import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axiosInstance from '@/shared/api/axiosInstance'
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

export const assetsKeys = {
	all: ['assets'] as const,
	list: () => [...assetsKeys.all, 'list'] as const
}

const getAssets = async () => {
	const { data } = await axiosInstance.get<Asset[]>('/assets')

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
	const { data } = await axiosInstance.patch<Asset>(`/assets/${assetId}`, payload)

	return data
}

const deleteAsset = async (assetId: string) => {
	await axiosInstance.delete(`/assets/${assetId}`)
}

export const useAssetsQuery = () => {
	return useQuery({
		queryKey: assetsKeys.list(),
		queryFn: getAssets
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
