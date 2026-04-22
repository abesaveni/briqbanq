import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail, MessageSquare, CheckCircle, Eye, Trash2, X, Gavel, FileText, Shield } from 'lucide-react'
import AdminStatCard from '../../components/admin/AdminStatCard'
import { useNotifications } from '../../context/NotificationContext'

const TYPE_ICONS = {
    bid: Bell,
    message: MessageSquare,
    auction: Gavel,
    kyc: Shield,
    contract: FileText,
    payment: Mail,
    system: Bell,
    case: FileText,
    IN_APP: Bell,
    EMAIL: Mail,
}

const TYPE_LABELS = {
    bid: 'Bid',
    message: 'Message',
    auction: 'Auction',
    kyc: 'KYC',
    contract: 'Contract',
    payment: 'Payment',
    system: 'System',
    case: 'Case',
    IN_APP: 'In-App',
    EMAIL: 'Email',
}

function timeAgo(dateStr) {
    // Return mock "time ago" – real implementation would use Date.now()
    return dateStr || 'a few moments ago'
}

function getRelatedUrl(notification) {
    const id = notification.entity_id
    // entity_type identifies what entity_id points to (case, auction, bid, kyc, contract)
    // notification.type is the delivery channel (IN_APP, EMAIL) — not useful for routing
    const entityType = (notification.entity_type || '').toLowerCase()

    switch (entityType) {
        case 'case':
            return id ? `/admin/case-details/${id}/overview` : '/admin/case-management'
        case 'auction':
            return id ? `/admin/auction-room/${id}` : '/admin/auction-control'
        case 'kyc':
            return id ? `/admin/kyc-review/${id}` : '/admin/kyc-review'
        case 'contract':
            return id ? `/admin/case-details/${id}/settlement` : '/admin/case-management'
        case 'bid':
            // bid entity_id is the bid's own ID — no direct page; go to auction control
            return '/admin/auction-control'
        default:
            // Fallback: if entity_id looks like a UUID and no entity_type, try case-details
            return id ? `/admin/case-details/${id}/overview` : '/admin/dashboard'
    }
}

