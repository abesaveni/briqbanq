import React from 'react';
import {
    Link
} from 'react-router-dom';
import {
    ArrowLeft,
    Box,
    Globe,
    Zap,
    Users,
    FileText,
    Clock,
    Layout,
    CheckCircle2,
    DollarSign,
    Info,
    ShieldCheck,
    Briefcase,
    Building2,
    Database,
    CreditCard,
    Wallet,
    Layers
} from 'lucide-react';

const coreModules = [
    { name: 'Grow CRM', desc: 'Universal contact & relationship management', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Grow Documents', desc: 'Enterprise document management system', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Grow Time & Revenue', desc: 'Time tracking & revenue management', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Grow HQ', desc: 'Central SaaS management console', icon: Layout, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const specializedModules = [
    { name: 'Brickbanq', desc: 'Virtual MIP Platform', icon: Box },
    { name: 'Grow Accounting', desc: 'Practice Management', icon: Box },
    { name: 'Grow Lending', desc: 'Business Lending', icon: Box },
    { name: 'Grow Trust', desc: 'Trust Account Management', icon: Box },
    { name: 'Grow Investments', desc: 'Fund Management', icon: Box },
    { name: 'Grow Receivership', desc: 'Restructuring & MIP', icon: Box },
    { name: 'Grow Settlement', desc: 'Property Settlement', icon: Box },
    { name: 'Grow Payments', desc: 'Payment Gateway', icon: Box },
];

export default function IntegrationArchitecture() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Integration Architecture</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Platform administration and compliance management</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-8 mt-10">
                {/* Back Button */}
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 group">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="font-medium">Back to Grow HQ</span>
                </Link>

                {/* Section Title */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Integration Architecture</h2>
                        <p className="text-lg text-gray-500 mt-2 font-medium">How core add-on modules integrate with specialized modules</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg text-indigo-700 font-bold text-sm shadow-sm flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        8 Specialized Modules + 4 Core Add-Ons = Unified Platform
                    </div>
                </div>

                {/* Platform Architecture Model */}
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl mb-16 ring-1 ring-gray-900/5">
                    <div className="bg-indigo-600 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="w-6 h-6 text-indigo-200" />
                            <h3 className="text-white font-bold text-lg">Platform Architecture Model</h3>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Philosophy Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Globe className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-blue-900">Shared Services</h4>
                                </div>
                                <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
                                    Core modules provide shared functionality that all specialized modules can leverage.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-purple-900">Opt-In Model</h4>
                                </div>
                                <p className="text-sm text-purple-800/80 leading-relaxed font-medium">
                                    Operators only pay for what they need. Add-ons enhance capabilities without forcing adoption.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Database className="w-5 h-5 text-emerald-600" />
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-emerald-900">Data Unification</h4>
                                </div>
                                <p className="text-sm text-emerald-800/80 leading-relaxed font-medium">
                                    When enabled, core modules unify data across specialized modules for enterprise insights.
                                </p>
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <h4 className="text-gray-900 font-bold text-lg mb-6 flex items-center gap-2">
                                    Without Core Add-Ons
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        'Each module has isolated contacts, documents, and time tracking',
                                        'Module-specific data silos with basic functionality',
                                        'Manual cross-module workflows and data entry'
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium">
                                            <span className="w-5 h-5 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">✕</span>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-emerald-50/40 rounded-2xl p-8 border border-emerald-200/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldCheck className="w-32 h-32 text-emerald-600" />
                                </div>
                                <h4 className="text-emerald-900 font-bold text-lg mb-6 flex items-center gap-2">
                                    With Core Add-Ons Enabled
                                </h4>
                                <ul className="space-y-4 relative z-10">
                                    {[
                                        'Unified contact database accessible from every module',
                                        'Enterprise document repository with smart search',
                                        'Organization-wide time tracking and automated billing',
                                        'Centralized management console for all modules'
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-emerald-800 font-medium">
                                            <div className="w-5 h-5 flex-shrink-0 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white">✓</div>
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Add-On Modules */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Core Add-On Modules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {coreModules.map((module) => (
                            <div key={module.name} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all group flex flex-col items-center text-center">
                                <div className={`w-12 h-12 ${module.bg} ${module.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm mb-1">{module.name}</h4>
                                <p className="text-xs text-gray-500 font-medium">{module.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specialized Modules */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Specialized Modules</h3>
                    <p className="text-gray-500 mb-8 font-medium">Click any module to see how core add-ons integrate and enhance functionality</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {specializedModules.map((module) => (
                            <div key={module.name} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all group">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <module.icon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm mb-1">{module.name}</h4>
                                <p className="text-xs text-gray-500 font-medium">{module.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Model */}
                <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-2xl mb-20 ring-1 ring-gray-900/5">
                    <div className="p-8 md:p-12">
                        <h3 className="text-2xl font-bold text-gray-900 mb-10 flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6" />
                            </span>
                            Pricing & Licensing Model
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* Specialized Pricing */}
                            <div className="lg:col-span-7">
                                <h4 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-100 pb-4">Specialized Modules</h4>
                                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                        <Briefcase className="w-48 h-48" />
                                    </div>
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div>
                                            <p className="text-xl font-bold text-gray-900">Base Price</p>
                                            <p className="text-gray-500 text-sm mt-1">Per module, per month</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-bold text-indigo-600">$199</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Includes:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                'Module-specific functionality',
                                                'Basic contacts & documents (module-isolated)',
                                                'Simple time tracking',
                                                'Unlimited users'
                                            ].map((text, i) => (
                                                <div key={i} className="flex gap-3 text-xs font-bold text-gray-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                    {text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Pricing */}
                            <div className="lg:col-span-5">
                                <h4 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-100 pb-4">Core Add-On Modules</h4>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Grow CRM', price: '$99', items: ['Unified contacts', 'Pipeline management', 'Email sync'], color: 'blue' },
                                        { name: 'Grow Documents', price: '$149', items: ['Enterprise DMS', 'Version control', 'OCR & AI extraction'], color: 'purple' },
                                        { name: 'Grow Time & Revenue', price: '$129', items: ['Cross-module time tracking', 'Automated billing', 'Revenue recognition'], color: 'emerald' },
                                        { name: 'Grow HQ', price: 'FREE', items: ['Always included', 'SaaS management', 'Multi-module admin'], color: 'orange' },
                                    ].map((item) => (
                                        <div key={item.name} className={`bg-white border hover:border-gray-300 transition-all rounded-2xl p-5 shadow-sm`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-bold text-gray-900">{item.name}</p>
                                                <p className={`font-bold text-indigo-600`}>{item.price}</p>
                                            </div>
                                            <ul className="space-y-2">
                                                {item.items.map((line, i) => (
                                                    <li key={i} className="flex gap-2 text-xs font-bold text-gray-500">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1" />
                                                        {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bundle Examples */}
                        <div className="mt-16 bg-emerald-50/50 rounded-3xl border border-emerald-100 p-8">
                            <h4 className="text-emerald-900 font-bold text-base mb-8 flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                Example Bundle Pricing
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div>
                                    <p className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2">Small Practice</p>
                                    <p className="text-xs text-emerald-700/70 font-bold mb-4">Grow Accounting + Grow CRM</p>
                                    <p className="text-2xl font-bold text-indigo-600">$298/month</p>
                                </div>
                                <div className="border-l-0 md:border-l border-emerald-200 pl-0 md:pl-12">
                                    <p className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2">Mid-Size Firm</p>
                                    <p className="text-xs text-emerald-700/70 font-bold mb-4">3 modules + all add-ons</p>
                                    <p className="text-2xl font-bold text-indigo-600">$974/month</p>
                                </div>
                                <div className="border-l-0 md:border-l border-emerald-200 pl-0 md:pl-12">
                                    <p className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-2">Enterprise</p>
                                    <p className="text-xs text-emerald-700/70 font-bold mb-4">All 11 modules + add-ons</p>
                                    <p className="text-2xl font-bold text-indigo-600">$2,566/month</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

