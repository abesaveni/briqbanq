import React, { useState, useEffect } from 'react';
import { Gavel, Home, CheckCircle2, AlertTriangle, FileText, Activity } from "lucide-react";
import { activityService } from '../../api/dataService';

const ICON_MAP = {
    bid:        { icon: Gavel,        color: "text-blue-600",    bg: "bg-blue-50" },
    status:     { icon: Activity,     color: "text-indigo-600",  bg: "bg-indigo-50" },
    completion: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    alert:      { icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50" },
    file:       { icon: FileText,     color: "text-slate-600",   bg: "bg-slate-100" },
    default:    { icon: Activity,     color: "text-slate-500",   bg: "bg-slate-100" },
};

export default function LenderRecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        activityService.getRecentActivity()
            .then(res => { if (res.success) setActivities(res.data || []); })
            .catch(err => console.error("Failed to fetch activity", err))
            .finally(() => setLoading(false));

        const handler = (e) => setActivities(prev => [e.detail, ...prev]);
        window.addEventListener('new-activity', handler);
        return () => window.removeEventListener('new-activity', handler);
    }, []);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Activity size={15} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Activity size={20} className="text-slate-300 animate-pulse" />
                </div>
            ) : activities.length > 0 ? (
                <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                    {activities.map((a) => {
                        const style = ICON_MAP[a.type] || ICON_MAP.default;
                        const Icon = style.icon;
                        return (
                            <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                                <div className={`w-7 h-7 ${style.bg} ${style.color} rounded-lg flex items-center justify-center shrink-0`}>
                                    <Icon size={13} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate">{a.title}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{a.time || "Just now"}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <Activity size={24} className="mb-2" />
                    <p className="text-xs font-medium text-slate-400">No recent activity</p>
                </div>
            )}
        </div>
    );
}
