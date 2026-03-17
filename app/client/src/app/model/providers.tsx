import type { PropsWithChildren } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/shared/api/queryClient'

export const Providers = ({ children }: PropsWithChildren) => {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
