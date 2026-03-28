export default function InvestorStatsCard({ title, value, highlight }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-4 flex flex-col min-w-fit">
      <span className="text-xs text-gray-300 font-medium uppercase tracking-wider">{title}</span>
      <span
        className={`text-2xl font-bold mt-1 whitespace-nowrap ${highlight ? highlight : "text-white"
          }`}
      >
        {value}
      </span>
    </div>
  );
}
