import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useBorrowerProfile } from './BorrowerProfileContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

const navItems = [
  { label: 'Dashboard', path: '/borrower/dashboard', icon: 'dashboard', color: 'text-indigo-600' },
  { label: 'My Case', path: '/borrower/my-case', icon: 'briefcase', color: 'text-blue-500' },
  { label: 'Auction Room', path: '/borrower/auction', icon: 'auction', color: 'text-orange-500' },
  { label: 'Notifications', path: '/borrower/notifications', icon: 'bell', color: 'text-rose-500' },
]

const NavIcon = ({ icon, className }) => {
  const c = className || 'w-5 h-5 flex-shrink-0'
  if (icon === 'dashboard') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 012-2h2a2 2 0 012 2v2M4 18h16" /></svg>
  }
  if (icon === 'briefcase') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  }
  if (icon === 'sign') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
  }
  if (icon === 'contract') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  }
  if (icon === 'shield') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  }
  if (icon === 'task') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  }
  if (icon === 'bell') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  }
  if (icon === 'add') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
  }
  if (icon === 'auction') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  }
  if (icon === 'settings') {
    return <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  }
  return null
}

export default function TopNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { user } = useBorrowerProfile()
  const { notifications } = useNotifications()
  const unreadCount = notifications.filter((n) => n.unread).length
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleNotifications = () => {
    navigate('/borrower/notifications')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-50">
        {/* Hamburger + Logo — aligned left */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="cursor-pointer flex items-center shrink-0" onClick={() => navigate('/')}>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Brickbanq
            </span>
          </div>
        </div>

        {/* Right: Bell | User — aligned right, consistent gap */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" aria-hidden />
          <NavLink
            to="/borrower/notifications"
            className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>

          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 pl-2 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name || "User"}</p>
              <p className="text-xs font-normal text-gray-500 leading-tight">{user?.role || "Borrower"}</p>
            </div>
            <NavLink
              to="/borrower/settings"
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {user?.initials || (user?.name?.charAt(0).toUpperCase() || "U")}
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hamburger overlay */}
      {menuOpen && (
        <button
          type="button"
          onClick={closeMenu}
          className="fixed inset-0 bg-black/50 z-[60]"
          aria-label="Close menu"
        />
      )}

      {/* Hamburger slide-out menu — coloured icons */}
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <NavIcon icon={item.icon} className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
            {(() => {
              const isActive = location.pathname.startsWith('/borrower/settings')
              return (
                <NavLink
                  to="/borrower/settings"
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <NavIcon icon="settings" className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>Settings</span>
                </NavLink>
              )
            })()}
            <button
              onClick={() => {
                closeMenu()
                logout()
                navigate('/')
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mt-auto"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}
