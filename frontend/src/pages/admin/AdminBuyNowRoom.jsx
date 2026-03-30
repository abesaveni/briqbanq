import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Home, FileText, CheckCircle2, ChevronLeft, ChevronRight,
    MapPin, Bed, Bath, Car, AlertTriangle, Calendar, TrendingUp,
    DollarSign, Activity, Percent, Shield, ShoppingCart, Lock
} from "lucide-react";
import InvestmentMemorandum from "../../components/auctions/InvestmentMemorandum";
import DocumentsSection from "../../components/auctions/DocumentsSection";

import { dealsService, userService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";
import { formatCurrency, formatFullCurrency } from "../../utils/formatters";

export default function AdminBuyNowRoom() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("details");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [deal, setDeal] = useState(null);
    const [investorDocs, setInvestorDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDeal = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await dealsService.getDealById(id || "MIP-2026-002");
                if (res.success) {
                    setDeal(res.data);

                    // Fetch investor documents
                    const docsRes = await userService.getInvestorDocuments();
                    if (docsRes.success) {
                        setInvestorDocs(docsRes.data || []);
                    }
                } else {
                    setError(res.error || "Deal not found");
                }
            } catch (err) {
                setError(err.message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };
        fetchDeal();
    }, [id]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!deal) return <div className="p-10 text-center text-gray-400 font-bold italic uppercase tracking-widest">Asset Not Found</div>;

    const { metrics = {}, financials = {}, propertyDetails = {}, images = [] } = deal;
    const galleryImages = images.length > 0 ? images : [deal.image];

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    return (
        <div className="max-w-[1600px] mx-auto pt-2 px-6 pb-6 space-y-5 animate-fade-in font-sans text-gray-900">

            {/* Page Header */}
            <div className="pb-0">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Buy Now Room (Admin View)</h1>
                <p className="text-sm text-gray-500 font-medium">Manage and review fixed price deals securely</p>
            </div>

            {/* 1. Specialized Buy Now Hero Section */}
            <div className="relative h-[250px] md:h-[350px] lg:h-[400px] rounded-[2rem] overflow-hidden group shadow-xl">
                <img
                    src={galleryImages[currentImageIndex]}
                    alt="Property"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-5 left-5 md:top-8 md:left-8">
                    <div className="bg-green-600 text-white font-bold text-xs uppercase tracking-widest px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg flex items-center gap-2 shadow-lg border border-white/20">
                        <ShoppingCart size={14} fill="currentColor" />
                        Fixed Price Asset
                    </div>
                </div>

                {/* Navigation Arrows */}
                <button onClick={handlePrevImage} className="absolute left-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 md:p-3 rounded-full text-white transition-all active:scale-95 z-10">
                    <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 md:p-3 rounded-full text-white transition-all active:scale-95 z-10">
                    <ChevronRight size={20} />
                </button>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 p-5 md:p-10 md:pl-20 w-full flex justify-between items-end pointer-events-none">
                    <div className="space-y-3 pointer-events-auto">
                        <div className="hidden md:flex gap-2 mb-4">
                            {galleryImages.slice(0, 4).map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-white scale-105 shadow-xl' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                                </button>
                            ))}
                        </div>

                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md">{deal.title}</h2>
                        <div className="flex items-center gap-1.5 text-sm md:text-xl text-white/90 font-medium pb-1">
                            <MapPin size={16} /> {deal.suburb}, {deal.state} {deal.postcode}
                        </div>

                        {(propertyDetails.bedrooms > 0 || propertyDetails.bathrooms > 0 || propertyDetails.parking > 0) && (
                            <div className="flex gap-3 md:gap-4">
                                {propertyDetails.bedrooms > 0 && <SpecPill icon={<Bed size={14} />} label={`${propertyDetails.bedrooms} Bed`} />}
                                {propertyDetails.bathrooms > 0 && <SpecPill icon={<Bath size={14} />} label={`${propertyDetails.bathrooms} Bath`} />}
                                {propertyDetails.parking > 0 && <SpecPill icon={<Car size={14} />} label={`${propertyDetails.parking} Car`} />}
                            </div>
                        )}
                    </div>

                    {/* Floating Price Card */}
                    <div className="bg-gradient-to-br from-green-600 to-green-600 p-4 md:p-6 rounded-2xl shadow-2xl text-white w-[180px] md:w-[260px] hidden lg:block transform translate-y-2 group-hover:translate-y-0 transition-transform pointer-events-auto border border-white/10">
                        <p className="text-white/80 font-bold text-xs uppercase tracking-widest mb-1 text-center font-sans">Listed Asking Price</p>
                        <p className="text-2xl md:text-4xl font-bold text-center tracking-tighter mb-2 font-sans">{formatCurrency(deal.buyNowPrice / 1000, 0)}k</p>
                        <p className="text-xs md:text-sm font-bold text-white/90 text-center uppercase tracking-wider font-sans">{metrics.timeToSettlement || "45 Day Settlement"}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-gray-100/60 p-1.5 rounded-2xl flex max-w-full">
                <button
                    onClick={() => setActiveTab("details")}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === "details"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Home size={18} className={activeTab === "details" ? "text-indigo-600" : "text-gray-400"} />
                    Property Details
                </button>
                <button
                    onClick={() => setActiveTab("memorandum")}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === "memorandum"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <FileText size={18} className={activeTab === "memorandum" ? "text-indigo-600" : "text-gray-400"} />
                    Investment Memorandum
                </button>
            </div>

            {activeTab === "details" ? (
                <div className="space-y-8">

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        <MetricCard icon={<AlertTriangle size={16} />} label="Days in Default" value={metrics?.daysInDefault || 0} subLabel={metrics?.daysInDefault > 100 ? "Critical status" : "Moderate status"} borderColor="border-red-200" bgColor="bg-red-50" iconColor="text-red-500" valueColor="text-red-600" />
                        <MetricCard icon={<Calendar size={16} />} label="Days in Arrears" value={metrics?.daysInArrears || 0} subLabel={`${financials?.missedPayments || 0} missed payments`} borderColor="border-orange-200" bgColor="bg-orange-50" iconColor="text-orange-500" valueColor="text-orange-600" />
                        <MetricCard icon={<TrendingUp size={16} />} label="Interest Rate" value={`${metrics?.interestRate || 0}%`} subLabel="Original rate" borderColor="border-blue-200" bgColor="bg-blue-50" iconColor="text-blue-500" valueColor="text-blue-600" />
                        <MetricCard icon={<TrendingUp size={16} />} label="Default Rate" value={`${metrics?.defaultRate || 0}%`} subLabel="Current penalty rate" borderColor="border-purple-200" bgColor="bg-purple-50" iconColor="text-purple-500" valueColor="text-purple-600" />
                        <MetricCard icon={<Percent size={16} />} label="LVR" value={`${metrics?.lvr || 0}%`} subLabel="Loan to value" borderColor="border-green-200" bgColor="bg-green-50" iconColor="text-green-500" valueColor="text-green-600" />
                        <MetricCard icon={<DollarSign size={16} />} label="Total Arrears" value={formatCurrency(metrics?.totalArrears || 0)} subLabel="Outstanding" borderColor="border-indigo-200" bgColor="bg-indigo-50" iconColor="text-indigo-500" valueColor="text-indigo-600" />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <SectionHeader icon={<Activity size={20} />} title="Loan Details" />
                                <div className="grid md:grid-cols-2 gap-y-8 gap-x-12 mt-6">
                                    <DetailItem label="Original Loan Amount" value={formatFullCurrency(financials?.originalLoanAmount)} size="xl" />
                                    <DetailItem label="Outstanding Debt" value={formatFullCurrency(financials?.outstandingDebt)} size="xl" />
                                    <DetailItem label="Last Payment Date" value={financials?.lastPaymentDate} />
                                    <DetailItem label="Last Payment Amount" value={formatFullCurrency(financials?.lastPaymentAmount)} />
                                    <DetailItem label="Property Valuation" value={formatFullCurrency(deal?.propertyValue)} color="text-green-600" size="xl" />
                                    <DetailItem label="Equity Available" value={formatFullCurrency(financials?.equityAvailable)} color="text-green-600" size="xl" />
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <SectionHeader icon={<Home size={20} />} title="Property Information" />
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-8 gap-x-12 mt-6">
                                    <DetailItem label="Property Type" value={propertyDetails?.type} size="lg" />
                                    <DetailItem label="Land Size" value={propertyDetails?.landSize} size="lg" />
                                    <DetailItem label="Bedrooms" value={propertyDetails?.bedrooms || "—"} size="lg" />
                                    <DetailItem label="Bathrooms" value={propertyDetails?.bathrooms || "—"} size="lg" />
                                    <DetailItem label="Parking" value={propertyDetails?.parking || "—"} size="lg" />
                                    <DetailItem label="Valuer" value={propertyDetails?.valuer} size="lg" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <DocumentsSection deal={deal} />
                                <DocumentsSection documents={investorDocs} title="Associated Documents" icon={Shield} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Admin Status Panel */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 font-bold text-gray-900 flex items-center gap-2">
                                    <Shield size={18} className="text-indigo-600" />
                                    Admin Status Control
                                </div>
                                <div className="p-6">
                                     <button
                                        disabled
                                        className="w-full bg-gray-100 text-gray-400 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-gray-200"
                                     >
                                         <Lock size={16} /> Admin Manage Asset Flow
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
                                    Investment Summary
                                </div>
                                <div className="p-6 space-y-4">
                                    <SummaryRow label="Expected ROI" value={deal?.expectedROI || deal?.returnRate + "%"} valueColor="text-green-600" />
                                    <SummaryRow label="Equity Position" value={formatCurrency((financials?.equityAvailable || 0) / 1000) + "k"} />
                                    <SummaryRow label="Time to Settlement" value={deal?.timeToSettlement || "45 Days"} />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs text-gray-500 font-medium">Risk Level:</span>
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                            {deal?.riskLevel || "Low"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <InvestmentMemorandum deal={deal} />
            )}

        </div>
    );
}

