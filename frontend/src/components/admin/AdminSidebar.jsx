import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Briefcase, Tag, Gavel, Users,
    ShieldCheck, FolderOpen, BarChart2, CheckSquare,
    Settings, Bell, LogOut, CircleDot
} from 'lucide-react'

const NAV_SECTIONS = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'Operations',
        items: [
            { label: 'Case Management', path: '/admin/case-management', icon: Briefcase },
            { label: 'All Deals', path: '/admin/all-deals', icon: Tag },
            { label: 'Auction Control', path: '/admin/auction-control', icon: Gavel },
            { label: 'Task Center', path: '/admin/task-center', icon: CheckSquare },
        ]
    },
    {
        label: 'Users',
        items: [
            { label: 'User Management', path: '/admin/user-management', icon: Users },
            { label: 'KYC Review', path: '/admin/kyc-review', icon: CircleDot },
        ]
    },
    {
        label: 'Content',
        items: [
            { label: 'Document Library', path: '/admin/document-library', icon: FolderOpen },
            { label: 'Reports & Analytics', path: '/admin/reports-analytics', icon: BarChart2 },
            { label: 'Notifications', path: '/admin/notifications', icon: Bell },
        ]
    },
    {
        label: 'System',
        items: [
            { label: 'Admin Centre', path: '/admin/admin-center', icon: ShieldCheck },
            { label: 'Settings', path: '/admin/settings', icon: Settings },
        ]
    },
]

export default function AdminSidebar() {
    const { logout, user } = useAuth()
    const navigate = useNavigate()
    const userName = user?.name || user?.full_name || 'Admin User'
    const initials = userName.charAt(0).toUpperCase()

    return (
        <aside className="fixed top-0 left-0 h-full w-[240px] bg-[#0F172A] flex flex-col z-30 select-none">
            {/* Logo */}
            <div className="h-14 flex items-center px-5 border-b border-white/[0.07] shrink-0">
                <span className="text-base font-bold tracking-tight text-white">BrickBanq</span>
                <span className="ml-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/25 text-indigo-300 uppercase tracking-widest">Admin</span>
            </div>

            {/* Nav — scrollbar hidden */}
            <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
                {NAV_SECTIONS.map(section => (
                    <div key={section.label}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 px-3 mb-1.5">{section.label}</p>
                        <div className="space-y-0.5">
                            {section.items.map(item => {
                                const Icon = item.icon
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 ${isActive
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/30'
                                                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                                            }`
                                        }
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom: User + Sign Out */}
            <div className="border-t border-white/[0.07] p-3 shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{userName}</p>
                        <p className="text-xs text-slate-500 leading-tight">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
