import PropTypes from 'prop-types';
import {
    Printer, Download,  MapPin, Bed, Bath, Car,
    CheckCircle, TrendingUp, Shield, AlertTriangle,
    FileText, Phone, Mail, Building2, Wallet, Calendar
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { generateInvestmentMemorandumPDF } from "../../utils/pdfGenerator";

export default function InvestmentMemorandum({ deal }) {
    if (!deal) return null;

    const { metrics = {}, financials = {}, propertyDetails = {}, memorandum = {} } = deal;

    const handlePrint = () => {
        const originalTitle = document.title;
        // Construct a professional filename
        const safeTitle = (deal.title || 'Investment-Memorandum').replace(/[^a-z0-9]/gi, '-');
        document.title = `${safeTitle}-Memorandum`;
        window.print();
        document.title = originalTitle;
    };

    const handleDownloadPDF = async () => {
        await generateInvestmentMemorandumPDF(deal);
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 animate-fade-in-up pb-20">

            {/* 1. Integrated Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print-controls">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Investment Memorandum</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Professional marketing document for investors</p>
                </div>
                <div className="flex gap-3">
                    <ActionButton icon={<Printer size={16} />} label="Print" onClick={handlePrint} />
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-800 transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* 2. Enhanced Hero Image Section */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl group h-[400px]">
                {/* Background — real property image only; no stock fallback */}
                {deal.image ? (
                    <img
                        src={deal.image}
                        alt="Property"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1d2375] to-[#2d3a9a]" />
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div>
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded mb-4 inline-block shadow-sm">
                            Investment Opportunity
                        </span>
                        <h1 className="text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
                            {deal.title || "45 Victoria Street"}
                        </h1>
                        <div className="flex items-center gap-2 text-white/90 font-medium text-lg drop-shadow-sm">
                            <MapPin size={18} />
                            {deal.location || "Potts Point, NSW 2011"}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <SpecBadge icon={<Bed size={18} />} label={`${propertyDetails.bedrooms || 2} `} />
                            <SpecBadge icon={<Bath size={18} />} label={`${propertyDetails.bathrooms || 2} `} />
                            <SpecBadge icon={<Car size={18} />} label={`${propertyDetails.parking || 1} `} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
                        <HeroStatCard label="Property Value" value={formatCurrency(deal.propertyValue)} />
                        <HeroStatCard label="Outstanding Debt" value={formatCurrency(deal.outstandingDebt || deal.financials?.outstandingDebt)} />
                        <HeroStatCard label="Expected Return" value={`${deal.returnRate || deal.expectedReturn || 0}%`} valueColor="text-green-500" />
                    </div>
                </div>
            </div>

            {/* 3. Executive Summary */}
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                    <SectionTitle>Executive Summary</SectionTitle>
                    <p className="text-gray-600 leading-relaxed font-medium">
                        This Investment Memorandum presents a secured lending opportunity backed by a premium {deal.type?.toLowerCase() || 'residential property'} in {deal.suburb}, {deal.state}. The property is currently in mortgage default, presenting an attractive acquisition opportunity for institutional and high net worth investors.
                    </p>
                    <p className="text-gray-600 leading-relaxed font-medium">
                        The loan is secured by first mortgage over a well-maintained property valued at {formatCurrency(deal.propertyValue)}, providing a conservative LVR of {deal.lvr}% and significant equity buffer.
                    </p>
                </div>
                <div className="space-y-4">
                    <FeatureRow
                        icon={<CheckCircle className="text-green-500" />}
                        title="First Mortgage Security"
                        desc="Primary lien position"
                        bg="bg-green-50 border-green-100"
                    />
                    <FeatureRow
                        icon={<CheckCircle className="text-blue-500" />}
                        title="Independent Valuation"
                        desc="Current as of Jan 2026"
                        bg="bg-blue-50 border-blue-100"
                    />
                    <FeatureRow
                        icon={<CheckCircle className="text-purple-500" />}
                        title="Clear Title"
                        desc="No secondary encumbrances"
                        bg="bg-purple-50 border-purple-100"
                    />
                </div>
            </div>

            {/* 4. Investment Highlights */}
            <div>
                <SectionTitle>Investment Highlights</SectionTitle>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <HighlightCard
                        icon={<TrendingUp className="text-green-500" />}
                        title="Strong Returns"
                        desc={`Target IRR of ${deal.returnRate || 12.4}% per annum with monthly interest payments at ${metrics.defaultRate || '8.25'}% default rate.`}
                        sub={`Historical recovery rate: ${deal.recoveryRate || '87.5%'}`}
                    />
                    <HighlightCard
                        icon={<Shield className="text-blue-500" />}
                        title="Conservative LVR"
                        desc={`Loan to Value Ratio of ${deal.lvr || metrics.lvr}% provides substantial equity cushion and downside protection.`}
                        sub={`Equity buffer: ${formatCurrency(deal.propertyValue - (financials.outstandingDebt || deal.loanAmount))}`}
                    />
                    <HighlightCard
                        icon={<MapPin className="text-purple-500" />}
                        title="Prime Location"
                        desc={`Located in ${deal.suburb || 'Potts Point'}, a highly desirable suburb with strong capital growth history.`}
                        sub="Growth & Market Resilience"
                    />
                    <HighlightCard
                        icon={<AlertTriangle className="text-red-500" />}
                        title="Default Rate Premium"
                        desc={`Enhanced return at ${metrics.defaultRate || '8.25'}% p.a. compared to original rate of ${metrics.interestRate || '5.75'}%, providing a premium.`}
                        sub={`${metrics.daysInDefault || 89} days in default • ${metrics.daysInArrears || 127} days in arrears`}
                    />
                </div>
            </div>

            {/* 5. Property Gallery */}
            <div>
                <SectionTitle>Property Gallery</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {deal.images && deal.images.length > 0 ? (
                        deal.images.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                className="w-full h-64 object-cover rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                                alt={`${deal.title || 'Property'} - View ${index + 1}`}
                            />
                        ))
                    ) : deal.image ? (
                        <img
                            src={deal.image}
                            className="w-full h-64 object-cover rounded-2xl shadow-sm lg:col-span-3"
                            alt="Property Main View"
                        />
                    ) : (
                        <div className="lg:col-span-3 h-64 rounded-2xl bg-gradient-to-br from-[#1d2375] to-[#2d3a9a] flex items-center justify-center">
                            <p className="text-white/50 text-sm font-semibold uppercase tracking-widest">No property images uploaded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6. Loan Details Section in Memorandum Style */}
            <div>
                <SectionTitle>Loan Details</SectionTitle>
                <div className="grid lg:grid-cols-2 gap-12 mt-6">

                    {/* Financial Summary */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 text-lg mb-4">Financial Summary</h4>
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
                            <SummaryItem label="Original Loan Amount" value={formatCurrency(financials.originalLoanAmount)} />
                            <SummaryItem label="Outstanding Principal" value={formatCurrency(financials.outstandingDebt || deal.outstandingDebt)} />
                            <SummaryItem label="Original Interest Rate" value={financials.interestRate || "N/A"} />
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex justify-between items-center -mx-2">
                                <span className="text-sm font-bold text-gray-600">Default Rate</span>
                                <span className="text-sm font-bold text-orange-600">{financials.defaultRate || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-bold text-gray-500">Loan to Value Ratio</span>
                                <span className="text-sm font-bold text-green-600">{deal.lvr}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Default Status */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 text-lg mb-4">Default Status</h4>
                        <div className="space-y-3">
                            <StatusItem label="Days in Default" value={`${metrics.daysInDefault || 89} days`} bg="bg-red-50" border="border-red-100" text="text-red-700" />
                            <StatusItem label="Days in Arrears" value={`${metrics.daysInArrears || 127} days`} bg="bg-yellow-50" border="border-yellow-100" text="text-yellow-700" />
                            <StatusItem label="Arrears Amount" value={formatCurrency(metrics.totalArrears || 24500)} />
                            <StatusItem label="Missed Payments" value={financials.missedPayments || "4"} />
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 font-medium leading-relaxed mt-4">
                            <strong>Note:</strong> Formal default notice issued. Borrower has expressed willingness to cooperate with orderly resolution process.
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. Property Details Grid */}
            <div>
                <SectionTitle>Property Details</SectionTitle>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6 grid md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h5 className="font-bold text-gray-900">Property Features</h5>
                        <CompactDetail label="Type" value="Apartment" />
                        <CompactDetail label="Bedrooms" value={propertyDetails.bedrooms} />
                        <CompactDetail label="Bathrooms" value={propertyDetails.bathrooms} />
                        <CompactDetail label="Parking" value={propertyDetails.parking} />
                        <CompactDetail label="Land Size" value={`${propertyDetails.landSize} m²`} />
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-bold text-gray-900">Valuation</h5>
                        <CompactDetail label="Current Value" value={formatCurrency(deal.propertyValue || 1250000)} />
                        <CompactDetail label="Valuation Date" value={propertyDetails.valuationDate || "15/01/2026"} />
                        <CompactDetail label="Valuer" value={propertyDetails.valuer || "Preston Rowe Paterson"} />
                        <CompactDetail label="Method" value={propertyDetails.method || "Direct Comparison"} />
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-bold text-gray-900">Location</h5>
                        <CompactDetail label="Suburb" value={deal.suburb || "Potts Point"} />
                        <CompactDetail label="State" value={deal.state || "NSW"} />
                        <CompactDetail label="Postcode" value={deal.postcode || "2011"} />
                        <CompactDetail label="CBD Distance" value={propertyDetails.cbdDistance || "8.5 km"} />
                    </div>
                </div>
            </div>

            {/* 8. Risk Assessment */}
            <div>
                <SectionTitle>Risk Assessment</SectionTitle>
                <div className="space-y-4 mt-6">
                    <RiskCard
                        status="positive"
                        title="Security Position"
                        desc="First mortgage security with no secondary encumbrances. Clear title confirmed by independent legal review."
                    />
                    <RiskCard
                        status="positive"
                        title="Equity Buffer"
                        desc="Conservative LVR of 72.8% provides $270k equity buffer against market volatility."
                    />
                    <RiskCard
                        status="warning"
                        title="Default Status"
                        desc="Property is 89 days in default. Recovery timeline estimated at 4-6 months including legal process."
                    />
                </div>
            </div>

            {/* 9. Further Information */}
            <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-gray-100">
                <div>
                    <SectionTitle>Investment Terms</SectionTitle>
                    <div className="space-y-4 mt-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <CompactDetail label="Minimum Investment" value="Full loan acquisition" />
                        <CompactDetail label="Interest Rate" value="8.25% p.a. (default rate)" />
                        <CompactDetail label="Payment Frequency" value="Monthly in arrears" />
                        <CompactDetail label="Loan Term" value="Until resolution" />
                        <CompactDetail label="Security" value="First registered mortgage" />
                        <CompactDetail label="Settlement" value="Within 60 days" />
                    </div>
                </div>

                <div>
                    <SectionTitle>Process</SectionTitle>
                    <div className="space-y-4 mt-6 pl-4">
                        <ProcessStep number="1" title="Submit Expression of Interest" desc="Review full data room and submit bid" />
                        <ProcessStep number="2" title="Due Diligence Period" desc="14 days for legal and valuation review" />
                        <ProcessStep number="3" title="Legal Documentation" desc="Execute loan assignment agreements" />
                        <ProcessStep number="4" title="Settlement" desc="Funds transfer and mortgage registration" />
                    </div>
                </div>
            </div>

            {/* 10. Contact & Disclaimer - Professional Footer */}
            <div className="bg-[#0B1221] text-white p-10 rounded-[2rem] mt-8">
                <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-8 text-left">
                    {/* Left: Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight text-indigo-400">Contact Information</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            For further information or to arrange property inspection:
                        </p>
                        <div className="space-y-3">
                            <p className="text-base font-bold">Brickbanq Virtual MIP Platform</p>
                            <div className="space-y-1.5 text-xs">
                                <p><span className="text-gray-400">Email:</span> investments@brickbanq.com.au</p>
                                <p><span className="text-gray-400">Phone:</span> 1300 BRICK (1300 274 252)</p>
                                <p><span className="text-gray-400">Case Number:</span> {deal.id || "MIP-2026-001"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Disclaimer */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight">Important Disclaimer</h3>
                        <p className="text-gray-400 text-xs leading-relaxed italic">
                            This Investment Memorandum is provided for information purposes only and does not constitute an offer, invitation, or recommendation to invest. All information is provided in good faith but no warranty is given as to its accuracy or completeness. Investors should conduct their own due diligence and seek independent legal, tax, and financial advice before making any investment decision. Past performance is not indicative of future results. Investment in distressed debt involves significant risk including potential loss of capital.
                        </p>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 text-center space-y-2">
                    <p className="text-gray-500 text-[10px] font-medium tracking-wide">
                        © 2026 Brickbanq Pty Ltd. All rights reserved. Australian Credit Licence: XXXXXX
                    </p>
                    <p className="text-gray-600 text-[9px] font-bold uppercase tracking-[0.2em]">
                        Document prepared: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>



        </div>
    );
}

/* --- Helper Components --- */

function ActionButton({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
        >
            {icon}
            {label}
        </button>
    );
}

function SpecBadge({ icon, label }) {
    return (
        <div className="bg-black/30 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold text-sm">
            {icon} {label}
        </div>
    );
}

function HeroStatCard({ label, value, valueColor = "text-gray-900" }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${valueColor} tracking-tight`}>{value}</p>
        </div>
    );
}

function SectionTitle({ children }) {
    return <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{children}</h3>;
}

function FeatureRow({ icon, title, desc, bg }) {
    return (
        <div className={`p-4 rounded-xl flex items-start gap-4 border ${bg}`}>
            <div className="mt-1">{icon}</div>
            <div>
                <p className="font-bold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

function HighlightCard({ icon, title, desc, sub }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                {icon}
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{desc}</p>
            <p className="text-xs font-bold text-gray-400 pt-3 border-t border-gray-50">{sub}</p>
        </div>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 last:pb-0">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
    );
}

function StatusItem({ label, value, bg = "bg-transparent", border = "border-transparent", text = "text-gray-900" }) {
    return (
        <div className={`flex justify-between items-center p-3 rounded-lg border ${border} ${bg}`}>
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className={`text-sm font-bold ${text}`}>{value}</span>
        </div>
    )
}

function CompactDetail({ label, value }) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-gray-900 text-right">{value}</span>
        </div>
    )
}

function RiskCard({ status, title, desc }) {
    const styles = {
        positive: { border: 'border-l-green-500', icon: <CheckCircle size={20} className="text-green-500" /> },
        warning: { border: 'border-l-orange-500', icon: <AlertTriangle size={20} className="text-orange-500" /> }
    };
    const style = styles[status];

    return (
        <div className={`bg-white p-6 rounded-r-xl border border-gray-100 border-l-4 shadow-sm ${style.border}`}>
            <div className="flex items-center gap-3 mb-2">
                {style.icon}
                <h4 className="font-bold text-gray-900">{title}</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-8">{desc}</p>
        </div>
    )
}

function ProcessStep({ number, title, desc }) {
    return (
        <div className="relative pb-8 last:pb-0 pl-8 border-l-2 border-dashed border-gray-200">
            <div className="absolute -left-[11px] top-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {number}
            </div>
            <h5 className="font-bold text-gray-900 text-sm">{title}</h5>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
        </div>
    )
}

InvestmentMemorandum.propTypes = {
    deal: PropTypes.object
};
