import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import {
    LayoutDashboard,
    Briefcase,
    Tag,
    Gavel,
    Users,
    FolderOpen,
    BarChart2,
    Shield,
    Bell,
    Settings,
    LogOut,
    CheckSquare,
    X,
    Menu,
} from 'lucide-react'

const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { label: 'Case Management', path: '/admin/case-management', icon: Briefcase, color: 'text-blue-500' },
    { label: 'All Deals', path: '/admin/all-deals', icon: Tag, color: 'text-emerald-600' },
    { label: 'Auction Control', path: '/admin/auction-control', icon: Gavel, color: 'text-violet-600' },
    { label: 'User Management', path: '/admin/user-management', icon: Users, color: 'text-sky-600' },
    { label: 'KYC Review Queue', path: '/admin/kyc-review', icon: Users, color: 'text-amber-600' },
    { label: 'Document Library', path: '/admin/document-library', icon: FolderOpen, color: 'text-orange-500' },
    { label: 'Reports & Analytics', path: '/admin/reports-analytics', icon: BarChart2, color: 'text-cyan-600' },
    { label: 'Tasks', path: '/admin/task-center', icon: CheckSquare, color: 'text-green-600' },
    { label: 'Admin Centre', path: '/admin/admin-center', icon: Shield, color: 'text-red-500' },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell, color: 'text-rose-500' },
    { label: 'Settings', path: '/admin/settings', icon: Settings, color: 'text-slate-500' },
]

export default function AdminTopNavBar() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { notifications } = useNotifications()
    const unreadCount = notifications.filter((n) => n.unread).length

    const userName = user?.name || 'Admin User'
    const userRole = 'Admin'
    const initials = userName.charAt(0).toUpperCase()

    const [menuOpen, setMenuOpen] = useState(false)
    const closeMenu = () => setMenuOpen(false)

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-50">
                {/* Hamburger + Logo */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                        aria-label="Open menu"
                        aria-expanded={menuOpen}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="cursor-pointer flex items-center shrink-0" onClick={() => navigate('/')}>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Brickbanq
                        </span>
                    </div>
                </div>

                {/* Right: Bell + User */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" aria-hidden />
                    <button
                        type="button"
                        onClick={() => navigate('/admin/notifications')}
                        className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden />}
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 pl-2 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{userName}</p>
                            <p className="text-xs font-normal text-gray-500 leading-tight">{userRole}</p>
                        </div>
                        <NavLink
                            to="/admin/settings"
                            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {initials}
                        </NavLink>
                    </div>
                </div>
            </header>

            {/* Overlay */}
            {menuOpen && (
                <button
                    type="button"
                    onClick={closeMenu}
                    className="fixed inset-0 bg-black/50 z-[60]"
                    aria-label="Close menu"
                />
            )}

            {/* Slide-out menu */}
            <div
                className={`fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white border-r border-gray-200 shadow-xl z-[70] transform transition-transform duration-200 ease-out ${
                    menuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                aria-hidden={!menuOpen}
            >
                <div className="flex flex-col h-full pt-14 pb-6">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Menu</span>
                        <button
                            type="button"
                            onClick={closeMenu}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                                            <span>{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            )
                        })}

                        <button
                            onClick={() => {
                                closeMenu()
                                logout()
                                navigate('/')
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-2 border-t border-gray-100 pt-4"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span>Sign Out</span>
                        </button>
                    </nav>
                </div>
            </div>
        </>
    )
}
