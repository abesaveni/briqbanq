import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../api/dataService'

function getNotificationList(res) {
  // notificationService uses wrap() which returns { success, data, error }
  const d = res?.data
  if (Array.isArray(d)) return d
  if (d?.data !== undefined && Array.isArray(d.data)) return d.data
  if (d?.notifications) return d.notifications
  if (d?.items) return d.items
  return []
}

function normalizeNotification(n, i) {
  if (!n) return {
    id: i,
    type: 'info',
    title: 'Loading...',
    message: '',
    time: '',
    read: false,
    isNew: false
  }
  return {
    id: n.id ?? n.notification_id ?? i,
    type: n.entity_type ?? n.type ?? 'info',
    title: n.title ?? n.subject ?? 'Notification',
    message: String(n.message ?? n.body ?? n.text ?? ''),
    time: String(n.time ?? n.created_at ?? n.date ?? ''),
    read: Boolean(n.read ?? n.is_read),
    isNew: Boolean(n.isNew ?? n.is_new ?? !(n.read ?? n.is_read))
  }
}

// Figma: circular icons by type — blue bell (bid), green chat (message), blue envelope (auction/contract), green checkmark (kyc/payment)
function NotificationIcon({ type }) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center shrink-0'
  if (type === 'bid') {
    return (
      <div className={`${base} bg-blue-50 border border-blue-200`}>
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }
  if (type === 'message') {
    return (
      <div className={`${base} bg-green-50 border border-green-200`}>
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  }
  if (type === 'contract' || type === 'auction' || type === 'case') {
    return (
      <div className={`${base} bg-blue-50 border border-blue-200`}>
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  if (type === 'kyc' || type === 'payment') {
    return (
      <div className={`${base} bg-green-50 border border-green-200`}>
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  return (
    <div className={`${base} bg-gray-100 border border-gray-200`}>
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  )
}

function ModalNotificationIcon({ type }) {
  const base = 'w-12 h-12 rounded-lg flex items-center justify-center shrink-0'
  if (type === 'message') {
    return (
      <div className={`${base} bg-green-50 border border-green-200`}>
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  }
  if (type === 'bid' || type === 'auction') {
    return (
      <div className={`${base} bg-blue-50 border border-blue-200`}>
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }
  if (type === 'contract' || type === 'payment' || type === 'case') {
    return (
      <div className={`${base} bg-blue-50 border border-blue-200`}>
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  if (type === 'kyc') {
    return (
      <div className={`${base} bg-green-50 border border-green-200`}>
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }
  return (
    <div className={`${base} bg-gray-100 border border-gray-200`}>
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  )
}

export default function Notifications() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [markAllLoading, setMarkAllLoading] = useState(false)
  const [markAllSuccess, setMarkAllSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    const load = async () => {
      try {
        const res = await notificationService.getNotifications()
        if (cancelled) return
        const list = getNotificationList(res)
        setNotifications(list.map(normalizeNotification))
      } catch (e) {
        if (!cancelled) {
          setNotifications([])
          const isNetworkError = e?.code === 'ERR_NETWORK' || e?.message === 'Network Error'
          const is422 = e?.response?.status === 422 || (e?.message || '').includes('422')
          if (!isNetworkError && !is422) setError(e?.message || 'Failed to load notifications')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const thisWeekCount = useMemo(() => notifications.length, [notifications]) // could filter by date in real app

  const filteredNotifications = useMemo(() => {
    let list = [...notifications]
    if (filter !== 'all') list = list.filter((n) => n.type === filter)
    if (statusFilter === 'unread') list = list.filter((n) => !n.read)
    else if (statusFilter === 'read') list = list.filter((n) => n.read)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.message || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [notifications, filter, statusFilter, searchQuery])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
    } catch {
      // Offline or API not ready: still update UI
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true, isNew: false } : n))
    )
  }

  const handleMarkAllRead = async () => {
    if (markAllLoading || unreadCount === 0) return
    setMarkAllLoading(true)
    setMarkAllSuccess(false)
    try {
      await notificationService.markAllAsRead()
    } catch {
      // Offline or API not ready — still update UI
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isNew: false })))
    setMarkAllLoading(false)
    setMarkAllSuccess(true)
    // If currently filtered to unread-only, reset so the user sees the now-read items
    if (statusFilter === 'unread') setStatusFilter('all')
    setTimeout(() => setMarkAllSuccess(false), 3000)
  }

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
    } catch {
      // Offline or API not ready: still remove from UI
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const handleDeleteAll = () => {
    const ids = notifications.map((n) => n.id)
    ids.forEach((id) => {
      notificationService.deleteNotification(id).catch(() => {})
    })
    setNotifications([])
  }

  const handleClearFilters = () => {
    setFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
  }

  function getRelatedItem(type) {
    const map = {
      bid: { label: 'Auction Room', path: '/borrower/my-case' },
      auction: { label: 'Auction Room', path: '/borrower/my-case' },
      contract: { label: 'Contracts', path: '/borrower/contracts' },
      payment: { label: 'Contracts', path: '/borrower/contracts' },
      kyc: { label: 'Identity Verification', path: '/borrower/identity-verification' },
      message: { label: 'Messages', path: '/borrower/my-case' },
      case: { label: 'Case Details', path: '/borrower/my-case' },
      info: { label: 'Dashboard', path: '/borrower/dashboard' },
    }
    return map[type] || { label: 'Dashboard', path: '/borrower/dashboard' }
  }

  function getTypeLabel(type) {
    const map = { bid: 'Bid', auction: 'Auction', contract: 'Contract', payment: 'Payment', kyc: 'KYC', message: 'Message', case: 'Case', info: 'Info' }
    return map[type] || (type && type.charAt(0).toUpperCase() + type.slice(1)) || 'Notification'
  }

  const handleViewDetails = (notification) => {
    if (!notification) return
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    setSelectedNotification({ ...notification, read: true, isNew: false })
  }

  const handleCloseDetailModal = () => setSelectedNotification(null)

  const handleGoToRelatedItem = () => {
    if (!selectedNotification) return
    const { path } = getRelatedItem(selectedNotification.type)
    setSelectedNotification(null)
    navigate(path)
  }

  const handleDeleteFromModal = () => {
    if (!selectedNotification) return
    handleDelete(selectedNotification.id)
    setSelectedNotification(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your mortgage resolution case</p>
        <div className="flex items-center justify-center py-20 text-gray-500">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header — Figma */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your mortgage resolution case</p>
        {error && <p className="text-sm text-amber-600 mt-1">{error}</p>}
      </div>

      {/* Summary cards — Unread, Total, This Week */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Unread</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{unreadCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Requires attention</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-red-200 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Notifications</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{notifications.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">All time</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-blue-200 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">This Week</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{thisWeekCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-green-200 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="bid">Bids</option>
            <option value="message">Messages</option>
            <option value="auction">Auctions</option>
            <option value="contract">Contracts</option>
            <option value="case">Cases</option>
            <option value="kyc">KYC</option>
            <option value="payment">Payments</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button type="button" onClick={handleClearFilters} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Clear Filters
          </button>
          <div className="ml-auto flex items-center gap-2">
            {markAllSuccess && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All marked as read
              </span>
            )}
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllLoading || unreadCount === 0}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                unreadCount === 0
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : markAllSuccess
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50 bg-white'
              }`}
            >
              {markAllLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Marking…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {unreadCount === 0 ? 'All Read' : `Mark All Read (${unreadCount})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Notifications ({filteredNotifications.length})</h3>
          <button
            type="button"
            onClick={handleDeleteAll}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete All
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No notifications match your filters.</div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleViewDetails(notification)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(notification) } }}
                className={`p-4 transition-colors cursor-pointer border-l-4 ${
                  !notification.read
                    ? 'bg-blue-50/40 border-l-blue-500 hover:bg-blue-50/60'
                    : 'bg-white border-l-transparent hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <NotificationIcon type={notification.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                        {notification.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{notification.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(notification) }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification detail modal — rendered in portal so it always shows on top */}
      {selectedNotification && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-detail-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseDetailModal() }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header: icon, title, date — then Marked / Mark as read, X */}
            <div className="flex items-start justify-between gap-3 p-6 pb-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <ModalNotificationIcon type={selectedNotification.type} />
                <div className="min-w-0">
                  <h2 id="notification-detail-title" className="text-lg font-semibold text-gray-900">{selectedNotification.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedNotification.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedNotification.read ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Marked
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { handleMarkAsRead(selectedNotification.id); setSelectedNotification((prev) => prev ? { ...prev, read: true, isNew: false } : null) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Mark as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Details: Type, Message, Status, Received — all dynamic from selectedNotification */}
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {getTypeLabel(selectedNotification.type)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message</label>
                <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
                  {selectedNotification.message}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedNotification.read ? 'Read' : 'Unread'}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Received</label>
                <p className="text-sm font-medium text-gray-900">{selectedNotification.time}</p>
              </div>

              {/* Related Item — light blue box, label as sub-heading, instruction, eye icon */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Related Item</label>
                  <p className="text-sm font-semibold text-gray-900">{getRelatedItem(selectedNotification.type).label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Click &quot;Go to Related Item&quot; to view this item</p>
                </div>
                <button
                  type="button"
                  onClick={handleGoToRelatedItem}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded shrink-0"
                  aria-label="View related item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer: Close, Go to Related Item, Delete */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToRelatedItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Go to Related Item
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFromModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