export default function Notifications() {
    const navigate = useNavigate()
    const { notifications, markAsRead, markAllRead, deleteNotification: ctxDeleteNotification, deleteAllNotifications } = useNotifications()
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('All Types')
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [selectedNotification, setSelectedNotification] = useState(null)

    const unreadCount = notifications.filter(n => n.unread).length

    const getFilteredNotifications = () => {
        return notifications.filter(n => {
            const msg = n.description || n.message || ''
            const matchesSearch = (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.toLowerCase().includes(searchTerm.toLowerCase())

            // n.type may be a delivery channel ('IN_APP', 'EMAIL') from backend; real category is in entity_type
            const nType = (n.type || '').toLowerCase()
            const nEntityType = (n.entity_type || '').toLowerCase()
            const tf = typeFilter.toLowerCase()
            const matchesType = typeFilter === 'All Types' ||
                nType === tf ||
                nEntityType === tf ||
                // alias: 'auction' entity maps to 'bid' dropdown option
                (tf === 'bid' && (nEntityType === 'auction' || nType === 'auction'))

            const matchesStatus = statusFilter === 'All Status' ||
                (statusFilter === 'Unread' && n.unread) ||
                (statusFilter === 'Read' && !n.unread)
            return matchesSearch && matchesType && matchesStatus
        })
    }

    const filteredNotifications = getFilteredNotifications()

    const markAllAsRead = () => markAllRead()

    const deleteNotification = (id) => {
        ctxDeleteNotification(id)
        if (selectedNotification?.id === id) setSelectedNotification(null)
    }

    const deleteAll = () => {
        if (window.confirm('Are you sure you want to delete all notifications?')) {
            deleteAllNotifications()
            setSelectedNotification(null)
        }
    }

    const openNotification = (notification) => {
        setSelectedNotification(notification)
        if (notification.unread) markAsRead(notification.id)
    }

    const getIcon = (type) => TYPE_ICONS[type] || Bell

    return (
        <div className="space-y-6 relative">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500 mt-1">Platform administration and compliance management</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminStatCard label="Unread" value={unreadCount.toString()} icon={Bell} iconBg="bg-red-100" iconColor="text-red-600" />
                <AdminStatCard label="Total Notifications" value={notifications.length.toString()} icon={Mail} iconBg="bg-blue-100" iconColor="text-blue-600" />
                <AdminStatCard label="This Week" value={notifications.filter(n => { const d = new Date(n.time); return !isNaN(d) && (Date.now() - d.getTime()) < 7 * 86400000; }).length.toString()} icon={MessageSquare} iconBg="bg-green-100" iconColor="text-green-600" />
            </div>

            {/* Filter Bar */}
            <div className="flex gap-3 flex-wrap bg-white p-4 rounded-xl border border-gray-200">
                <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                    <option value="All Types">All Types</option>
                    <option value="bid">Bid</option>
                    <option value="message">Message</option>
                    <option value="auction">Auction</option>
                    <option value="kyc">KYC</option>
                    <option value="contract">Contract</option>
                    <option value="payment">Payment</option>
                    <option value="case">Case</option>
                    <option value="system">System</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                    <option>All Status</option>
                    <option>Unread</option>
                    <option>Read</option>
                </select>
                <button
                    onClick={() => { setSearchTerm(''); setTypeFilter('All Types'); setStatusFilter('All Status') }}
                    className="border border-gray-300 rounded px-4 py-2 text-sm hover:bg-gray-50 font-medium text-gray-700"
                >
                    Clear Filters
                </button>
                <button
                    onClick={markAllAsRead}
                    className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-4 py-2 text-sm hover:bg-indigo-100 font-medium flex items-center gap-2"
                >
                    <CheckCircle className="w-4 h-4" /> Mark All Read
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-900">Notifications ({filteredNotifications.length})</h2>
                    <button
                        onClick={deleteAll}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete All
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No notifications match your filters.</div>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const Icon = getIcon(notification.type)
                            return (
                                <div
                                    key={notification.id}
                                    className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${notification.unread ? 'bg-indigo-50/30 border-l-4 border-indigo-600' : ''}`}
                                    onClick={() => openNotification(notification)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-sm ${notification.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notification.title}</h3>
                                                    {notification.unread && (
                                                        <span className="bg-indigo-100 text-indigo-700 text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">New</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                                            </div>
                                            <p className={`text-sm ${notification.unread ? 'text-gray-800' : 'text-gray-600'} line-clamp-1`}>{notification.description || notification.message}</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    if (notification.unread) markAsRead(notification.id);
                                                    navigate(getRelatedUrl(notification));
                                                }}
                                                className="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center gap-1 font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </button>
                                            <button onClick={() => deleteNotification(notification.id)} className="text-sm border border-red-200 text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Notification Detail Modal — styled exactly like the reference image */}
            {selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}>
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                    {(() => { const Icon = getIcon(selectedNotification.type); return <Icon className="w-5 h-5 text-indigo-600" /> })()}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{selectedNotification.title}</h2>
                                    <p className="text-xs text-gray-400 font-medium">{selectedNotification.time}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNotification(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-5 space-y-4">
                            {/* Type badge */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Type</p>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                    {TYPE_LABELS[selectedNotification.type] || selectedNotification.type}
                                </span>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Message</p>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-sm text-gray-800 leading-relaxed">{selectedNotification.description || selectedNotification.message}</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${!selectedNotification.unread ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                    {!selectedNotification.unread ? 'Read' : 'Unread'}
                                </span>
                            </div>

                            {/* Received */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Received</p>
                                <p className="text-sm text-gray-700 font-medium">{selectedNotification.time || 'about 1 hour ago'}</p>
                            </div>

                            {/* Related Item */}
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Related Item</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {selectedNotification.type === 'bid' || selectedNotification.type === 'auction' ? 'Auction / Bids'
                                                : selectedNotification.type === 'kyc' ? 'KYC Review'
                                                : selectedNotification.type === 'contract' ? 'Settlement'
                                                : selectedNotification.type === 'message' ? 'Case Messages'
                                                : selectedNotification.type === 'system' ? 'Settings'
                                                : 'Case Details'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selectedNotification.entity_id
                                                ? `ID: ${String(selectedNotification.entity_id).slice(0, 8)}...`
                                                : 'Click "Go to Related Item" to view'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedNotification(null);
                                            navigate(getRelatedUrl(selectedNotification));
                                        }}
                                        className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center shadow-sm hover:bg-blue-50 transition-colors"
                                        title="Go to related item"
                                    >
                                        <Eye size={14} className="text-blue-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => deleteNotification(selectedNotification.id)}
                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                                <button
                                    onClick={() => {
                                        const url = getRelatedUrl(selectedNotification)
                                        setSelectedNotification(null)
                                        navigate(url)
                                    }}
                                    className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Go to Related Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
