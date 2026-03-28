import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { auctionService } from '../../api/dataService'
import BuyNowHero from '../../components/admin/deals/BuyNowHero'
import MetricsCards from '../../components/admin/deals/MetricsCards'
import LoanDetails from '../../components/admin/deals/LoanDetails'
import PropertyInformation from '../../components/admin/deals/PropertyInformation'
import AvailableDocuments from '../../components/admin/deals/AvailableDocuments'
import FixedPurchasePriceSummary from '../../components/admin/deals/FixedPurchasePriceSummary'
import CompletePurchase from '../../components/admin/deals/CompletePurchase'
import InvestmentSummary from '../../components/admin/deals/InvestmentSummary'
import InvestmentMemorandumTab from '../../components/admin/deals/InvestmentMemorandumTab'
import { FileText, Building2 } from 'lucide-react'

export default function BuyNowRoom() {
    const { id } = useParams()
    const [deal, setDeal] = useState(null)
    const [activeTab, setActiveTab] = useState('details') // 'details' or 'memo'

    useEffect(() => {
        auctionService.getAuctionById(id)
            .then((foundDeal) => {
                if (!foundDeal) return
                setDeal(foundDeal)
            })
            .catch(() => {})
    }, [id])

    if (!deal) return <div className="p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="mb-8 px-8 pt-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Buy Now Room</h1>
                <p className="text-sm text-gray-500 font-medium">Platform administration and compliance management</p>
            </div>

            {/* Hero Section */}
            <div className="px-8 mb-8">
                <BuyNowHero deal={deal} />
            </div>

            {/* Tabs */}
            <div className="px-8 mb-8">
                <div className="flex gap-4 p-1.5 bg-gray-100/50 rounded-[1.5rem] w-fit">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex items-center gap-3 px-8 py-3.5 text-xs font-bold uppercase tracking-widest rounded-[1.25rem] transition-all duration-500 ${activeTab === 'details'
                                ? 'bg-white text-indigo-600 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)]'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Property Details
                    </button>
                    <button
                        onClick={() => setActiveTab('memo')}
                        className={`flex items-center gap-3 px-8 py-3.5 text-xs font-bold uppercase tracking-widest rounded-[1.25rem] transition-all duration-500 ${activeTab === 'memo'
                                ? 'bg-white text-indigo-600 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)]'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Investment Memorandum
                    </button>
                </div>
            </div>

            {activeTab === 'details' ? (
                <div className="px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <MetricsCards metrics={deal.metrics} buyNow />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="xl:col-span-2 space-y-8">
                            <LoanDetails financials={deal.financials} metrics={deal.metrics} buyNow />
                            <PropertyInformation deal={deal} />
                            <AvailableDocuments documents={deal.documents} />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <FixedPurchasePriceSummary financials={deal.financials} />
                            <CompletePurchase financials={deal.financials} />
                            <InvestmentSummary financials={deal.financials} buyNow />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-8">
                    <InvestmentMemorandumTab deal={deal} />
                </div>
            )}
        </div>
    )
}
