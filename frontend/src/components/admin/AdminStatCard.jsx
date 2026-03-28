export default function AdminStatCard({ label, value, growth, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex justify-between items-start">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
                {growth && (
                    <span className="text-xs text-green-600 font-medium mt-1 inline-block">{growth}</span>
                )}
            </div>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                {typeof Icon === 'string' ? (
                    <span className={`text-lg ${iconColor}`}>{Icon}</span>
                ) : Icon ? (
                    <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                ) : null}
            </div>
        </div>
    )
}
