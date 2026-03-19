import { MoreVertical } from 'lucide-react'

import { useDeferredValue, useMemo, useState } from 'react'

import { Navigate, useNavigate } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { useToast } from '@/app/toast/use-toast'
import { getAdminCopy } from '@/features/admin/admin.copy'
import {
  useAdminUsersQuery,
  useUpdateAdminUserMutation,
  useUpdateAdminUserSubscriptionMutation,
  type AdminUser,
  type UpdateAdminUserSubscriptionAction
} from '@/shared/api/services/users'
import { Button, SelectField, Skeleton, TextField } from '@/shared/kit'
import { getApiErrorMessage, getIntlLocale } from '@/shared/lib'
import { ROUTES, type AppLocale } from '@/shared/model'
import { Layout, ScreenSheet } from '@/shared/widgets'

import styles from './admin.module.scss'

type UserAccessFilter = 'all' | 'active' | 'expired' | 'none' | 'trial'
type UserAccessState = Exclude<UserAccessFilter, 'all'>

const BOOTSTRAP_ADMIN_USERNAME = 'artem_kaliganov'

const FILTER_OPTIONS: UserAccessFilter[] = [
  'all',
  'active',
  'trial',
  'expired',
  'none'
]

const formatDateLabel = (value: string | null, locale: AppLocale) => {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: 'medium'
  }).format(date)
}

const resolveUserAccessState = ({
  subscriptionEndsAt,
  subscriptionStatus
}: Pick<
  AdminUser,
  'subscriptionEndsAt' | 'subscriptionStatus'
>): UserAccessState => {
  if (subscriptionStatus === 'none') {
    return 'none'
  }

  if (!subscriptionEndsAt) {
    return 'expired'
  }

  const endsAtTimestamp = Date.parse(subscriptionEndsAt)

  if (!Number.isFinite(endsAtTimestamp) || endsAtTimestamp <= Date.now()) {
    return 'expired'
  }

  return subscriptionStatus === 'active' ? 'active' : 'trial'
}

const isRootAdminUser = (targetUser: Pick<AdminUser, 'telegramUsername'>) =>
  targetUser.telegramUsername?.toLowerCase() === BOOTSTRAP_ADMIN_USERNAME

const formatAdminUserName = (
  targetUser: Pick<AdminUser, 'telegramUsername'>,
  fallbackLabel: string
) =>
  targetUser.telegramUsername
    ? `@${targetUser.telegramUsername}`
    : fallbackLabel

