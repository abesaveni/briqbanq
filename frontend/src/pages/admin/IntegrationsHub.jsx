import React from 'react';
import {
    Link
} from 'react-router-dom';
import {
    Search,
    Plus,
    Settings,
    ArrowLeft,
    Link2,
    CheckCircle2,
    AlertCircle,
    Zap,
    ExternalLink
} from 'lucide-react';
import AdminStatCard from '../../components/admin/AdminStatCard';

const categories = [
    { name: 'All Integrations', count: 36, active: true },
    { name: 'Payments', count: 2 },
    { name: 'Accounting', count: 3 },
    { name: 'Banking', count: 2 },
    { name: 'Communications', count: 5 },
    { name: 'Documents', count: 2 },
    { name: 'Storage', count: 3 },
    { name: 'Identity/KYC', count: 3 },
    { name: 'Credit', count: 2 },
    { name: 'Property', count: 2 },
    { name: 'Registries', count: 3 },
    { name: 'Authentication', count: 3 },
    { name: 'Notifications', count: 2 },
    { name: 'Analytics', count: 2 },
    { name: 'Support', count: 2 },
];

const integrations = [
    {
        name: 'Stripe',
        description: 'Payment processing and subscription billing',
        type: 'Payment',
        icon: '💳',
        status: 'Connected',
        required: true,
        usedBy: ['payments', 'time', 'crm'],
        cost: '2.9% + 30¢ per transaction',
        color: 'bg-emerald-500'
    },
    {
        name: 'Square',
        description: 'Alternative payment processor',
        type: 'Payment',
        icon: '🔲',
        status: 'Not Connected',
        usedBy: ['payments'],
        cost: '2.6% + 10¢ per transaction',
        color: 'bg-indigo-600'
    },
    {
        name: 'Xero',
        description: 'Cloud accounting software integration',
        type: 'Accounting',
        icon: '🏢',
        status: 'Connected',
        usedBy: ['accounting', 'time', 'trust'],
        cost: 'Included in plan',
        color: 'bg-emerald-500'
    },
    {
        name: 'QuickBooks Online',
        description: 'Intuit accounting platform',
        type: 'Accounting',
        icon: '📊',
        status: 'Not Connected',
        usedBy: ['accounting', 'time'],
        cost: 'Included in plan',
        color: 'bg-indigo-600'
    },
    {
        name: 'MYOB AccountRight',
        description: 'Australian accounting software',
        type: 'Accounting',
        icon: '📉',
        status: 'Not Connected',
        usedBy: ['accounting', 'time'],
        cost: 'Included in plan',
        color: 'bg-indigo-600'
    },
    {
        name: 'Plaid',
        description: 'Bank account aggregation and verification',
        type: 'Banking',
        icon: '🏦',
        status: 'Connected',
        usedBy: ['trust', 'accounting', 'lending'],
        cost: '$0.10–0.30 per verification',
        color: 'bg-emerald-500'
    }
];

export default function IntegrationsHub() {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Integrations Hub</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Platform administration and compliance management</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-8 mt-6">
                {/* Back Button */}
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 group">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium">Back to Grow HQ</span>
                </Link>

                {/* Sub Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Platform Integrations</h2>
                        <p className="text-gray-500 mt-1">Manage all third-party integrations and API connections</p>
                    </div>
                    <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                        <Plus className="w-5 h-5" />
                        Add Custom Integration
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Integrations</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">36</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Link2 className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Connected</p>
                            <p className="text-4xl font-bold text-emerald-600 mt-1">20</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Required</p>
                            <p className="text-4xl font-bold text-orange-600 mt-1">6/6</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Platform Health</p>
                            <p className="text-4xl font-bold text-emerald-600 mt-1">56%</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <Zap className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-10 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${cat.active
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {cat.name} <span className={`ml-1.5 opacity-60`}>{cat.count}</span>
                        </button>
                    ))}
                </div>

                {/* Integrations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {integrations.map((item, index) => (
                        <div
                            key={item.name}
                            className={`group relative bg-white/70 backdrop-blur-xl rounded-2xl border-2 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] ${item.status === 'Connected' ? 'border-emerald-500/30' : 'border-transparent shadow-sm'
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white group-hover:rotate-6 transition-all duration-500">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border transition-colors duration-300 ${item.status === 'Connected'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            <span className="flex items-center gap-1.5">
                                                {item.status === 'Connected' ? (
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                )}
                                                {item.status}
                                            </span>
                                        </div>
                                        {item.required && (
                                            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-tighter shadow-md shadow-orange-100">
                                                Required API
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">{item.name}</h3>
                                        <p className="text-sm text-gray-500 mt-2 font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-100/80">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Service Type</p>
                                            <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100/50">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Usage Cost</p>
                                            <p className="text-xs font-bold text-gray-700">{item.cost}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Connected Modules</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.usedBy.map(usage => (
                                                <span key={usage} className="px-2.5 py-1 bg-white border border-gray-100 text-gray-600 rounded-md text-xs font-semibold hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default">
                                                    {usage.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    {item.status === 'Connected' ? (
                                        <button className="w-full py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all flex items-center justify-center gap-2 group/btn">
                                            <Settings className="w-4 h-4 text-gray-400 group-hover/btn:rotate-90 transition-transform duration-500" />
                                            Manage Integration
                                        </button>
                                    ) : (
                                        <button className="w-full py-3.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 hover:shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2">
                                            <Zap className="w-4 h-4 fill-white" />
                                            Activate Connection
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Decorative line for connected items */}
                            {item.status === 'Connected' && (
                                <div className="absolute inset-x-0 -bottom-[1px] h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-b-2xl shadow-[0_4px_10px_rgba(16,185,129,0.2)]"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

