import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

function getRelatedItem(type) {
  const map = {
    bid: { label: 'Auction Room', path: '/lawyer/assigned-cases' },
    message: { label: 'Messages', path: '/lawyer/assigned-cases' },
    contract: { label: 'Contracts', path: '/lawyer/contract-review' },
    kyc: { label: 'KYC Review', path: '/lawyer/dashboard' },
    payment: { label: 'Payments', path: '/lawyer/dashboard' },
    system: { label: 'Dashboard', path: '/lawyer/dashboard' },
  }
  return map[type] || { label: 'Dashboard', path: '/lawyer/dashboard' }
}

function getTypeLabel(type) {
  const map = { bid: 'Bid', message: 'Message', contract: 'Contract', kyc: 'KYC', payment: 'Payment', system: 'System' }
  return map[type] || (type && type.charAt(0).toUpperCase() + type.slice(1)) || 'Notification'
}

function formatTimeDisplay(time) {
  if (!time) return ''
  if (typeof time !== 'string') return String(time)
  if (/^\d{4}-\d{2}-\d{2}T/.test(time)) {
    try {
      const d = new Date(time)
      if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
    } catch {
      // fall through
    }
  }
  return time
}

function DetailModalIcon({ type }) {
  const base = 'w-12 h-12 rounded-lg flex items-center justify-center shrink-0'
  if (type === 'bid' || type === 'system') {
    return (
      <div className={`${base} bg-blue-50 border border-blue-200`}>
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }
  if (type === 'message') {
    return (
      <div className={`${base} bg-green-50 border border-green-200`}>
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  }
  if (type === 'contract' || type === 'payment') {
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
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const { notifications, markAsRead, markAllRead, deleteNotification, deleteAllNotifications } = useNotifications()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [selectedNotification, setSelectedNotification] = useState(null)

  const filtered = useMemo(() => {
    let list = [...notifications]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((n) => (n.title && n.title.toLowerCase().includes(q)) || (n.description && n.description.toLowerCase().includes(q)))
    }
    if (typeFilter !== 'All Types') list = list.filter((n) => n.type === typeFilter)
    if (statusFilter !== 'All Status') list = list.filter((n) => (statusFilter === 'Unread' && n.unread) || (statusFilter === 'Read' && !n.unread))
    return list
  }, [notifications, search, typeFilter, statusFilter])

  const unread = notifications.filter((n) => n.unread).length

  const handleMarkRead = (id) => markAsRead(id)
  const handleMarkAllRead = () => markAllRead()
  const handleDelete = (id) => deleteNotification(id)

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true)
  }

  const confirmDeleteAll = () => {
    deleteAllNotifications()
    setShowDeleteAllConfirm(false)
  }

  const handleClearFilters = () => {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
  }

  const handleViewDetails = (item) => {
    if (!item) return
    setSelectedNotification({ ...item })
  }

  const handleCloseDetailModal = () => setSelectedNotification(null)

  const handleMarkAsReadInModal = () => {
    if (!selectedNotification) return
    markAsRead(selectedNotification.id)
    setSelectedNotification((prev) => (prev ? { ...prev, unread: false } : null))
  }

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

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Stay updated on case activity and platform events</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Unread</p>
            <p className="text-2xl font-bold text-slate-900">{unread}</p>
            <p className="text-xs text-slate-400 mt-0.5">Requires attention</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Notifications</p>
            <p className="text-2xl font-bold text-slate-900">{notifications.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">All time</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">This Week</p>
            <p className="text-2xl font-bold text-slate-900">{notifications.filter((n) => { const d = new Date(n.time || n.created_at); return !isNaN(d) && (Date.now() - d) < 7 * 86400000 }).length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Last 7 days</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="All Types">All Types</option>
          <option value="bid">Bid</option>
          <option value="message">Message</option>
          <option value="contract">Contract</option>
          <option value="kyc">KYC</option>
          <option value="payment">Payment</option>
          <option value="system">System</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="All Status">All Status</option>
          <option value="Unread">Unread</option>
          <option value="Read">Read</option>
        </select>
        <button type="button" onClick={handleClearFilters} className="px-3 py-2 text-sm font-medium text-slate-800 hover:underline">
          Clear Filters
        </button>
        <button type="button" onClick={handleMarkAllRead} className="px-3 py-2 rounded-lg bg-gray-100 text-slate-800 text-sm font-medium hover:bg-gray-200 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Mark All Read
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Notifications ({notifications.length})</h2>
        <button type="button" onClick={handleDeleteAll} className="px-3 py-2 rounded-lg bg-gray-100 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete All
        </button>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
            No notifications.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleViewDetails(item)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(item) } }}
              className={`rounded-xl border p-4 cursor-pointer ${item.unread ? 'bg-blue-50/50 border-blue-600/20' : 'bg-white border-gray-200'} shadow-sm`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === 'bid' ? 'bg-blue-100' : item.type === 'message' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {item.type === 'bid' ? (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      {item.unread && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">New</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleViewDetails(item)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Details
                      </button>
                      {item.unread && (
                        <button type="button" onClick={() => handleMarkRead(item.id)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Mark as read
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(item.id)} className="text-sm font-medium text-red-600 hover:underline flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {item.time && <span className="text-xs text-gray-500 flex-shrink-0">{item.time}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification detail modal — matches design: header (icon, title, date, Marked/Mark as read, X), body (Type, Message, Status, Received, Related Item), footer (Close, Go to Related Item, Delete) */}
      {selectedNotification && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lawyer-notification-detail-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseDetailModal() }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header: icon, title, date — Marked / Mark as read, X */}
            <div className="flex items-start justify-between gap-3 p-6 pb-4 shrink-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <DetailModalIcon type={selectedNotification.type} />
                <div className="min-w-0">
                  <h2 id="lawyer-notification-detail-title" className="text-lg font-semibold text-slate-800">{selectedNotification.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{formatTimeDisplay(selectedNotification.time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedNotification.unread ? (
                  <button
                    type="button"
                    onClick={handleMarkAsReadInModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-slate-800 text-sm font-medium hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Mark as read
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Marked
                  </span>
                )}
                <button type="button" onClick={handleCloseDetailModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" aria-label="Close">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Body: Type, Message, Status, Received, Related Item */}
            <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                  {getTypeLabel(selectedNotification.type)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message</label>
                <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-slate-800">
                  {selectedNotification.description || selectedNotification.message || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200">
                  {selectedNotification.unread ? 'Unread' : 'Read'}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Received</label>
                <p className="text-sm font-medium text-slate-800">{formatTimeDisplay(selectedNotification.time) || '—'}</p>
              </div>

              {/* Related Item — light blue box */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Related Item</label>
                  <p className="text-sm font-semibold text-slate-800">{getRelatedItem(selectedNotification.type).label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Click &quot;Go to Related Item&quot; to view this item</p>
                </div>
                <button type="button" onClick={handleGoToRelatedItem} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded shrink-0" aria-label="View related item">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer: Close, Go to Related Item, Delete */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <button type="button" onClick={handleCloseDetailModal} className="px-4 py-2 border border-gray-300 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-gray-50">
                Close
              </button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleGoToRelatedItem} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Go to Related Item
                </button>
                <button type="button" onClick={handleDeleteFromModal} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete All confirmation modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete All Notifications</h3>
                <p className="text-sm text-gray-500">This will permanently delete all {notifications.length} notifications. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowDeleteAllConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteAll} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
