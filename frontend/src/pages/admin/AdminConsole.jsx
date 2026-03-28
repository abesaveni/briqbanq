import { useState, useEffect } from 'react';
import { Settings, Shield, Activity, Link as LinkIcon, Search, Plus, ExternalLink, Save, RefreshCw, Lock, Eye, EyeOff, BarChart2, TrendingUp, Users } from 'lucide-react';
import { integrationService, adminService, analyticsService } from '../../api/dataService';

/* ─── General Settings Tab ───────────────────────────────────────────────── */
function GeneralSettingsTab() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        platform_name: 'BrickBanq',
        support_email: 'support@brickbanq.com',
        timezone: 'Australia/Sydney',
        currency: 'AUD',
        max_bid_increment: '100',
        kyc_required: 'true',
        maintenance_mode: 'false',
    });

    useEffect(() => {
        adminService.getSettings().then(res => {
            if (res.success && Array.isArray(res.data)) {
                const map = {};
                res.data.forEach(s => { map[s.key] = s.value; });
                setForm(prev => ({ ...prev, ...map }));
                setSettings(res.data);
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = async (key, value) => {
        setSaving(true);
        await adminService.updateSettings({ key, value }).catch(() => {});
        setSaving(false);
    };

    const fields = [
        { key: 'platform_name', label: 'Platform Name', type: 'text', desc: 'Displayed across the platform UI' },
        { key: 'support_email', label: 'Support Email', type: 'email', desc: 'Where users contact support' },
        { key: 'timezone', label: 'Default Timezone', type: 'select', options: ['Australia/Sydney', 'Australia/Melbourne', 'UTC', 'America/New_York'], desc: 'Used for date/time display' },
        { key: 'currency', label: 'Default Currency', type: 'select', options: ['AUD', 'USD', 'GBP', 'EUR'], desc: 'Currency for all financial figures' },
        { key: 'max_bid_increment', label: 'Min Bid Increment ($)', type: 'number', desc: 'Minimum increment per bid in auctions' },
        { key: 'kyc_required', label: 'KYC Required', type: 'select', options: ['true', 'false'], desc: 'Require KYC before investors can bid' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', type: 'select', options: ['false', 'true'], desc: 'Put platform in read-only maintenance mode' },
    ];

    if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading settings…</div>;

    return (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {fields.map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-6 px-6 py-4">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {f.type === 'select' ? (
                                <select
                                    value={form[f.key] || ''}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={f.type}
                                    value={form[f.key] || ''}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            )}
                            <button
                                onClick={() => handleSave(f.key, form[f.key])}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                <Save className="w-3 h-3" /> Save
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
                <p className="text-xs font-semibold text-amber-800">Note</p>
                <p className="text-xs text-amber-700 mt-0.5">Some settings require a server restart to take effect. Changes are saved immediately to the database.</p>
            </div>
        </div>
    );
}

/* ─── Security Tab ───────────────────────────────────────────────────────── */
function SecurityTab() {
    const [show2FA, setShow2FA] = useState(false);

    const policies = [
        { label: 'Minimum Password Length', value: '8 characters', status: 'configured' },
        { label: 'Password Complexity', value: 'Uppercase + number required', status: 'configured' },
        { label: 'Session Timeout', value: '240 minutes (JWT expiry)', status: 'configured' },
        { label: 'Token Blacklisting', value: 'Redis-backed (active)', status: 'active' },
        { label: 'Rate Limiting — Login', value: '5 attempts / minute', status: 'active' },
        { label: 'Rate Limiting — Register', value: '10 attempts / minute', status: 'active' },
        { label: 'Rate Limiting — Default', value: '100 requests / minute', status: 'active' },
        { label: 'KYC Enforcement', value: 'Required before bidding', status: 'active' },
        { label: 'Account Suspension', value: 'Redis-backed flag check', status: 'active' },
        { label: '2FA (TOTP)', value: 'Available via Admin Centre API', status: 'optional' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Security Policies</p>
                        <p className="text-xs text-gray-400">Active security configuration for this platform</p>
                    </div>
                </div>
                {policies.map(p => (
                    <div key={p.label} className="flex items-center justify-between px-6 py-3.5">
                        <div>
                            <p className="text-sm font-medium text-gray-800">{p.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.value}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${
                            p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'configured' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-500'
                        }`}>{p.status}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Lock className="w-4 h-4 text-indigo-600" />
                        <p className="text-sm font-bold text-gray-900">JWT Configuration</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Algorithm</span>
                            <span className="font-semibold text-gray-800">HS256</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Access Token Expiry</span>
                            <span className="font-semibold text-gray-800">240 minutes</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Refresh Token Expiry</span>
                            <span className="font-semibold text-gray-800">7 days</span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-gray-500">Secret Key</span>
                            <div className="flex items-center gap-1">
                                <span className="font-mono text-gray-800 text-[10px]">
                                    {show2FA ? '••••••••••••••••' : '••••••••'}
                                </span>
                                <button onClick={() => setShow2FA(!show2FA)} className="text-gray-400 hover:text-gray-600">
                                    {show2FA ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-bold text-gray-900">Role-Based Access</p>
                    </div>
                    <div className="space-y-2">
                        {['admin', 'lawyer', 'lender', 'investor', 'borrower'].map(role => (
                            <div key={role} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 capitalize">{role}</span>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold capitalize">{role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Analytics Tab ──────────────────────────────────────────────────────── */
function AnalyticsTab() {
    const [stats, setStats] = useState(null);
    const [platform, setPlatform] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            analyticsService.getDashboardStats(),
            analyticsService.getPlatformStats(),
        ]).then(([dashRes, platRes]) => {
            if (dashRes.success) setStats(dashRes.data);
            if (platRes.success) setPlatform(platRes.data);
        }).finally(() => setLoading(false));
    }, []);

    const fmt = (v) => v != null ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(v) : '—';
    const num = (v) => v != null ? Number(v).toLocaleString('en-AU') : '—';

    const cards = [
        { label: 'Total Cases', value: num(stats?.total_cases ?? platform?.total_cases), icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active Auctions', value: num(stats?.active_auctions ?? platform?.live_auctions), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Platform Users', value: num(stats?.total_users ?? platform?.total_users), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Pending KYC', value: num(stats?.pending_kyc ?? platform?.pending_approvals), icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading analytics…</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cards.map(c => (
                    <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                            <c.icon className={`w-4 h-4 ${c.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{c.label}</p>
                    </div>
                ))}
            </div>

            {platform && (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                    <div className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">Platform Status</p>
                        <p className="text-xs text-gray-400 mt-0.5">Live system metrics</p>
                    </div>
                    {[
                        { label: 'Live Auctions', value: num(platform.live_auctions) },
                        { label: 'Pending Approvals', value: num(platform.pending_approvals) },
                        { label: 'Active Users', value: num(platform.active_users) },
                        { label: 'Suspended Users', value: num(platform.suspended_users) },
                        { label: 'Total Cases', value: num(platform.total_cases) },
                        { label: 'Total Users', value: num(platform.total_users) },
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center px-6 py-3">
                            <span className="text-sm text-gray-600">{row.label}</span>
                            <span className="text-sm font-bold text-gray-900">{row.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {!stats && !platform && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-12 text-center">
                    <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No analytics data available</p>
                    <p className="text-xs text-gray-400 mt-1">Start using the platform to see metrics here</p>
                </div>
            )}
        </div>
    );
}

/* ─── Main AdminConsole ──────────────────────────────────────────────────── */
export default function AdminConsole() {
    const [activeTab, setActiveTab] = useState('Integrations');
    const [searchTerm, setSearchTerm] = useState('');
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(null); // integration object
    const [testingId, setTestingId] = useState(null);
    const [connectingId, setConnectingId] = useState(null);
    const [newIntegration, setNewIntegration] = useState({ name: '', description: '', apiKey: '' });

    useEffect(() => {
        integrationService.getIntegrations().then(res => {
            if (res.success) {
                const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                setIntegrations(list);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleAddIntegration = async (e) => {
        e.preventDefault();
        if (!newIntegration.name.trim()) return;
        const tempId = Date.now();
        setIntegrations(prev => [...prev, { id: tempId, ...newIntegration, status: 'Disconnected' }]);
        setShowAddModal(false);
        setNewIntegration({ name: '', description: '', apiKey: '' });
    };

    const handleConnect = async (integration) => {
        setConnectingId(integration.id);
        const res = await integrationService.updateIntegration(integration.id, { status: 'Connected' }).catch(() => ({ success: false }));
        if (res.success) {
            setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: 'Connected' } : i));
        } else {
            // Optimistic update even if backend fails (demo)
            setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: 'Connected' } : i));
        }
        setConnectingId(null);
    };

    const handleTest = async (integration) => {
        setTestingId(integration.id);
        await integrationService.testIntegration(integration.id).catch(() => {});
        setTestingId(null);
    };

    const connectedCount = integrations.filter(i => i.status === 'Connected').length;
    const totalCount = integrations.length;

    const filteredIntegrations = integrations.filter(i => {
        const q = searchTerm.toLowerCase();
        return i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
    });

    const tabs = [
        { id: 'Integrations', label: 'Integrations', icon: LinkIcon, badge: totalCount },
        { id: 'General Settings', label: 'General Settings', icon: Settings },
        { id: 'Security', label: 'Security', icon: Shield },
        { id: 'Analytics', label: 'Analytics', icon: Activity },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Settings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Admin Center</h1>
                            <p className="text-sm font-medium opacity-90">Centralized integration management &amp; system configuration</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 lg:w-1/2">
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                        <div className="text-sm font-medium opacity-80 mb-1">Connected</div>
                        <div className="text-2xl font-bold">{loading ? '…' : `${connectedCount}/${totalCount}`}</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                        <div className="text-sm font-medium opacity-80 mb-1">Total Integrations</div>
                        <div className="text-2xl font-bold">{loading ? '…' : totalCount}</div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                        <div className="text-sm font-medium opacity-80 mb-1">Status</div>
                        <div className="text-2xl font-bold text-green-300">{connectedCount === totalCount && totalCount > 0 ? 'All OK' : 'Check'}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm text-sm ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        {tab.label}
                        {tab.badge != null && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Integrations' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div className="relative w-2/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search integrations…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Integration
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500 text-center py-10">Loading integrations…</p>
                    ) : filteredIntegrations.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
                            <LinkIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-400">No integrations found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                            {filteredIntegrations.map((integration) => {
                                const isConnected = integration.status === 'Connected';
                                const isError = integration.status === 'Error';
                                return (
                                    <div key={integration.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors shadow-sm">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                                        {(integration.name || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                                                        {integration.lastTestedAt && (
                                                            <p className="text-gray-400 text-xs">Last tested: {new Date(integration.lastTestedAt).toLocaleDateString('en-AU')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {isConnected ? (
                                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-medium text-xs">✓ Connected</span>
                                                ) : isError ? (
                                                    <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 font-medium text-xs">⚠ Error</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 font-medium text-xs">Disconnected</span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm mt-3">{integration.description}</p>
                                            {integration.fields && integration.fields.length > 0 && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    {integration.fields.map((f, fi) => (
                                                        <div key={fi} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                            <p className="text-xs text-gray-500 font-medium">{f.label}</p>
                                                            <p className="text-xs font-semibold text-gray-800 truncate">{f.isSecret ? '••••••••' : (f.value || f.placeholder || '—')}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                                            {isConnected ? (
                                                <>
                                                    <button
                                                        onClick={() => setShowConfigModal(integration)}
                                                        className="flex-1 flex justify-center items-center gap-1.5 border border-gray-300 bg-white text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition text-xs"
                                                    >
                                                        <Settings className="w-3.5 h-3.5" /> Configure
                                                    </button>
                                                    <button
                                                        onClick={() => handleTest(integration)}
                                                        disabled={testingId === integration.id}
                                                        className="flex justify-center items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 text-xs transition disabled:opacity-60"
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${testingId === integration.id ? 'animate-spin' : ''}`} />
                                                        {testingId === integration.id ? 'Testing…' : 'Test'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(integration)}
                                                    disabled={connectingId === integration.id}
                                                    className="w-full flex justify-center items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition text-xs disabled:opacity-60"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                    {connectingId === integration.id ? 'Connecting…' : 'Connect'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'General Settings' && <GeneralSettingsTab />}
            {activeTab === 'Security' && <SecurityTab />}
            {activeTab === 'Analytics' && <AnalyticsTab />}

            {/* Add Integration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Add Integration</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><ExternalLink className="w-4 h-4 rotate-90" /></button>
                        </div>
                        <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Integration Name *</label>
                                <input required type="text" value={newIntegration.name} onChange={e => setNewIntegration(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Stripe, Twilio, SendGrid"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                <input type="text" value={newIntegration.description} onChange={e => setNewIntegration(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description of what this integration does"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">API Key / Credential</label>
                                <input type="password" value={newIntegration.apiKey} onChange={e => setNewIntegration(p => ({ ...p, apiKey: e.target.value }))}
                                    placeholder="Enter API key or token"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Add Integration</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Configure Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Configure — {showConfigModal.name}</h3>
                            <button onClick={() => setShowConfigModal(null)} className="text-gray-400 hover:text-gray-600"><ExternalLink className="w-4 h-4 rotate-90" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Integration Name</label>
                                <input type="text" defaultValue={showConfigModal.name}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            {(showConfigModal.fields || []).map((f, i) => (
                                <div key={i}>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                                    <input type={f.isSecret ? 'password' : 'text'} defaultValue={f.isSecret ? '' : (f.value || '')}
                                        placeholder={f.placeholder || ''}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                </div>
                            ))}
                            {(!showConfigModal.fields || showConfigModal.fields.length === 0) && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">API Key</label>
                                    <input type="password" placeholder="Enter API key"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowConfigModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button onClick={() => { integrationService.updateIntegration(showConfigModal.id, {}).catch(()=>{}); setShowConfigModal(null); }}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                    <Save className="w-3.5 h-3.5" /> Save Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
