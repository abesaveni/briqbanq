import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, DollarSign, Briefcase, ShieldAlert, ArrowUpRight, Download } from "lucide-react";

export default function InvestorPortfolioHero({ stats }) {
    const navigate = useNavigate();

    return (
        <div className="hero-investor-gradient text-white rounded-2xl p-5 sm:p-6 md:p-7 relative overflow-hidden shadow-lg border border-white/10">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
                        <Target size={24} className="text-emerald-100" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Investment Portfolio</h1>
                        <p className="text-emerald-200/50 text-[10px] font-bold uppercase tracking-wider">Enterprise Management Platform</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/investor/deals")}
                        className="bg-white text-[#064E3B] px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                    >
                        <Briefcase size={14} />
                        Browse Deals
                    </button>
                    <button
                        onClick={() => navigate("/investor/reports")}
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border border-white/20 backdrop-blur-sm active:scale-95"
                    >
                        <Download size={14} />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: "Total Invested", val: `A$${stats.totalInvested}M`, icon: DollarSign },
                    { label: "Portfolio Value", val: `A$${stats.portfolioValue}M`, icon: TrendingUp, growth: `${stats.portfolioGrowth}%` },
                    { label: "Total Returns", val: `A$${stats.totalReturns}K`, sub: `${stats.avgROI}% avg ROI`, icon: DollarSign },
                    { label: "Active Deals", val: stats.activeDealsCount, sub: `${stats.completedDealsCount} completed`, icon: Briefcase },
                    { label: "Avg LVR", val: stats.riskScore === "—" ? "—" : `${stats.riskScore}%`, sub: "Loan-to-Value Ratio", icon: ShieldAlert, color: "purple" }
                ].map((item, idx) => (
                    <div key={idx} className={`bg-emerald-900/20 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all ${idx === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
                        <p className="text-emerald-100/40 text-[10px] font-bold uppercase tracking-wider mb-2">{item.label}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white leading-none">{item.val}</h2>
                                {item.growth && (
                                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] mt-1.5">
                                        <ArrowUpRight size={12} />
                                        <span>{item.growth}</span>
                                    </div>
                                )}
                                {item.sub && <p className={`text-[10px] font-bold mt-1.5 ${item.color === 'purple' ? 'text-purple-300' : 'text-emerald-200/50'}`}>{item.sub}</p>}
                            </div>
                            {item.badge ? (
                                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                                    <span className="text-amber-400 text-[10px] font-bold">{item.badge}</span>
                                </div>
                            ) : item.icon ? (
                                <item.icon className="text-white/10 group-hover:text-white/30 transition-colors" size={18} />
                            ) : null}
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-white/[0.05] transition-colors"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
