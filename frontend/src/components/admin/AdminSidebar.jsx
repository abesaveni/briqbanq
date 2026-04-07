import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AppLogo from '../common/AppLogo'
import {
    LayoutDashboard,
    Briefcase,
    Tag,
    Zap,
    Users,
    FileText,
    CircleDot,
    FolderOpen,
    BarChart2,
    Shield,
    Bell,
    Settings,
    LogOut,
    CheckSquare
} from 'lucide-react'

const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Case Management', path: '/admin/case-management', icon: Briefcase },
    { label: 'All Deals', path: '/admin/all-deals', icon: Tag },
    { label: 'Auction Control', path: '/admin/auction-control', icon: Zap },
    { label: 'KYC Review Queue', path: '/admin/kyc-review', icon: Users },
    { label: 'Document Library', path: '/admin/document-library', icon: FolderOpen },
    { label: 'Reports & Analytics', path: '/admin/reports-analytics', icon: BarChart2 },
    { label: 'Task Center', path: '/admin/task-center', icon: CheckSquare },
    { label: 'Admin Centre', path: '/admin/admin-center', icon: Shield },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
]

const MIN_WIDTH = 200
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 240

export default function AdminSidebar({ width, onWidthChange, isMobile }) {
    const [isResizing, setIsResizing] = useState(false)

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return

            const newWidth = e.clientX
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                onWidthChange(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'ew-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, onWidthChange])

    if (isMobile) {
        return null // Handle mobile sidebar separately in layout
    }

    return (
        <>
            <aside
                className="fixed top-0 left-0 h-full bg-gray-900 flex flex-col z-20"
                style={{ width: `${width}px` }}
            >
                {/* Logo */}
                <div className="px-4 py-4 border-b border-gray-800">
                    <AppLogo />
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="leading-tight text-xs">{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Sign Out */}
                <div className="border-t border-gray-800 p-3">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="leading-tight text-xs">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Resize Handle */}
            <div
                className="fixed top-0 h-full w-1 bg-transparent hover:bg-indigo-500 cursor-ew-resize z-30 transition-colors"
                style={{ left: `${width}px` }}
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="absolute top-1/2 left-0 w-1 h-12 bg-gray-700 rounded-r transform -translate-y-1/2" />
            </div>
        </>
    )
}

AdminSidebar.defaultProps = {
    width: DEFAULT_WIDTH,
    onWidthChange: () => { },
    isMobile: false,
}
