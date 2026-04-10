import { NavLink, useNavigate } from 'react-router-dom'

/** Relative to /lawyer so NavLink resolves under parent route */
const navigation = [
  { name: 'Dashboard', path: 'dashboard', icon: '📊' },
  { name: 'My Cases', path: 'my-cases', icon: '📋' },
  { name: 'Assigned Cases', path: 'assigned-cases', icon: '📁' },
  { name: 'Live Auctions', path: 'live-auctions', icon: '🏠' },
  { name: 'My Bids', path: 'my-bids', icon: '🏷️' },
  { name: 'Contract Review', path: 'contract-review', icon: '📄' },
  { name: 'Task Center', path: 'task-center', icon: '✅' },
  { name: 'Notifications', path: 'notifications', icon: '🔔' },
  { name: 'Settings', path: 'settings', icon: '⚙️' },
]

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      <div
        className={`w-64 bg-slate-800 fixed h-full flex flex-col z-50 transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-white text-xl font-bold">Brickbanq</h1>
        <p className="text-slate-400 text-xs mt-1">Secure MIP Platform</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={`/lawyer/${item.path}`}
            end={item.path !== 'settings'}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          type="button"
          onClick={() => navigate('/signin')}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full"
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
    </>
  )
}
