import type { PropsWithChildren } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { ConfirmProvider } from '@/app/confirm/confirm.provider'
import { I18nProvider } from '@/app/i18n/i18n.provider'
import { AuthSessionProvider } from '@/app/session/auth-session.provider'
import { TelegramProvider } from '@/app/telegram/telegram.provider'
import { ThemeProvider } from '@/app/theme/theme.provider'
import { ToastProvider } from '@/app/toast/toast.provider'
import { queryClient } from '@/shared/api/queryClient'

export const Providers = ({ children }: PropsWithChildren) => {
	return (
		<ThemeProvider>
			<I18nProvider>
				<QueryClientProvider client={queryClient}>
					<AuthSessionProvider>
						<TelegramProvider>
							<ToastProvider>
								<ConfirmProvider>{children}</ConfirmProvider>
							</ToastProvider>
						</TelegramProvider>
					</AuthSessionProvider>
				</QueryClientProvider>
			</I18nProvider>
		</ThemeProvider>
	)
}
