export default function InvestorMetricsCard({
  title,
  value,
  icon,
  bgColor,
  borderColor,
  showLive
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 border ${borderColor} ${bgColor} transition`}
    >
      {showLive && (
        <div className="absolute top-4 right-4 text-red-500 text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          LIVE
        </div>
      )}

      <div className="mb-6">{icon}</div>

      <h3 className="text-2xl md:text-3xl font-bold break-words">
        {value}
      </h3>
      <p className="text-gray-600 mt-1">{title}</p>
    </div>
  );
}
