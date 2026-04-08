import React, { useState, useEffect, useMemo, useCallback } from "react";
import LenderHeroSection from "../../components/lender_dashboard/LenderHeroSection";
import LenderAlerts from "../../components/lender_dashboard/LenderAlerts";
import LenderMetricsGrid from "../../components/lender_dashboard/LenderMetricsGrid";
import LenderPortfolioTable from "../../components/lender_dashboard/LenderPortfolioTable";
import LenderRecentActivity from "../../components/lender_dashboard/LenderRecentActivity";
import LenderQuickActions from "../../components/lender_dashboard/LenderQuickActions";
import { useAuth } from "../../context/AuthContext";
import { lenderService } from "../../api/dataService";

export default function LenderDashboard() {
    const { user } = useAuth();
    const firstName = user?.firstName || (user?.name || "").split(' ')[0] || "there";
    const [cases, setCases] = useState([]);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    const fetchCases = useCallback(() => {
        lenderService.getMyCases()
            .then(res => { if (res.success) setCases(Array.isArray(res.data) ? res.data : []); })
            .catch(err => console.error("Failed to fetch cases", err));
    }, []);

    useEffect(() => {
        fetchCases();
        window.addEventListener('focus', fetchCases);
        return () => window.removeEventListener('focus', fetchCases);
    }, [fetchCases]);

    const stats = useMemo(() => {
        if (!cases.length) return { portfolioValue: "0", activeLoans: 0, recoveryRate: "0.0", interestEarned: "0.00", defaultRate: "0.0", activeBids: "0", lvr: "0.0" };

        const totalVal = cases.reduce((a, c) => a + (Number(c.estimated_value) || 0), 0);
        const totalDebt = cases.reduce((a, c) => a + (Number(c.outstanding_debt) || 0), 0);
        const activeCount = cases.filter(c => !['CLOSED', 'REJECTED'].includes(c.status)).length;
        const closedCount = cases.filter(c => c.status === 'CLOSED').length;
        const defaultCount = cases.filter(c => c.status === 'REJECTED').length;
        const bidsCount = cases.filter(c => ['AUCTION', 'LISTED'].includes(c.status)).length;
        const lvr = totalVal > 0 ? ((totalDebt / totalVal) * 100).toFixed(1) : "0.0";
        const interest = totalDebt * 0.052;

        const fmt = (v) => {
            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
            if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
            return v.toFixed(0);
        };

        return {
            portfolioValue: fmt(totalVal),
            activeLoans: activeCount,
            recoveryRate: cases.length ? ((closedCount / cases.length) * 100).toFixed(1) : "0.0",
            interestEarned: fmt(interest),
            defaultRate: cases.length ? ((defaultCount / cases.length) * 100).toFixed(1) : "0.0",
            activeBids: bidsCount.toString(),
            lvr,
        };
    }, [cases]);

    return (
        <>
        <div className="space-y-4 pb-6">
            {/* Page header */}
            <div>
                <h1 className="text-lg font-semibold text-slate-900">Welcome back, {firstName}</h1>
                <p className="text-sm text-slate-500">Manage your mortgage in possession portfolio</p>
            </div>

            <LenderHeroSection statsData={stats} />
            <LenderAlerts />
            <LenderMetricsGrid statsData={stats} />

            {/* Portfolio + sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-8">
                    <LenderPortfolioTable />
                </div>
                <div className="xl:col-span-4 flex flex-col gap-4">
                    <LenderRecentActivity />
                    <LenderQuickActions />
                </div>
            </div>

            {/* Help bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500">Need assistance? Our support team is available to help.</p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowSupportModal(true)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Support Resources
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowContactModal(true)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#142d55] transition-colors"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>

        {/* Support Resources Modal */}
        {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSupportModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Support Resources</h3>
                        <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-3 space-y-1">
                        {[
                            { name: "ASIC MoneySmart",      phone: "1300 300 630", url: "https://moneysmart.gov.au" },
                            { name: "National Debt Helpline", phone: "1800 007 007", url: "https://ndh.org.au" },
                            { name: "AFCA",                 phone: "1800 931 678", url: "https://afca.org.au" },
                            { name: "Legal Aid NSW",         phone: "1300 888 529", url: "https://legalaid.nsw.gov.au" },
                            { name: "Fair Trading NSW",      phone: "13 32 20",     url: "https://fairtrading.nsw.gov.au" },
                        ].map(r => (
                            <div key={r.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div>
                                    <p className="text-xs font-semibold text-slate-700">{r.name}</p>
                                    <p className="text-xs text-slate-400">{r.phone}</p>
                                </div>
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">Visit</a>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100">
                        <button onClick={() => setShowSupportModal(false)} className="w-full text-xs font-medium py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Contact Support Modal */}
        {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowContactModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Contact Support</h3>
                        <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                    </div>
                    <div className="px-5 py-3 space-y-1">
                        {[
                            { label: "Email", value: "support@briqbanq.com.au" },
                            { label: "Debt Helpline", value: "1800 007 007" },
                            { label: "AFCA Complaints", value: "1800 931 678" },
                        ].map(c => (
                            <div key={c.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                <p className="text-xs text-slate-500">{c.label}</p>
                                <p className="text-xs font-semibold text-slate-700">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100">
                        <button onClick={() => setShowContactModal(false)} className="w-full text-xs font-medium py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