function SpecPill({ icon, label }) {
    return (
        <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold border border-white/10">
            {icon} {label}
        </div>
    )
}

function MetricCard({ icon, label, value, subLabel, borderColor, bgColor, iconColor, valueColor }) {
    return (
        <div className={`bg-white p-4 px-3 rounded-2xl border ${borderColor} shadow-sm group overflow-hidden`}>
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${bgColor} ${iconColor} shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none" title={label}>{label}</p>
            </div>
            <p className={`text-2xl font-bold ${valueColor} tracking-tight mb-1 whitespace-nowrap`} title={String(value)}>{value || "0"}</p>
            {subLabel && <p className="text-xs text-gray-400 font-medium whitespace-nowrap" title={subLabel}>{subLabel}</p>}
        </div>
    );
}

function SectionHeader({ icon, title }) {
    return (
        <div className="flex items-center gap-2 text-indigo-900">
            <div className="text-indigo-600">{icon}</div>
            <h3 className="font-bold text-lg">{title}</h3>
        </div>
    )
}

function DetailItem({ label, value, size = "base", color = "text-gray-900" }) {
    const isXl = size === "xl";
    const isLg = size === "lg";

    return (
        <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
            <p className={`font-bold ${isXl ? 'text-2xl tracking-tighter' : isLg ? 'text-base' : 'text-sm'} ${color}`}>
                {value || "N/A"}
            </p>
        </div>
    );
}

function SummaryRow({ label, value, valueColor = "text-gray-900" }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">{label}:</span>
            <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
        </div>
    )
}
