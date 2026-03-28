const riskStyles = {
    'Low Risk': 'bg-emerald-50 text-emerald-700',
    'Medium Risk': 'bg-amber-50 text-amber-700',
    'High Risk': 'bg-red-50 text-red-700',
}

export default function AdminRiskBadge({ risk }) {
    const styles = riskStyles[risk] || riskStyles['Medium Risk']

    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles}`}>
            {risk}
        </span>
    )
}
