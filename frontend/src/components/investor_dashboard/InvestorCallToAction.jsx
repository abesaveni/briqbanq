import { useNavigate } from "react-router-dom";
import { Eye, Bell } from "lucide-react";

export default function InvestorCallToAction() {
    const navigate = useNavigate();

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl py-3.5 px-8 text-white flex flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-100 overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <h2 className="text-white text-lg md:text-xl font-bold leading-none">
                    Ready to invest in your next opportunity?
                </h2>
                <p className="text-indigo-100/80 text-xs font-medium mt-1.5">
                    Browse all available properties or set up alerts for new listings
                </p>
            </div>

            <div className="flex items-center gap-3 relative z-10 shrink-0">
                <button
                    onClick={() => navigate("/investor/deals")}
                    className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                >
                    <Eye size={16} />
                    Browse All Deals
                </button>
                <button
                    onClick={() => navigate("/investor/settings")}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95"
                >
                    <Bell size={16} />
                    Set Up Alerts
                </button>
            </div>
        </div>
    );
}
