import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Shield,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'
import AppLogo from '../../components/common/AppLogo'

const navigation = [
  { name: 'Dashboard', path: '/borrower/dashboard', icon: LayoutDashboard },
  { name: 'My Cases', path: '/borrower/my-case', icon: FolderOpen },
  { name: 'Contracts', path: '/borrower/contracts', icon: FileText },
  { name: 'Identity Verification', path: '/borrower/identity-verification', icon: Shield },
  { name: 'Notifications', path: '/borrower/notifications', icon: Bell },
  { name: 'Settings', path: '/borrower/settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      <div
        className={`w-64 bg-gray-900 fixed h-full flex flex-col z-50 transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-800">
          <AppLogo />
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-tight text-xs">{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="leading-tight text-xs">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
