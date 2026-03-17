import type { PropsWithChildren } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { AuthSessionProvider } from '@/app/model/auth-session'
import { queryClient } from '@/shared/api/queryClient'

export const Providers = ({ children }: PropsWithChildren) => {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthSessionProvider>{children}</AuthSessionProvider>
		</QueryClientProvider>
	)
}
