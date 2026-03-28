import { NavLink } from 'react-router-dom'

const HomeIcon = () => (
  <svg className="w-4 h-4 inline-block align-middle mr-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
)

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="text-sm text-gray-500 mb-4 flex items-center flex-wrap gap-x-1">
      {items.map((item, i) => (
        <span key={item.path || item.label || i} className="inline-flex items-center">
          {i > 0 && <span className="mx-1 text-gray-400">›</span>}
          {item.path ? (
            <NavLink to={item.path} className="hover:text-gray-700 inline-flex items-center">
              {item.icon === 'home' && <HomeIcon />}
              {item.label}
            </NavLink>
          ) : (
            <span className="text-gray-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
