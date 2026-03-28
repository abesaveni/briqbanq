import React, { useState, useEffect } from 'react';
import { Gavel, Home, CheckCircle2, AlertTriangle, FileText, Activity } from "lucide-react";
import { activityService } from '../../api/dataService';

export default function LenderRecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const res = await activityService.getRecentActivity();
                if (res.success) {
                    setActivities(res.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch activity", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();

        // Listen for new activities from other components
        const handleNewActivity = (e) => {
            setActivities(prev => [e.detail, ...prev]);
        };
        window.addEventListener('new-activity', handleNewActivity);
        return () => window.removeEventListener('new-activity', handleNewActivity);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'bid': return { icon: <Gavel size={16} />, color: "text-blue-500", bg: "bg-blue-50" };
            case 'status': return { icon: <Activity size={16} />, color: "text-indigo-500", bg: "bg-indigo-50" };
            case 'completion': return { icon: <CheckCircle2 size={16} />, color: "text-emerald-500", bg: "bg-emerald-50" };
            case 'alert': return { icon: <AlertTriangle size={16} />, color: "text-amber-500", bg: "bg-amber-50" };
            case 'file': return { icon: <FileText size={16} />, color: "text-slate-500", bg: "bg-slate-50" };
            default: return { icon: <Activity size={16} />, color: "text-gray-500", bg: "bg-gray-50" };
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-indigo-600 animate-pulse">
                    <Activity size={24} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Streaming Feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                <div className="text-indigo-600">
                    <TrendingUpIcon />
                </div>
                <h3 className="text-slate-900 font-bold text-[15px] tracking-tight">Recent Activity</h3>
            </div>

            {/* Activities List */}
            <div className="divide-y divide-gray-100">
                {activities.length > 0 ? activities.map((activity) => {
                    const style = getIcon(activity.type);
                    return (
                        <div key={activity.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-all duration-200 items-center">
                            <div className={`w-10 h-10 ${style.bg} ${style.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                {React.cloneElement(style.icon, { size: 16 })}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <p className="text-slate-900 font-semibold text-[13px] leading-tight truncate">{activity.title}</p>
                                <p className="text-slate-400 text-[11px] font-medium mt-1 uppercase tracking-tight">{activity.time}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <Activity size={32} className="mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TrendingUpIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    );
}
