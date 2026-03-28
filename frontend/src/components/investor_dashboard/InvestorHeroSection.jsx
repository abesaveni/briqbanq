import InvestorStatsCard from "./InvestorStatsCard";
import InvestorLiveAuctionCard from "./InvestorLiveAuctionCard";
import { useNavigate } from "react-router-dom";


export default function InvestorHeroSection({ portfolioData, liveAuction }) {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl px-8 py-6 shadow-2xl">
      <div className="grid lg:grid-cols-2 gap-8 items-center">

        {/* LEFT SIDE */}
        <div className="flex flex-col justify-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">
            Welcome Back , <br className="hidden md:block" />
            <span className="text-indigo-400">Premium Investor</span>
          </h1>

          <div className="mt-2 text-slate-400 text-sm font-medium">
            <h4 className="text-sm">Exclusive access to high-yield mortgage resolution opportunites </h4>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 items-center">
            <InvestorStatsCard
              title="AUM"
              value={formatCurrency(portfolioData.activePortfolio)}
            />

            <InvestorStatsCard
              title="Yield"
              value={`${portfolioData.avgReturn}%`}
              highlight="text-emerald-400"
            />
            <InvestorStatsCard
              title="Success"
              value={`${portfolioData.winRate}%`}
              highlight="text-sky-400"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center">
          <InvestorLiveAuctionCard auction={liveAuction} />
        </div>
      </div>
    </div>
  );
}
