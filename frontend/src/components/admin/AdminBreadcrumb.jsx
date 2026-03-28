import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function AdminBreadcrumb({ items }) {
    return (
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    {item.path ? (
                        <Link to={item.path} className="hover:text-gray-600 transition-colors font-medium">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-700 font-medium">{item.label}</span>
                    )}
                    {index < items.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    )}
                </div>
            ))}
        </nav>
    )
}
