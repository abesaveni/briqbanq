import { NavLink, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/lawyer/dashboard', icon: 'dashboard' },
  { name: 'Assigned Cases', path: '/lawyer/assigned-cases', icon: 'cases' },
  { name: 'E-Signatures', path: '/lawyer/e-signatures', icon: 'esign' },
  { name: 'Contract Review', path: '/lawyer/contract-review', icon: 'contract' },
  { name: 'Task Center', path: '/lawyer/task-center', icon: 'task' },
  { name: 'Notifications', path: '/lawyer/notifications', icon: 'bell' },
  { name: 'More', path: '/lawyer/settings', icon: 'more' },
]

const Icon = ({ name, className = 'w-5 h-5' }) => {
  const c = className
  if (name === 'dashboard') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>)
  if (name === 'cases') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>)
  if (name === 'esign') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>)
  if (name === 'contract') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)
  if (name === 'task') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>)
  if (name === 'bell') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>)
  if (name === 'more') return (<svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>)
  return null
}

export { NAV_ITEMS, Icon }

export default function TopNav({ user = { name: 'David Williams', role: 'Investor', initials: 'DW' }, onPlatformChange, onRoleChange, onOpenMobileMenu }) {
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-slate-200 min-h-[64px] flex items-center justify-between gap-4 px-4 md:px-6 lg:px-8 flex-shrink-0">
      <div className="flex items-center gap-4 md:gap-6 lg:gap-8 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => typeof onOpenMobileMenu === 'function' && onOpenMobileMenu()}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-800">Brickbanq</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wide">MIP Platform</p>
        </div>
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => typeof onPlatformChange === 'function' && onPlatformChange()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          <span>Brickbanq Platform</span>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button
          type="button"
          onClick={() => typeof onRoleChange === 'function' && onRoleChange()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-100 text-indigo-700 text-sm font-medium hover:bg-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span>Lawyer</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <NavLink
          to="/lawyer/notifications"
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 relative"
          aria-label="Notifications"
        >
          <Icon name="bell" className="w-5 h-5" />
        </NavLink>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  )
}
