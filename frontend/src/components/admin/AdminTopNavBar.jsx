import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { Bell, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import {
    LayoutDashboard, Briefcase, Tag, Gavel, Users,
    ShieldCheck, FolderOpen, BarChart2, CheckSquare,
    Settings, CircleDot, LogOut
} from 'lucide-react'

const ROUTE_LABELS = {
    '/admin/dashboard': 'Dashboard',
    '/admin/case-management': 'Case Management',
    '/admin/all-deals': 'All Deals',
    '/admin/auction-control': 'Auction Control',
    '/admin/user-management': 'User Management',
    '/admin/kyc-review': 'KYC Review Queue',
    '/admin/document-library': 'Document Library',
    '/admin/reports-analytics': 'Reports & Analytics',
    '/admin/task-center': 'Task Center',
    '/admin/admin-center': 'Admin Centre',
    '/admin/notifications': 'Notifications',
    '/admin/settings': 'Settings',
}

const MOBILE_NAV = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Case Management', path: '/admin/case-management', icon: Briefcase },
    { label: 'All Deals', path: '/admin/all-deals', icon: Tag },
    { label: 'Auction Control', path: '/admin/auction-control', icon: Gavel },
    { label: 'Task Center', path: '/admin/task-center', icon: CheckSquare },
    { label: 'User Management', path: '/admin/user-management', icon: Users },
    { label: 'KYC Review', path: '/admin/kyc-review', icon: CircleDot },
    { label: 'Document Library', path: '/admin/document-library', icon: FolderOpen },
    { label: 'Reports & Analytics', path: '/admin/reports-analytics', icon: BarChart2 },
    { label: 'Admin Centre', path: '/admin/admin-center', icon: ShieldCheck },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
]

export default function AdminTopNavBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    const { notifications } = useNotifications()
    const unreadCount = notifications.filter(n => n.unread).length
    const [mobileOpen, setMobileOpen] = useState(false)

    const pageTitle = ROUTE_LABELS[location.pathname] || 'Admin'
    const userName = user?.name || user?.full_name || 'Admin'
    const initials = userName.charAt(0).toUpperCase()

    return (
        <>
            {/* Desktop topbar — sits to the right of the sidebar */}
            <header
                className="fixed top-0 right-0 h-11 bg-white border-b border-slate-100 flex items-center justify-between px-5 z-20 hidden md:flex"
                style={{ left: '220px' }}
            >
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium">Admin</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{pageTitle}</span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={() => navigate('/admin/notifications')}
                        className="relative p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                    </button>

                    <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                        <div className="text-right hidden lg:block">
                            <p className="text-[11px] font-semibold text-slate-700 leading-tight">{userName}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">Administrator</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/settings')}
                            className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white hover:opacity-90 shrink-0 transition-opacity"
                            aria-label="Profile"
                        >
                            {initials}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile topbar — full width */}
            <header className="fixed top-0 left-0 right-0 h-11 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-50 md:hidden">
                <button
                    onClick={() => setMobileOpen(o => !o)}
                    className="p-1.5 rounded-md text-slate-500 hover:bg-slate-50"
                    aria-label="Menu"
                >
                    <Menu className="w-4 h-4" />
                </button>
                <span className="text-[12px] font-bold text-slate-800">BrickBanq</span>
                <button
                    onClick={() => navigate('/admin/notifications')}
                    className="relative p-1.5 rounded-md text-slate-400 hover:bg-slate-50"
                >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                </button>
            </header>

            {/* Mobile slide-out */}
            {mobileOpen && (
                <button
                    className="fixed inset-0 bg-black/40 z-[60] md:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                />
            )}
            <div
                className={`fixed top-0 left-0 bottom-0 w-64 bg-[#0F172A] z-[70] flex flex-col transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-11 flex items-center justify-between px-4 border-b border-white/[0.06]">
                    <span className="text-[13px] font-bold text-white">BrickBanq</span>
                    <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {MOBILE_NAV.map(item => {
                        const Icon = item.icon
                        const active = location.pathname === item.path
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'}`}
                            >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>
                <div className="border-t border-white/[0.06] p-3">
                    <button
                        onClick={() => { logout(); navigate('/'); setMobileOpen(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    )
}
