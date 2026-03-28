import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { name: 'Dashboard', path: 'dashboard', icon: 'dashboard', color: 'text-blue-600' },
  { name: 'Assigned Cases', path: 'assigned-cases', icon: 'cases', color: 'text-blue-400' },
  { name: 'E-Signatures', path: 'e-signatures', icon: 'sign', color: 'text-emerald-500' },
  { name: 'Contract Review', path: 'contract-review', icon: 'contract', color: 'text-[#6A0DAD]' },
  { name: 'Task Centre', path: 'task-center', icon: 'task', color: 'text-amber-400' },
  { name: 'Notifications', path: 'notifications', icon: 'bell', color: 'text-rose-400' },
  { name: 'Settings', path: 'settings', icon: 'settings', color: 'text-slate-300' },
]

const SidebarIcon = ({ icon, className = 'w-5 h-5' }) => {
  const c = className
  if (icon === 'dashboard') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 012-2h2a2 2 0 012 2v2M4 18h16" /></svg>
    )
  }
  if (icon === 'cases') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )
  }
  if (icon === 'sign') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    )
  }
  if (icon === 'contract') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )
  }
  if (icon === 'task') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )
  }
  if (icon === 'bell') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    )
  }
  if (icon === 'settings') {
    return (
      <svg className={c} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )
  }
  return null
}

const NavContent = ({ onClose, overlayMode = false }) => (
  <>
    <nav className={overlayMode ? 'flex-1 overflow-y-auto' : 'flex-1 py-3 overflow-y-auto'}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={`/lawyer/${item.path}`}
          end={item.path === 'dashboard'}
          onClick={onClose}
          className={({ isActive }) => {
            const base = 'flex items-center gap-2 text-sm font-medium transition-colors'
            if (overlayMode) {
              return `${base} py-3.5 -mx-4 px-4 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`
            }
            return `${base} px-3 py-2 mx-2 my-0.5 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
          }}
        >
          {({ isActive }) => (
            <>
              <SidebarIcon
                icon={item.icon}
                className={`w-5 h-5 flex-shrink-0 ${overlayMode ? (isActive ? 'text-white' : 'text-gray-500') : (isActive ? 'text-white' : item.color)}`}
              />
              <span className={overlayMode ? 'text-base' : 'leading-tight text-xs'}>{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
    <div className={overlayMode ? 'border-t border-gray-200 pt-6 pb-4 px-4 mt-4' : 'border-t border-gray-800 p-3'}>
      <NavLink
        to="/"
        onClick={onClose}
        className={`flex items-center gap-2 w-full transition-colors ${overlayMode ? 'text-red-600 hover:text-red-700 font-medium text-base py-2' : 'px-3 py-2 rounded text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white'}`}
      >
        {overlayMode ? (
          <svg className="w-5 h-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        )}
        <span className={overlayMode ? '' : 'leading-tight text-xs'}>Sign Out</span>
      </NavLink>
    </div>
  </>
)

export default function Sidebar({ isMobile, open, onClose, width = 240, overlayMode = false }) {
  useEffect(() => {
    if (!isMobile || !open) return
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobile, open, onClose])

  // Desktop: fixed left sidebar, always visible
  if (!isMobile) {
    return (
      <aside
        className="fixed top-0 left-0 h-full bg-gray-900 flex flex-col z-20"
        style={{ width: `${width}px` }}
      >
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-sm">Brickbanq</span>
              <span className="text-gray-400 text-[10px]">Virtual MIP</span>
              <span className="text-gray-400 text-[10px]">Platform</span>
            </div>
          </div>
        </div>
        <NavContent onClose={() => {}} overlayMode={false} />
      </aside>
    )
  }

  // Mobile overlay mode: full-width white overlay below header (Borrower Figma style)
  if (open && overlayMode) {
    return (
      <div
        className="fixed top-14 left-0 right-0 bottom-0 z-40 bg-white flex flex-col overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="px-4 py-6 flex flex-col flex-1">
          <NavContent onClose={onClose} overlayMode={true} />
        </div>
      </div>
    )
  }

  // Mobile: slide-in panel (fallback when overlayMode false)
  if (!open) return null

  return (
    <div
      className="fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-sm">Brickbanq</span>
            <span className="text-gray-400 text-[10px]">Virtual MIP Platform</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <NavContent onClose={onClose} overlayMode={false} />
    </div>
  )
}
