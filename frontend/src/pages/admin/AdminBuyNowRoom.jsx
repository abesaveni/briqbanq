import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Home, FileText, ShieldAlert,
    TrendingUp, X, ArrowRight, FolderOpen, Eye, Download,
    ShoppingCart, CheckCircle2,
} from 'lucide-react';
import { dealsService } from '../../api/dataService';
import { generateBrandedPDF } from '../../utils/pdfGenerator';
import AuctionHero from '../../components/admin/deals/AuctionHero';
import InvestmentMemorandumTab from '../../components/admin/deals/InvestmentMemorandumTab';
import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const fmt = (v) =>
    v != null && v !== 0
        ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v)
        : '—';

/* ─── MetricPill ───────────────────────────────────────────────────────── */
function MetricPill({ label, value, sub, color = 'text-gray-900', bg = 'bg-gray-50' }) {
    return (
        <div className={`${bg} rounded-xl px-5 py-4 space-y-1`}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`text-xl font-bold ${color} leading-none`}>{value}</p>
            {sub && <p className="text-[10px] text-gray-400 font-medium">{sub}</p>}
        </div>
    );
}

/* ─── Card ─────────────────────────────────────────────────────────────── */
function Card({ title, icon: Icon, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600', children, className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl ${className}`}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

/* ─── Row ──────────────────────────────────────────────────────────────── */
function Row({ label, value, valueClass = 'text-gray-900' }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
        </div>
    );
}

/* ─── LoanDetails ──────────────────────────────────────────────────────── */
function LoanDetails({ financials, metrics }) {
    return (
        <Card title="Loan Details" icon={ShieldAlert}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                <div>
                    <Row label="Outstanding Debt" value={fmt(financials.outstandingDebt)} />
                    <Row label="Original Loan Amount" value={fmt(financials.originalLoanAmount)} />
                    <Row label="Property Valuation" value={fmt(financials.propertyValuation)} valueClass="text-emerald-600" />
                </div>
                <div>
                    <Row label="Equity Available" value={fmt(financials.equityAvailable)} valueClass="text-emerald-600" />
                    <Row label="Interest Rate" value={metrics.interestRate > 0 ? `${metrics.interestRate}% p.a.` : '—'} />
                    <Row label="Default Rate" value={metrics.defaultRate > 0 ? `${metrics.defaultRate}% p.a.` : '—'} valueClass="text-amber-600" />
                </div>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-amber-800">Risk Assessment</p>
                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                        LVR of {metrics.lvr || '—'}% — property valuation is current. Fixed price purchase available immediately.
                    </p>
                </div>
            </div>
        </Card>
    );
}

/* ─── PropertyInfo ─────────────────────────────────────────────────────── */
function PropertyInfo({ deal }) {
    const rows = [
        { label: 'Property Type', value: deal.propertyType || deal.type || '—' },
        { label: 'Bedrooms', value: deal.bedrooms || '—' },
        { label: 'Bathrooms', value: deal.bathrooms || '—' },
        { label: 'Parking', value: deal.parking || '—' },
        { label: 'Land Size', value: deal.landSize || '—' },
        { label: 'Tenure', value: deal.tenure ? `${deal.tenure} months` : '—' },
    ];
    return (
        <Card title="Property Information" icon={Home}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                {rows.map((r, i) => <Row key={i} label={r.label} value={r.value} />)}
            </div>
        </Card>
    );
}

/* ─── Documents ────────────────────────────────────────────────────────── */
function Documents({ documents }) {
    const docs = Array.isArray(documents) ? documents : [];
    const getName = (d) => d.document_name || d.name || 'Document';
    const getType = (d) => d.document_type || d.type || '';
    const getUrl = (d) => d.s3_key || d.file_url || null;

    const handleDownload = async (doc) => {
        const url = getUrl(doc);
        if (url) { window.open(url, '_blank'); return; }
        try {
            await generateBrandedPDF({
                title: getName(doc), subtitle: getType(doc),
                fileName: `${getName(doc).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
                infoItems: [{ label: 'Document', value: getName(doc) }, { label: 'Type', value: getType(doc) }],
            });
        } catch { /* ignore */ }
    };

    return (
        <Card title="Case Documents" icon={FileText}>
            {docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                    <FolderOpen className="w-8 h-8 mb-2" />
                    <p className="text-xs font-medium text-gray-400">No documents attached</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div key={doc.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 group transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{getName(doc)}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{getType(doc)}</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {getUrl(doc) && (
                                    <button onClick={() => window.open(getUrl(doc), '_blank')} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

/* ─── PriceCard ────────────────────────────────────────────────────────── */
function PriceCard({ price, status }) {
    return (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest mb-1">Fixed Asking Price</p>
            <p className="text-4xl font-bold tracking-tight mb-4">{fmt(price)}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Buy Now Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100">
                    <CheckCircle2 className="w-4 h-4" /> {status || 'Listed'}
                </div>
            </div>
        </div>
    );
}

/* ─── AssetFlowPanel ───────────────────────────────────────────────────── */
function AssetFlowPanel({ deal, onStatusChange }) {
    return (
        <Card title="Admin Status Control" icon={ShieldAlert} iconBg="bg-indigo-50" iconColor="text-indigo-600">
            <div className="space-y-2">
                {[
                    { label: 'Mark as Under Contract', status: 'UNDER_CONTRACT', cls: 'bg-blue-600 hover:bg-blue-700' },
                    { label: 'Mark as Settled', status: 'SETTLED', cls: 'bg-emerald-600 hover:bg-emerald-700' },
                    { label: 'Close Deal', status: 'CLOSED', cls: 'bg-gray-700 hover:bg-gray-800' },
                ].map(action => (
                    <button
                        key={action.status}
                        onClick={() => onStatusChange(action.status)}
                        className={`w-full ${action.cls} text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors`}
                    >
                        <ArrowRight className="w-3.5 h-3.5" /> {action.label}
                    </button>
                ))}
                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Current status:</span>
                    <span className="font-semibold text-gray-800">{deal.status || 'Listed'}</span>
                </div>
            </div>
        </Card>
    );
}

/* ─── InvestmentSummary ────────────────────────────────────────────────── */
function InvestmentSummary({ financials }) {
    const riskColor = financials.riskLevel?.includes('Low') ? 'text-emerald-600'
        : financials.riskLevel?.includes('High') ? 'text-red-500' : 'text-amber-500';
    return (
        <Card title="Investment Summary" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600">
            <div className="space-y-0">
                <Row label="Expected ROI" value={`${financials.expectedROI ?? '—'}%`} valueClass="text-emerald-600" />
                <Row label="Equity Position" value={fmt(financials.equityAvailable)} />
                <Row label="Time to Settlement" value={financials.timeToSettlement || '45 Days'} />
                <Row label="Risk Level" value={financials.riskLevel || 'Moderate'} valueClass={riskColor} />
            </div>
        </Card>
    );
}

/* ─── Asset Flow Confirm Modal ─────────────────────────────────────────── */
function AssetFlowModal({ deal, onClose, onConfirm, saving }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Manage Asset Flow</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Transition deal to next stage</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-2">
                    {[
                        { label: 'Mark as Under Contract', status: 'UNDER_CONTRACT', cls: 'bg-blue-600 hover:bg-blue-700' },
                        { label: 'Mark as Settled', status: 'SETTLED', cls: 'bg-emerald-600 hover:bg-emerald-700' },
                        { label: 'Close Deal', status: 'CLOSED', cls: 'bg-gray-700 hover:bg-gray-800' },
                    ].map(action => (
                        <button
                            key={action.status}
                            disabled={saving}
                            onClick={() => onConfirm(action.status)}
                            className={`w-full ${action.cls} text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-60`}
                        >
                            <ArrowRight className="w-3.5 h-3.5" /> {action.label}
                        </button>
                    ))}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center rounded-b-2xl">
                    Current status: <span className="font-semibold text-gray-700">{deal.status || 'Listed'}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function AdminBuyNowRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        dealsService.getDealById(id)
            .then((res) => {
                if (!res.success || !res.data) return;
                const d = res.data;
                const outstanding = Number(d.outstanding_debt) || 0;
                const estimated = Number(d.estimated_value) || 0;
                const asking = Number(d.asking_price) || outstanding;
                const interest = Number(d.interest_rate) || 0;
                const lvr = estimated > 0 ? Math.round((outstanding / estimated) * 100) : 0;
                const defaultRate = Number(d.default_rate) || (interest > 0 ? +(interest + 2).toFixed(2) : 0);
                const expectedROI = interest > 0 ? +(interest + 1.5).toFixed(2) : 8.5;
                const equityAvailable = Math.max(0, estimated - outstanding);
                const location = [d.suburb, d.state, d.postcode].filter(Boolean).join(', ') || d.property_address || '';
                const rawImgs = Array.isArray(d.property_images) && d.property_images.length > 0
                    ? d.property_images
                    : (d.metadata_json_case?.property_images || []);

                setDeal({
                    ...d,
                    address: d.property_address || d.title || '',
                    suburb: d.suburb || '', state: d.state || '', postcode: d.postcode || '',
                    propertyType: d.property_type || 'Residential',
                    type: d.property_type || 'Residential',
                    images: rawImgs, image: rawImgs[0] || null, location,
                    bedrooms: d.bedrooms || 0, bathrooms: d.bathrooms || 0, parking: d.parking || 0,
                    landSize: d.land_size || '—', valuer: d.valuer_name || '—',
                    tenure: d.tenure || null,
                    buyNowPrice: asking, propertyValue: estimated,
                    documents: Array.isArray(d.documents) ? d.documents : [],
                    metrics: {
                        interestRate: interest, defaultRate, lvr,
                        daysInDefault: d.days_in_default || 0, daysInArrears: 0,
                        totalArrears: Math.round(outstanding * (defaultRate / 100) / 12),
                    },
                    financials: {
                        originalLoanAmount: outstanding, outstandingDebt: outstanding,
                        propertyValuation: estimated, equityAvailable,
                        expectedROI, riskLevel: lvr > 80 ? 'High' : lvr > 60 ? 'Moderate' : 'Low',
                        timeToSettlement: d.tenure ? `${d.tenure} mo.` : '45 Days',
                    },
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (status) => {
        setSaving(true);
        try {
            await dealsService.updateDeal(deal.id, { status });
            setDeal(prev => ({ ...prev, status }));
        } catch { /* ignore */ }
        setSaving(false);
        setShowModal(false);
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" style={{ border: '3px solid', borderTopColor: 'transparent' }} />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading…</p>
            </div>
        </div>
    );

    if (!deal) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-3">
                <p className="font-bold text-gray-500">Deal not found</p>
                <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Go back</button>
            </div>
        </div>
    );

    const { metrics, financials } = deal;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Sticky Header ─────────────────────────────────── */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                        <button onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors shrink-0">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200 shrink-0">
                                <ShoppingCart className="w-3 h-3" /> Buy Now
                            </span>
                            <h1 className="text-sm font-bold text-gray-900 truncate">{deal.address || deal.title}</h1>
                            <span className="text-xs text-gray-400 font-medium shrink-0 hidden sm:block">
                                <MapPin className="w-3 h-3 inline mr-0.5" />{deal.location}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
                        {[
                            { key: 'details', icon: Home, label: 'Details' },
                            { key: 'memo', icon: FileText, label: 'Memo' },
                        ].map(({ key, icon: Icon, label }) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'details' ? (
                <div className="p-6 space-y-6">

                    {/* ── Hero image ───────────────────────────────── */}
                    <AuctionHero deal={deal} />

                    {/* ── Metrics row ──────────────────────────────── */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <MetricPill label="Asking Price" value={fmt(deal.buyNowPrice)} sub="fixed" color="text-emerald-600" bg="bg-emerald-50" />
                        <MetricPill label="LVR" value={`${metrics.lvr || '—'}%`} sub="loan-to-value" color="text-indigo-600" bg="bg-indigo-50" />
                        <MetricPill label="Interest Rate" value={metrics.interestRate > 0 ? `${metrics.interestRate}%` : '—'} sub="p.a." />
                        <MetricPill label="Default Rate" value={metrics.defaultRate > 0 ? `${metrics.defaultRate}%` : '—'} sub="p.a. penalty" color="text-amber-600" bg="bg-amber-50" />
                        <MetricPill label="Equity Buffer" value={fmt(financials.equityAvailable)} sub="available" color="text-emerald-600" bg="bg-emerald-50" />
                        <MetricPill label="Risk Level" value={financials.riskLevel || 'Moderate'} sub="assessment"
                            color={financials.riskLevel === 'Low' ? 'text-emerald-600' : financials.riskLevel === 'High' ? 'text-red-500' : 'text-amber-600'}
                            bg={financials.riskLevel === 'Low' ? 'bg-emerald-50' : financials.riskLevel === 'High' ? 'bg-red-50' : 'bg-amber-50'} />
                    </div>

                    {/* ── Main grid ────────────────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                        {/* Left — 3 cols */}
                        <div className="xl:col-span-3 space-y-6">
                            <LoanDetails financials={financials} metrics={metrics} />
                            <PropertyInfo deal={deal} />
                            <Documents documents={deal.documents} />
                        </div>

                        {/* Right — 2 cols */}
                        <div className="xl:col-span-2 space-y-4">
                            <PriceCard price={deal.buyNowPrice} status={deal.status} />
                            <AssetFlowPanel deal={deal} onStatusChange={(s) => { handleStatusChange(s) }} />
                            <InvestmentSummary financials={financials} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6">
                    <InvestmentMemorandumTab deal={deal} />
                </div>
            )}

            {showModal && (
                <AssetFlowModal
                    deal={deal}
                    onClose={() => setShowModal(false)}
                    onConfirm={handleStatusChange}
                    saving={saving}
                />
            )}
        </div>
    );
}
