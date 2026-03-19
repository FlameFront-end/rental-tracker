import { useMemo, useState } from 'react'

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
import { Layout } from '@/shared/widgets'

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

const AdminPage = () => {
  const navigate = useNavigate()
  const { locale } = useI18n()
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
  const { data: users = [], error, isLoading } = useAdminUsersQuery()
  const updateAdminUser = useUpdateAdminUserMutation()
  const updateSubscription = useUpdateAdminUserSubscriptionMutation()

  useTelegramBackButton(true, () => {
    navigate(ROUTES.SETTINGS)
  })

  const metrics = useMemo(() => {
    const active = users.filter(
      (entry) => resolveUserAccessState(entry) === 'active'
    ).length
    const trial = users.filter(
      (entry) => resolveUserAccessState(entry) === 'trial'
    ).length
    const expired = users.filter(
      (entry) => resolveUserAccessState(entry) === 'expired'
    ).length
    const none = users.filter(
      (entry) => resolveUserAccessState(entry) === 'none'
    ).length

    return {
      active,
      admins: users.filter((entry) => entry.isAdmin).length,
      expired,
      none,
      totalUsers: users.length,
      trial
    }
  }, [users])

  const chartItems = useMemo(() => {
    const total = Math.max(users.length, 1)

    return [
      {
        count: metrics.active,
        key: 'active',
        label: copy.statuses.active
      },
      {
        count: metrics.trial,
        key: 'trial',
        label: copy.statuses.trial
      },
      {
        count: metrics.expired,
        key: 'expired',
        label: copy.statuses.expired
      },
      {
        count: metrics.none,
        key: 'none',
        label: copy.statuses.none
      }
    ].map((item) => ({
      ...item,
      width: `${Math.max((item.count / total) * 100, item.count > 0 ? 8 : 0)}%`
    }))
  }, [
    copy.statuses.active,
    copy.statuses.expired,
    copy.statuses.none,
    copy.statuses.trial,
    metrics.active,
    metrics.expired,
    metrics.none,
    metrics.trial,
    users.length
  ])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return users.filter((entry) => {
      const accessState = resolveUserAccessState(entry)
      const matchesStatus =
        statusFilter === 'all' || accessState === statusFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        entry.telegramId.toLowerCase().includes(normalizedSearch) ||
        entry.id.toLowerCase().includes(normalizedSearch) ||
        (entry.telegramUsername?.toLowerCase().includes(normalizedSearch) ??
          false)

      return matchesStatus && matchesSearch
    })
  }, [searchValue, statusFilter, users])

  const syncCurrentUser = (nextUser: AdminUser) => {
    if (user?.id === nextUser.id) {
      updateCurrentUser(nextUser)
    }
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

  return (
    <Layout title={copy.title} subtitle={copy.subtitle}>
      <div className={styles.page}>
        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <div>
              <span className={styles.eyebrow}>{copy.chartTitle}</span>
              <h2 className={styles.heroTitle}>{copy.usersTitle}</h2>
              <p className={styles.heroDescription}>
                {copy.usersDescription(filteredUsers.length)}
              </p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span>{copy.metrics.totalUsers}</span>
                <strong>{metrics.totalUsers}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.admins}</span>
                <strong>{metrics.admins}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.active}</span>
                <strong>{metrics.active}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>{copy.metrics.trial}</span>
                <strong>{metrics.trial}</strong>
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

          {error ? null : isLoading ? (
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
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>{copy.emptyTitle}</strong>
              <span>{copy.emptyDescription}</span>
            </div>
          ) : (
            <div className={styles.userList}>
              {filteredUsers.map((entry) => {
                const accessState = resolveUserAccessState(entry)
                const isRootAdmin = isRootAdminUser(entry)
                const hasSubscriptionAccess =
                  accessState === 'active' || accessState === 'trial'
                const isSubscriptionLoading =
                  updateSubscription.isPending &&
                  updateSubscription.variables?.userId === entry.id
                const isAdminLoading =
                  updateAdminUser.isPending &&
                  updateAdminUser.variables?.userId === entry.id

                return (
                  <article key={entry.id} className={styles.userItem}>
                    <div className={styles.userHeader}>
                      <div className={styles.userIdentity}>
                        <strong>
                          {entry.telegramUsername
                            ? `@${entry.telegramUsername}`
                            : copy.meta.noUsername}
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

                    <div className={styles.actionsGrid}>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          void handleSubscriptionAction(entry, 'grant_month')
                        }}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading &&
                        updateSubscription.variables?.action === 'grant_month'
                          ? copy.pending.grantMonth
                          : copy.actions.grantMonth}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void handleSubscriptionAction(entry, 'grant_trial')
                        }}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading &&
                        updateSubscription.variables?.action === 'grant_trial'
                          ? copy.pending.grantTrial
                          : copy.actions.grantTrial}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          void handleSubscriptionAction(entry, 'clear')
                        }}
                        disabled={
                          isSubscriptionLoading || !hasSubscriptionAccess
                        }
                      >
                        {isSubscriptionLoading &&
                        updateSubscription.variables?.action === 'clear'
                          ? copy.pending.clearSubscription
                          : copy.actions.clearSubscription}
                      </Button>
                      {isRootAdmin ? (
                        <div className={styles.staticAction}>
                          <strong>{copy.actions.ownerLocked}</strong>
                          <span>@{entry.telegramUsername}</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant={entry.isAdmin ? 'danger' : 'secondary'}
                          onClick={() => {
                            void handleAdminAction(entry, !entry.isAdmin)
                          }}
                          disabled={isAdminLoading}
                        >
                          {isAdminLoading
                            ? entry.isAdmin
                              ? copy.pending.removeAdmin
                              : copy.pending.makeAdmin
                            : entry.isAdmin
                              ? copy.actions.removeAdmin
                              : copy.actions.makeAdmin}
                        </Button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default AdminPage
