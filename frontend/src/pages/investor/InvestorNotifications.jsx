import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Bell, Mail, MessageSquare, Search, Filter, Trash2, Check, Eye, X
} from "lucide-react";
import { useNotifications } from '../../context/NotificationContext';

export default function InvestorNotifications() {
    const {
        notifications,
        markAsRead,
        markAllRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications();

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [selectedNotification, setSelectedNotification] = useState(null);

    // Derived Stats
    const unreadCount = (notifications || []).filter(n => n?.unread).length;
    const totalCount = (notifications || []).length;
    const weekCount = (notifications || []).length;

    // Handlers
    const handleDelete = (id) => {
        deleteNotification(id);
    };

    const handleDeleteAll = () => {
        deleteAllNotifications();
    };

    const handleMarkAsRead = (id) => {
        markAsRead(id);
    };

    const handleMarkAllRead = () => {
        markAllRead();
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setTypeFilter("All Types");
        setStatusFilter("All Status");
    };

    // Filtering Logic
    const filteredNotifications = useMemo(() => {
        return (notifications || []).filter(n => {
            const matchesSearch = n?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n?.message?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = typeFilter === "All Types" ||
                (typeFilter === "Bids" && n.type === 'bid') ||
                (typeFilter === "Messages" && n.type === 'message') ||
                (typeFilter === "Alerts" && n.type === 'alert') ||
                (typeFilter === "KYC" && n.type === 'kyc') ||
                (typeFilter === "Contracts" && n.type === 'contract') ||
                (typeFilter === "Payments" && n.type === 'payment');

            const matchesStatus = statusFilter === "All Status" ||
                (statusFilter === "Unread" && n.unread) ||
                (statusFilter === "Read" && !n.unread);

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [notifications, searchQuery, typeFilter, statusFilter]);

    return (
        <div className="space-y-8 animate-fade-in text-gray-900 pb-10">

            {/* Header */}
            <div>
                <h2 className="text-gray-900">Notifications</h2>
                <p className="text-gray-500 font-medium mt-1">Manage your alerts and bidding activity</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Unread"
                    value={unreadCount}
                    sub="Requires attention"
                    icon={<Bell size={20} />}
                    iconBg="bg-red-50 text-red-500"
                />
                <StatCard
                    label="Total Notifications"
                    value={totalCount}
                    sub="All time"
                    icon={<Mail size={20} />}
                    iconBg="bg-blue-50 text-blue-500"
                />
                <StatCard
                    label="This Week"
                    value={weekCount}
                    sub="Last 7 days"
                    icon={<MessageSquare size={20} />}
                    iconBg="bg-green-50 text-green-500"
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-gray-100 flex flex-col lg:flex-row gap-4 shadow-sm items-center">
                <div className="flex-1 relative w-full">
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>

                <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        options={["All Types", "Bids", "Messages", "Alerts", "KYC", "Contracts", "Payments"]}
                    />
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={["All Status", "Unread", "Read"]}
                    />

                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                    >
                        Clear Filters
                    </button>

                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Check size={16} /> Mark All Read
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-gray-900">Notifications ({(filteredNotifications || []).length})</h3>
                    {(notifications || []).length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                        >
                            <Trash2 size={14} /> Delete All
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {(filteredNotifications || []).length > 0 ? (
                        (filteredNotifications || []).map(notification => (
                            <NotificationItem
                                key={notification.id}
                                item={notification}
                                onDelete={() => handleDelete(notification.id)}
                                onRead={() => handleMarkAsRead(notification.id)}
                                onView={() => {
                                    setSelectedNotification(notification);
                                    if (notification.unread) handleMarkAsRead(notification.id);
                                }}
                            />
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-400 font-medium">No notifications found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Detail Modal */}
            <NotificationDetailModal
                notification={selectedNotification}
                onClose={() => setSelectedNotification(null)}
                onDelete={(id) => {
                    handleDelete(id);
                    setSelectedNotification(null);
                }}
            />

        </div>
    );
}

/* --- Sub Components --- */

function StatCard({ label, value, sub, icon, iconBg }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">{label}</p>
                <h2 className="text-2xl font-bold text-indigo-950 mb-0.5">{value}</h2>
                <p className="text-xs text-gray-400 font-medium">{sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${iconBg}`}>
                {icon}
            </div>
        </div>
    )
}

function Select({ value, onChange, options }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
                {(options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Filter size={14} />
            </div>
        </div>
    )
}

function NotificationDetailModal({ notification, onClose, onDelete }) {
    if (!notification) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'bid': return <Bell size={22} className="text-blue-500" />;
            case 'message': return <MessageSquare size={22} className="text-green-500" />;
            case 'alert': return <Mail size={22} className="text-orange-500" />;
            case 'kyc':
            case 'payment':
                return <Check size={22} className="text-indigo-500" />;
            default: return <Bell size={22} className="text-gray-500" />;
        }
    }

    const getBg = (type) => {
        switch (type) {
            case 'bid': return 'bg-blue-50';
            case 'message': return 'bg-green-50';
            case 'alert': return 'bg-orange-50';
            case 'kyc':
            case 'payment':
                return 'bg-indigo-50';
            default: return 'bg-gray-50';
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] overflow-hidden relative border border-gray-100" style={{zIndex: 10000}}>
                {/* Modal Header */}
                <div className="p-5 flex justify-between items-center border-b border-gray-50">
                    <div className="flex gap-4 items-center">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${getBg(notification.type)}`}>
                            {getIcon(notification.type)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{notification.title}</h3>
                            <p className="text-xs text-gray-400 font-medium">February 14th, 2026 4:51 PM</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                    <section>
                        <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Type</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${notification.type === 'kyc' ? 'text-indigo-600' :
                            notification.type === 'bid' ? 'text-blue-600' :
                                'text-gray-600'
                            }`}>
                            {notification.type}
                        </span>
                    </section>

                    <section>
                        <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Message</h4>
                        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100/50">
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                {notification.message}
                            </p>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <section>
                            <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Status</h4>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                {notification.unread ? 'Unread' : 'Read'}
                            </span>
                        </section>

                        <section>
                            <h4 className="text-xs font-semibold text-gray-500 mb-0.5">Received</h4>
                            <p className="text-sm text-gray-900 font-medium">{notification.time}</p>
                        </section>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-[4] bg-white border border-gray-200 text-gray-900 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onDelete(notification.id)}
                        className="flex-1 flex items-center justify-center gap-2 border border-red-100 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all active:scale-[0.98] group"
                    >
                        <Trash2 size={14} className="text-red-500" />
                        Delete
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function NotificationItem({ item, onDelete, onRead, onView }) {
    const getIcon = (type) => {
        switch (type) {
            case 'bid': return <Bell size={20} className="text-blue-600" />;
            case 'message': return <MessageSquare size={20} className="text-green-600" />;
            case 'alert': return <Mail size={20} className="text-orange-600" />;
            case 'kyc': return <Check size={20} className="text-purple-600" />;
            case 'contract': return <Mail size={20} className="text-indigo-600" />;
            case 'payment': return <Check size={20} className="text-emerald-600" />;
            default: return <Bell size={20} className="text-gray-600" />;
        }
    }

    const getBg = (type) => {
        switch (type) {
            case 'bid': return 'bg-blue-50 border-blue-100';
            case 'message': return 'bg-green-50 border-green-100';
            case 'alert': return 'bg-orange-50 border-orange-100';
            case 'kyc': return 'bg-purple-50 border-purple-100';
            case 'contract': return 'bg-indigo-50 border-indigo-100';
            case 'payment': return 'bg-emerald-50 border-emerald-100';
            default: return 'bg-gray-50 border-gray-100';
        }
    }

    return (
        <div className={`bg-white p-4 rounded-2xl border ${item.unread ? 'border-indigo-100 shadow-sm' : 'border-gray-100'} hover:shadow-md transition-shadow relative group`}>
            <div className="flex gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getBg(item.type)}`}>
                    {getIcon(item.type)}
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                            {item.unread && (
                                <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">New</span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 font-bold whitespace-nowrap">{item.time}</span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium mb-3 pr-8 leading-relaxed max-w-3xl line-clamp-1 group-hover:line-clamp-none transition-all">
                        {item.message}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={onView}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <Eye size={12} /> View Details
                        </button>
                        {item.unread && (
                            <button
                                onClick={onRead}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Check size={12} /> Mark as read
                            </button>
                        )}
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors ml-auto md:ml-0"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
