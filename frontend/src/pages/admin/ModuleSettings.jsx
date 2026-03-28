import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Package, Settings, Globe, Database, Users,
    CheckCircle2, AlertCircle, Clock, Save,
    RefreshCcw, ChevronRight, Home, Layout,
    Briefcase, PieChart, Shield, Lock, Trash2, Mail, Bell, HardDrive
} from 'lucide-react'

export default function ModuleSettings() {
    const navigate = useNavigate()
    const [selectedModule, setSelectedModule] = useState('Brickbanq')

    const modules = [
        { name: 'Brickbanq', version: '2.4.1', status: 'Active', environment: 'production', icon: Package },
        { name: 'Grow Accounting', version: '1.8.3', status: 'Active', environment: 'production', icon: PieChart },
        { name: 'PFA', version: '0.5.0', status: 'Inactive', environment: 'development', icon: Shield }
    ]

    return (
        <div className="space-y-8 max-w-7xl pb-20">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Module Settings</h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium tracking-wide">Platform administration and compliance management</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <Globe className="w-4 h-4" />
                    Global Settings
                </button>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <Home className="w-3.5 h-3.5" />
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gray-900 transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate('/admin/settings')} className="hover:text-gray-900 transition-colors">Settings</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600">Module Settings</span>
            </nav>

            {/* Module Picker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <button
                        key={mod.name}
                        onClick={() => setSelectedModule(mod.name)}
                        className={`p-6 rounded-3xl border text-left transition-all relative group
                            ${selectedModule === mod.name
                                ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-50 ring-1 ring-indigo-600'
                                : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                                ${selectedModule === mod.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600'}
                            `}>
                                <mod.icon className="w-6 h-6" />
                            </div>
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-widest flex items-center gap-1
                                ${mod.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}
                            `}>
                                <div className={`w-1 h-1 rounded-full ${mod.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                {mod.status}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 tracking-tight">{mod.name}</h4>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Version {mod.version}</p>
                        </div>
                        <div className={`mt-4 px-3 py-1 w-fit rounded-lg text-xs font-semibold uppercase tracking-widest
                            ${mod.environment === 'production' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}
                        `}>
                            {mod.environment}
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* General Configuration */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-8">General Configuration</h3>

                    <div className="space-y-8">
                        {/* Module Status Header */}
                        <div className="flex items-center justify-between p-6 bg-gray-50/50 border border-gray-100 rounded-2xl">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Module Status</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Module is currently active</p>
                            </div>
                            <button className="px-6 py-2.5 bg-white border border-red-100 text-red-500 text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-red-50 transition-all">
                                Disable Module
                            </button>
                        </div>

                        {/* Config Form */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Module Name</label>
                                <input type="text" value={selectedModule} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Version</label>
                                <input type="text" value="2.4.1" disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Environment</label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all">
                                    <option>Production</option>
                                    <option>Staging</option>
                                    <option>Development</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                                    <Globe className="w-3 h-3 inline mr-1 mb-0.5" /> API Endpoint
                                </label>
                                <input type="text" defaultValue="https://api.brickbanq.com/v2" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                                    <Database className="w-3 h-3 inline mr-1 mb-0.5" /> Database Connection
                                </label>
                                <input type="text" defaultValue="brickbanq-prod-au-east" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Maximum Users</label>
                                <input type="number" defaultValue="5000" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                                Save Changes
                            </button>
                            <button className="px-8 py-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all">
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column Features & Quick Links */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Features Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-8">Features</h3>
                        <div className="space-y-3">
                            {['Deals', 'Auctions', 'Contracts', 'Escrow', 'KYC'].map((feature) => (
                                <div key={feature} className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl group cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-100 transition-all">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest group-hover:text-indigo-600">{feature}</span>
                                    <Settings className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* System Wide Card */}
            <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-10">System-Wide Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {[
                        { label: 'Email', sub: 'Configure SMTP and email templates', icon: Mail },
                        { label: 'Notifications', sub: 'Manage notification settings', icon: Bell },
                        { label: 'Security', sub: 'Security and authentication', icon: Shield },
                        { label: 'Backups', sub: 'Automated backup schedule', icon: HardDrive }
                    ].map((item) => (
                        <div key={item.label} className="group flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-indigo-100 transition-all duration-500 mb-6">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">{item.label}</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed px-4">{item.sub}</p>
                            <button className="w-full py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold uppercase tracking-widest text-gray-900 hover:bg-white hover:shadow-lg transition-all">
                                Configure
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
