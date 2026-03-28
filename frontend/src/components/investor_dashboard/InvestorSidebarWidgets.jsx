import { PieChart, TrendingUp, FileText, Settings, ArrowUpRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function InvestorSidebarWidgets({ stats, investments = [] }) {
    const navigate = useNavigate();

    const breakdown = useMemo(() => {
        const safeInvestments = Array.isArray(investments) ? investments : [];
        const totalVal = parseFloat(stats?.totalInvested) || 0;

        // Count by actual property_type from real data
        const res = safeInvestments.filter(i => {
            const t = (i.propertyType || i.property_type || '').toLowerCase();
            return t.includes('house') || t.includes('unit') || t.includes('apartment') || t.includes('residential') || t.includes('townhouse');
        }).length;
        const com = safeInvestments.filter(i => {
            const t = (i.propertyType || i.property_type || '').toLowerCase();
            return t.includes('commercial') || t.includes('office') || t.includes('retail') || t.includes('shop');
        }).length;
        const ind = safeInvestments.filter(i => {
            const t = (i.propertyType || i.property_type || '').toLowerCase();
            return t.includes('industrial') || t.includes('warehouse') || t.includes('factory');
        }).length;
        // remaining (unclassified) go to residential as fallback
        const classified = res + com + ind;
        const unclassified = Math.max(0, safeInvestments.length - classified);
        const resTotal = res + unclassified;

        const total = (resTotal + com + ind) || 1;
        const resPct = Math.round((resTotal / total) * 100);
        const comPct = Math.round((com / total) * 100);
        const indPct = 100 - resPct - comPct;

        return [
            { label: "Residential", value: resPct, color: "bg-blue-600", amount: resTotal > 0 ? `${resTotal} propert${resTotal === 1 ? 'y' : 'ies'}` : '—' },
            { label: "Commercial", value: comPct, color: "bg-emerald-500", amount: com > 0 ? `${com} propert${com === 1 ? 'y' : 'ies'}` : '—' },
            { label: "Industrial", value: indPct, color: "bg-purple-500", amount: ind > 0 ? `${ind} propert${ind === 1 ? 'y' : 'ies'}` : '—' },
        ];
    }, [investments, stats]);

    const growth = useMemo(() => {
        const now = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const safeInvestments = Array.isArray(investments) ? investments : [];

        // Bucket investments by their created_at month (last 6 months)
        const monthlyCounts = Array.from({ length: 6 }).map((_, i) => {
            const mIdx = (now.getMonth() - 5 + i + 12) % 12;
            const year = new Date(now.getFullYear(), now.getMonth() - 5 + i).getFullYear();
            const count = safeInvestments.filter(inv => {
                if (!inv.created_at) return false;
                const d = new Date(inv.created_at);
                return d.getMonth() === mIdx && d.getFullYear() === year;
            }).length;
            return { month: months[mIdx], count };
        });

        const maxCount = Math.max(...monthlyCounts.map(m => m.count), 1);
        return monthlyCounts.map(m => ({
            month: m.month,
            value: Math.round((m.count / maxCount) * 100),
            amount: m.count > 0 ? `${m.count} deal${m.count !== 1 ? 's' : ''}` : '—',
        }));
    }, [investments]);

    const actions = [
        { label: "Find New Deals", icon: "plus", onClick: () => navigate("/investor/deals") },
        { label: "View Performance Report", icon: FileText, onClick: () => navigate("/investor/reports") },
        { label: "Update Preferences", icon: Settings, onClick: () => navigate("/investor/settings") },
    ];

    return (
        <div className="space-y-4">
            {/* Portfolio Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <PieChart size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-[#0F172A] font-bold text-sm">Portfolio Breakdown</h3>
                </div>

                <div className="space-y-5">
                    {breakdown.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-1.5 px-0.5">
                                <span className="text-[#0F172A] font-bold text-xs">{item.label}</span>
                                <span className="text-[#64748B] text-[10px] font-bold">{item.value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                            </div>
                            <p className="text-[#64748B] text-[10px] font-bold mt-1.5 opacity-70 italic pl-0.5">{item.amount}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6-Month Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <TrendingUp size={18} className="text-indigo-600" />
                    </div>
                    <h3 className="text-[#0F172A] font-bold text-sm">6-Month Performance</h3>
                </div>

                <div className="space-y-2.5 px-1">
                    {growth.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                            <span className="text-[#94A3B8] text-[10px] font-bold w-6 uppercase tracking-tighter">{item.month}</span>
                            <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/30">
                                <div
                                    className="h-full bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors"
                                    style={{ width: `${item.value}%` }}
                                ></div>
                            </div>
                            <span className="text-[#0F172A] text-[10px] font-bold w-10 text-right">{item.amount}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center bg-[#F8FAFC]/30 -mx-5 px-5 rounded-b-2xl">
                    <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest">Active Deals</span>
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                        <ArrowUpRight size={12} strokeWidth={3} />
                        {investments.length > 0 ? investments.length : 0} total
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-hidden text-black">
                <h3 className="text-[#0F172A] font-bold text-sm mb-4 border-b border-gray-50 pb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={action.onClick}
                            className="flex items-center gap-3 w-full p-3 border border-gray-100 rounded-xl text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group active:scale-95"
                        >
                            <div className="w-6 h-6 rounded flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0">
                                {action.icon === "plus" ? <span className="text-lg font-bold leading-none">+</span> : <action.icon size={16} />}
                            </div>
                            <span className="text-[#475569] font-bold text-[11px] group-hover:text-[#0F172A] transition-colors">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
