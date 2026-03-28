const variantStyles = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-gray-500 text-white',
    low: 'bg-gray-400 text-white',
    done: 'bg-emerald-500 text-white',
    new: 'bg-indigo-600 text-white',
    pending: 'border border-gray-300 text-gray-600 bg-white',
    approved: 'bg-indigo-600 text-white',
    completed: 'bg-emerald-500 text-white',
    active: 'bg-emerald-500 text-white',
    live: 'bg-red-500 text-white',
    upcoming: 'bg-indigo-600 text-white',
    comingSoon: 'bg-indigo-600 text-white',
    sold: 'bg-gray-500 text-white',
}

export default function AdminBadge({ label, variant = 'medium' }) {
    const styles = variantStyles[variant] || variantStyles.medium

    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles}`}>
            {label}
        </span>
    )
}