const AdminPage = () => {
  const navigate = useNavigate()
  const { locale, t } = useI18n()
  const copy = useMemo(() => getAdminCopy(locale), [locale])
  const toast = useToast()
  const {
    error: triggerError,
    selectionChanged,
    success
  } = useTelegramHaptics()
  const { isAdmin, updateCurrentUser, user } = useAuthSession()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserAccessFilter>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const deferredSearchValue = useDeferredValue(searchValue)
  const adminUsersFilters = useMemo(
    () => ({
      ...(statusFilter !== 'all'
        ? {
            access: statusFilter
          }
        : {}),
      ...(deferredSearchValue.trim()
        ? {
            search: deferredSearchValue.trim()
          }
        : {})
    }),
    [deferredSearchValue, statusFilter]
  )
  const {
    data: users = [],
    error,
    fetchNextPage,
    hasMore = false,
    isFetchingMore,
    isLoading,
    summary,
    total
  } = useAdminUsersQuery(adminUsersFilters)
  const updateAdminUser = useUpdateAdminUserMutation()
  const updateSubscription = useUpdateAdminUserSubscriptionMutation()

  useTelegramBackButton(true, () => {
    navigate(ROUTES.SETTINGS)
  })

  const isListLoading = isLoading && users.length === 0

  const chartItems = useMemo(() => {
    const totalUsers = Math.max(summary.totalUsers, 1)

    return [
      {
        count: summary.active,
        key: 'active',
        label: copy.statuses.active
      },
      {
        count: summary.trial,
        key: 'trial',
        label: copy.statuses.trial
      },
      {
        count: summary.expired,
        key: 'expired',
        label: copy.statuses.expired
      },
      {
        count: summary.none,
        key: 'none',
        label: copy.statuses.none
      }
    ].map((item) => ({
      ...item,
      width: `${Math.max((item.count / totalUsers) * 100, item.count > 0 ? 8 : 0)}%`
    }))
  }, [
    copy.statuses.active,
    copy.statuses.expired,
    copy.statuses.none,
    copy.statuses.trial,
    summary.active,
    summary.expired,
    summary.none,
    summary.totalUsers,
    summary.trial
  ])

  const syncCurrentUser = (nextUser: AdminUser) => {
    if (user?.id === nextUser.id) {
      updateCurrentUser(nextUser)
    }
  }

  const closeActionSheet = () => {
    setSelectedUser(null)
  }

  const openActionSheet = (targetUser: AdminUser) => {
    selectionChanged()
    setSelectedUser(targetUser)
  }

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore) {
      return
    }

    void fetchNextPage()
  }

  const handleSubscriptionAction = async (
    targetUser: AdminUser,
    action: UpdateAdminUserSubscriptionAction
  ) => {
    selectionChanged()

    try {
      const nextUser = await updateSubscription.mutateAsync({
        action,
        userId: targetUser.id
      })

      syncCurrentUser(nextUser)
      closeActionSheet()
      success()

      if (action === 'grant_month') {
        toast.success(copy.toasts.monthGranted)
        return
      }

      if (action === 'grant_trial') {
        toast.success(copy.toasts.trialGranted)
        return
      }

      toast.success(copy.toasts.subscriptionCleared)
    } catch (updateError) {
      triggerError()
      toast.error(getApiErrorMessage(updateError, copy.errors.subscription))
    }
  }

  const handleAdminAction = async (
    targetUser: AdminUser,
    nextIsAdmin: boolean
  ) => {
    selectionChanged()

    try {
      const nextUser = await updateAdminUser.mutateAsync({
        isAdmin: nextIsAdmin,
        userId: targetUser.id
      })

      syncCurrentUser(nextUser)
      closeActionSheet()
      success()
      toast.success(
        nextIsAdmin ? copy.toasts.adminGranted : copy.toasts.adminRemoved
      )
    } catch (updateError) {
      triggerError()
      toast.error(getApiErrorMessage(updateError, copy.errors.admin))
    }
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH} replace />
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  const selectedUserAccessState = selectedUser
    ? resolveUserAccessState(selectedUser)
    : null
  const selectedUserHasSubscriptionAccess =
    selectedUserAccessState === 'active' || selectedUserAccessState === 'trial'
  const isSelectedUserRootAdmin = selectedUser
    ? isRootAdminUser(selectedUser)
    : false
  const isSelectedUserSubscriptionLoading =
    updateSubscription.isPending &&
    updateSubscription.variables?.userId === selectedUser?.id
  const isSelectedUserAdminLoading =
    updateAdminUser.isPending &&
    updateAdminUser.variables?.userId === selectedUser?.id
  const selectedUserDisplayName = selectedUser
    ? formatAdminUserName(selectedUser, copy.meta.noUsername)
    : ''

  return (
    <Layout title={copy.title} subtitle={copy.subtitle}>
      <div className={styles.page}>
        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <div>
              <span className={styles.eyebrow}>{copy.chartTitle}</span>
              <h2 className={styles.heroTitle}>{copy.usersTitle}</h2>
              <p className={styles.heroDescription}>
                {copy.usersDescription(total)}
              </p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span>{copy.metrics.totalUsers}</span>
                <strong>{summary.totalUsers}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.admins}</span>
                <strong>{summary.admins}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.active}</span>
                <strong>{summary.active}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.trial}</span>
                <strong>{summary.trial}</strong>
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            {chartItems.map((item) => (
              <div key={item.key} className={styles.chartRow}>
                <div className={styles.chartMeta}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
                <div className={styles.chartTrack}>
                  <span
                    className={`${styles.chartFill} ${styles[`chartFill${item.key}`]}`}
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.filtersCard}>
          <div className={styles.filtersGrid}>
            <TextField
              id="admin-search"
              label={copy.searchLabel}
              value={searchValue}
              placeholder={copy.searchPlaceholder}
              onChange={(event) => setSearchValue(event.target.value)}
            />

            <SelectField
              id="admin-filter"
              label={copy.filterLabel}
              value={statusFilter}
              options={FILTER_OPTIONS.map((option) => ({
                label:
                  option === 'all'
                    ? copy.filterAll
                    : option === 'active'
                      ? copy.filterActive
                      : option === 'trial'
                        ? copy.filterTrial
                        : option === 'expired'
                          ? copy.filterExpired
                          : copy.filterNone,
                value: option
              }))}
              onChange={(event) =>
                setStatusFilter(event.target.value as UserAccessFilter)
              }
            />
          </div>
        </section>

        <section className={styles.usersCard}>
          {error ? (
            <div className={styles.errorMessage}>
              {getApiErrorMessage(error, copy.errors.load)}
            </div>
          ) : null}

          {!error && isListLoading ? (
            <div className={styles.userList}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.userSkeleton}>
                  <Skeleton className={styles.userSkeletonTitle} />
                  <Skeleton className={styles.userSkeletonMeta} />
                  <Skeleton className={styles.userSkeletonMeta} />
                  <div className={styles.userSkeletonActions}>
                    <Skeleton className={styles.userSkeletonButton} />
                    <Skeleton className={styles.userSkeletonButton} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!error && !isListLoading && total === 0 ? (
            <div className={styles.emptyState}>
              <strong>{copy.emptyTitle}</strong>
              <span>{copy.emptyDescription}</span>
            </div>
          ) : null}

          {!error && !isListLoading && total > 0 ? (
            <div className={styles.userList}>
              {users.map((entry) => {
                const accessState = resolveUserAccessState(entry)
                const isRootAdmin = isRootAdminUser(entry)

                return (
                  <article key={entry.id} className={styles.userItem}>
                    <div className={styles.userHeader}>
                      <div className={styles.userHeaderMeta}>
                        <div className={styles.userIdentity}>
                          <strong>
                            {formatAdminUserName(entry, copy.meta.noUsername)}
                          </strong>
                        </div>

                        <div className={styles.userBadges}>
                          <span
                            className={`${styles.badge} ${styles[`badge${accessState}`]}`}
                          >
                            {copy.statuses[accessState]}
                          </span>
                          <span
                            className={`${styles.badge} ${
                              isRootAdmin
                                ? styles.badgeOwner
                                : entry.isAdmin
                                  ? styles.badgeAdmin
                                  : styles.badgeUser
                            }`}
                          >
                            {isRootAdmin
                              ? copy.roles.owner
                              : entry.isAdmin
                                ? copy.roles.admin
                                : copy.roles.user}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.menuButton}
                        onClick={() => openActionSheet(entry)}
                        aria-label={`${copy.menuLabel}: ${formatAdminUserName(
                          entry,
                          copy.meta.noUsername
                        )}`}
                      >
                        <MoreVertical
                          size={18}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <div className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <span>{copy.meta.telegramId}</span>
                        <strong>{entry.telegramId}</strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>{copy.meta.created}</span>
                        <strong>
                          {formatDateLabel(entry.createdAt, locale) ?? '—'}
                        </strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>{copy.meta.accessUntil}</span>
                        <strong>
                          {formatDateLabel(entry.subscriptionEndsAt, locale) ??
                            copy.meta.noSubscription}
                        </strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}

          {!error && !isListLoading && hasMore ? (
            <div className={styles.paginationActions}>
              <Button
                type="button"
                variant="secondary"
                className={styles.loadMoreButton}
                disabled={isFetchingMore}
                onClick={handleLoadMore}
              >
                {isFetchingMore ? t('common.loadingMore') : copy.loadMore}
              </Button>
            </div>
          ) : null}
        </section>

        <ScreenSheet open={Boolean(selectedUser)} onClose={closeActionSheet}>
          {selectedUser ? (
            <div className={styles.actionSheet}>
              <div className={styles.actionSheetHeader}>
                <span className={styles.eyebrow}>{copy.sheetEyebrow}</span>
                <h2 className={styles.actionSheetTitle}>
                  {selectedUserDisplayName}
                </h2>
                <div className={styles.actionSheetBadges}>
                  <span
                    className={`${styles.badge} ${styles[`badge${selectedUserAccessState!}`]}`}
                  >
                    {copy.statuses[selectedUserAccessState!]}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      isSelectedUserRootAdmin
                        ? styles.badgeOwner
                        : selectedUser.isAdmin
                          ? styles.badgeAdmin
                          : styles.badgeUser
                    }`}
                  >
                    {isSelectedUserRootAdmin
                      ? copy.roles.owner
                      : selectedUser.isAdmin
                        ? copy.roles.admin
                        : copy.roles.user}
                  </span>
                </div>
              </div>

              <div className={styles.actionSheetMeta}>
                <div className={styles.metaItem}>
                  <span>{copy.meta.telegramId}</span>
                  <strong>{selectedUser.telegramId}</strong>
                </div>
                <div className={styles.metaItem}>
                  <span>{copy.meta.accessUntil}</span>
                  <strong>
                    {formatDateLabel(selectedUser.subscriptionEndsAt, locale) ??
                      copy.meta.noSubscription}
                  </strong>
                </div>
              </div>

              <div className={styles.actionSheetActions}>
                <Button
                  type="button"
                  onClick={() => {
                    void handleSubscriptionAction(selectedUser, 'grant_month')
                  }}
                  disabled={isSelectedUserSubscriptionLoading}
                >
                  {isSelectedUserSubscriptionLoading &&
                  updateSubscription.variables?.action === 'grant_month'
                    ? copy.pending.grantMonth
                    : copy.actions.grantMonth}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void handleSubscriptionAction(selectedUser, 'grant_trial')
                  }}
                  disabled={isSelectedUserSubscriptionLoading}
                >
                  {isSelectedUserSubscriptionLoading &&
                  updateSubscription.variables?.action === 'grant_trial'
                    ? copy.pending.grantTrial
                    : copy.actions.grantTrial}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void handleSubscriptionAction(selectedUser, 'clear')
                  }}
                  disabled={
                    isSelectedUserSubscriptionLoading ||
                    !selectedUserHasSubscriptionAccess
                  }
                >
                  {isSelectedUserSubscriptionLoading &&
                  updateSubscription.variables?.action === 'clear'
                    ? copy.pending.clearSubscription
                    : copy.actions.clearSubscription}
                </Button>
                {!isSelectedUserRootAdmin ? (
                  <Button
                    type="button"
                    variant={selectedUser.isAdmin ? 'danger' : 'secondary'}
                    onClick={() => {
                      void handleAdminAction(
                        selectedUser,
                        !selectedUser.isAdmin
                      )
                    }}
                    disabled={isSelectedUserAdminLoading}
                  >
                    {isSelectedUserAdminLoading
                      ? selectedUser.isAdmin
                        ? copy.pending.removeAdmin
                        : copy.pending.makeAdmin
                      : selectedUser.isAdmin
                        ? copy.actions.removeAdmin
                        : copy.actions.makeAdmin}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </ScreenSheet>
      </div>
    </Layout>
  )
}

export default AdminPage
