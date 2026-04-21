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
        <aside className="fixed top-0 left-0 h-full w-[220px] bg-[#0F172A] flex flex-col z-30 select-none">
            {/* Logo */}
            <div className="h-11 flex items-center px-4 border-b border-white/[0.06] shrink-0">
                <span className="text-[13px] font-bold tracking-tight text-white">BrickBanq</span>
                <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase tracking-[0.1em]">Admin</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3.5">
                {NAV_SECTIONS.map(section => (
                    <div key={section.label}>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600 px-2.5 mb-1">{section.label}</p>
                        <div className="space-y-0.5">
                            {section.items.map(item => {
                                const Icon = item.icon
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-100 ${isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                                            }`
                                        }
                                    >
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        <span>{item.label}</span>
                                    </NavLink>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom: User + Sign Out */}
            <div className="border-t border-white/[0.06] p-3 shrink-0 space-y-1">
                <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">{userName}</p>
                        <p className="text-[9px] text-slate-500 leading-tight">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/') }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-slate-400 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
