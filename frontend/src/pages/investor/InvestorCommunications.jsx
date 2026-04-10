import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Send, Settings, Plus, Eye, Edit2, Copy, Trash2,
    Users, BarChart2, FileText, ChevronRight, Search, Filter,
    ArrowUpRight, Clock, CheckCircle2, AlertCircle, Calendar,
    ChevronDown, MoreHorizontal, Layout, Zap, Rocket, ChevronLeft, X, Activity, ArrowLeft
} from "lucide-react";
import { communicationService } from '../../api/dataService';

export default function InvestorCommunications() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [templates, setTemplates] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [segments, setSegments] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
    const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tRes, cRes, sRes, aRes] = await Promise.all([
                    communicationService.getTemplates(),
                    communicationService.getCampaigns(),
                    communicationService.getSegments(),
                    communicationService.getAnalytics()
                ]);

                if (tRes.success) setTemplates(tRes.data || []);
                if (cRes.success) setCampaigns(cRes.data || []);
                if (sRes.success) setSegments(sRes.data || []);
                if (aRes.success) setAnalytics(aRes.data);
            } catch (err) {
                console.error("Failed to fetch comms data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDeleteTemplate = (id) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
    };

    const handleDeleteCampaign = (id) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
    };

    const handleDeleteSegment = (id) => {
        setSegments(prev => prev.filter(s => s.id !== id));
    };

    const handleAddTemplate = (newTemp) => {
        setTemplates(prev => [{ ...newTemp, id: Date.now(), used: 0, modified: 'Just now' }, ...prev]);
        setShowNewTemplateModal(false);
    };

    const handleAddCampaign = (newCamp) => {
        setCampaigns(prev => [{ ...newCamp, id: Date.now(), status: 'scheduled', date: new Date().toISOString().split('T')[0] }, ...prev]);
        setShowNewCampaignModal(false);
    };

    const handleAddSegment = (newSeg) => {
        setSegments(prev => [{ ...newSeg, id: Date.now(), count: 0, bg: 'bg-blue-50', color: 'text-blue-600' }, ...prev]);
        setShowNewSegmentModal(false);
    };

    const tabs = [
        { id: 'Overview', icon: <Layout size={16} /> },
        { id: 'Templates', icon: <FileText size={16} /> },
        { id: 'Campaigns', icon: <Send size={16} /> },
        { id: 'Segments', icon: <Users size={16} /> },
        { id: 'Analytics', icon: <BarChart2 size={16} /> }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-indigo-600 animate-pulse">
                    <Mail size={40} />
                    <p className="text-xs font-bold uppercase tracking-[0.2em]">Loading Investor Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pt-0 pb-10 max-w-[1240px] mx-auto px-6">
            {/* Context Header */}
            <div className="flex items-center justify-between py-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Investor Communications</h2>
                    <p className="text-gray-500 font-medium mt-1">Manage your outreach, investment updates, and partner engagement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/investor/settings')}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                    <button
                        onClick={() => setShowNewCampaignModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Send size={16} />
                        Launch Campaign
                    </button>
                </div>
            </div>

            {/* Sticky Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 mb-8 -mx-6 px-6">
                <div className="flex items-center gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 text-sm font-semibold transition-all relative flex items-center gap-2 ${activeTab === tab.id
                                    ? 'text-indigo-600'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.id}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'Overview' && (
                    <OverviewTab
                        templates={templates}
                        campaigns={campaigns}
                        segments={segments}
                        analytics={analytics}
                        setActiveTab={setActiveTab}
                        onNewCampaign={() => setShowNewCampaignModal(true)}
                        onNewTemplate={() => setShowNewTemplateModal(true)}
                        onNewSegment={() => setShowNewSegmentModal(true)}
                        onDeleteCampaign={handleDeleteCampaign}
                    />
                )}
                {activeTab === 'Templates' && (
                    <TemplatesTab
                        templates={templates}
                        onDelete={handleDeleteTemplate}
                        setShowNewTemplateModal={setShowNewTemplateModal}
                    />
                )}
                {activeTab === 'Campaigns' && (
                    <CampaignsTab
                        campaigns={campaigns}
                        onDelete={handleDeleteCampaign}
                        onAddNew={() => setShowNewCampaignModal(true)}
                    />
                )}
                {activeTab === 'Segments' && (
                    <SegmentsTab
                        segments={segments}
                        onDelete={handleDeleteSegment}
                        onAddNew={() => setShowNewSegmentModal(true)}
                    />
                )}
                {activeTab === 'Analytics' && <AnalyticsTab analytics={analytics} />}
            </div>

            {/* Modals */}
            {showNewTemplateModal && (
                <NewTemplateModal
                    onClose={() => setShowNewTemplateModal(false)}
                    onSave={handleAddTemplate}
                />
            )}
            {showNewCampaignModal && (
                <NewCampaignModal
                    onClose={() => setShowNewCampaignModal(false)}
                    onSave={handleAddCampaign}
                    templates={templates}
                    segments={segments}
                />
            )}
            {showNewSegmentModal && (
                <NewSegmentModal
                    onClose={() => setShowNewSegmentModal(false)}
                    onSave={handleAddSegment}
                />
            )}
        </div>
    );
}

function OverviewTab({
    templates = [], campaigns = [], segments = [], analytics,
    setActiveTab, onNewCampaign, onNewTemplate, onNewSegment, onDeleteCampaign
}) {
    const stats = [
        { label: 'Total Templates', value: templates?.length || 0, sub: `${templates?.length || 0} active`, icon: <FileText className="text-blue-500" />, bg: 'bg-blue-50/50' },
        { label: 'Active Campaigns', value: (campaigns || []).filter(c => c?.status === 'sending' || c?.status === 'scheduled').length, sub: `${(campaigns || []).filter(c => c?.status === 'scheduled' || c?.status === 'sending').length} active`, icon: <Send className="text-emerald-500" />, bg: 'bg-emerald-50/50' },
        { label: 'User Segments', value: segments?.length || 0, sub: `${segments?.reduce((acc, s) => acc + (s.count || 0), 0).toLocaleString()} contacts`, icon: <Users className="text-purple-500" />, bg: 'bg-purple-50/50' },
        { label: 'Avg Open Rate', value: '78%', sub: '↑ 12% vs last month', icon: <BarChart2 className="text-orange-500" />, bg: 'bg-orange-50/50' }
    ];

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                {React.cloneElement(stat.icon, { size: 20 })}
                            </div>
                            <span className={`text-xs font-bold ${stat.label === 'Avg Open Rate' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {stat.sub.split(' ')[0]}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Campaigns</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Performance tracking for latest outreach</p>
                    </div>
                    <button
                        onClick={onNewCampaign}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={16} />
                        New Campaign
                    </button>
                </div>
                <div className="p-2 space-y-1">
                    {campaigns?.slice(0, 3).map((campaign) => (
                        <div key={campaign.id} className="p-2 rounded-lg border border-transparent hover:bg-gray-50/50 transition-all flex items-center justify-between group">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-sm font-semibold text-slate-900">{campaign.name || campaign.title}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${campaign.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                            campaign.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {campaign.status}
                                    </span>
                                </div>
                                <p className="text-[11px] font-medium text-gray-400">{campaign.recipients} recipients • {campaign.category || campaign.type}</p>
                                {campaign.status === 'sent' && (
                                    <div className="flex items-center gap-4 mt-1.5">
                                        <span className="text-xs font-semibold text-gray-400">Open Rate: <span className="text-emerald-500">{campaign.openRate}%</span></span>
                                        <span className="text-xs font-semibold text-gray-400">Click Rate: <span className="text-blue-500">{campaign.clickRate}%</span></span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><Eye size={16} /></button>
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><BarChart2 size={16} /></button>
                                <button
                                    onClick={() => onDeleteCampaign(campaign.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Creation Hub</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={onNewCampaign}
                        className="bg-indigo-600 h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 group hover:bg-indigo-700 transition-all shadow-lg"
                    >
                        <Send size={20} className="text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">New Campaign</span>
                    </button>
                    <button
                        onClick={onNewTemplate}
                        className="bg-white border border-gray-200 h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 group hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FileText size={20} className="text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">New Template</span>
                    </button>
                    <button
                        onClick={onNewSegment}
                        className="bg-white border border-gray-200 h-[80px] rounded-2xl flex flex-col items-center justify-center gap-2 group hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Users size={20} className="text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">New Segment</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function CampaignsTab({ campaigns = [], onDelete, onAddNew }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const statuses = ['All', 'sent', 'scheduled', 'draft', 'sending'];

    const filteredCampaigns = (campaigns || []).filter(c => {
        const title = c?.name || c?.title || "";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || c?.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Email Campaigns</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Unified messaging across your network</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                >
                    <Plus size={18} />
                    Launch Campaign
                </button>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaigns..."
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-gray-200">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${selectedStatus === status
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filteredCampaigns?.map((camp) => (
                    <div key={camp.id} className="p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-all group bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-sm font-semibold text-slate-900">{camp.name || camp.title}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${camp.status === 'sent' ? 'bg-emerald-50 text-emerald-600' :
                                            camp.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                                                camp.status === 'sending' ? 'bg-indigo-50 text-indigo-600' :
                                                    'bg-gray-100 text-gray-400'
                                        }`}>
                                        {camp.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Users size={12} />
                                        <span className="text-[11px] font-medium">{camp.recipients?.toLocaleString()} Recipients</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <FileText size={12} />
                                        <span className="text-[11px] font-medium">{camp.category || camp.type}</span>
                                    </div>
                                    {camp.date && (
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar size={12} />
                                            <span className="text-[11px] font-medium">{camp.status === 'sent' ? 'Sent' : 'Scheduled'} {camp.date}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Eye size={16} /></button>
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><BarChart2 size={16} /></button>
                                <button
                                    onClick={() => onDelete(camp.id)}
                                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SegmentsTab({ segments = [], onDelete, onAddNew }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSegments = (segments || []).filter(s =>
        (s?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s?.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Audience Segments</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Targeted groups based on live behavior and roles</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onAddNew}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                    >
                        <Plus size={18} />
                        Define Segment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSegments.map((seg, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${seg.bg || 'bg-blue-50'} ${seg.color || 'text-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 truncate">{seg.title}</h4>
                                <p className="text-[11px] font-semibold text-blue-600">{(seg.count || 0).toLocaleString()} Members</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                                <button
                                    onClick={() => onDelete(seg.id)}
                                    className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 line-clamp-2">{seg.desc}</p>
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Criteria</p>
                            <p className="text-[11px] font-medium text-gray-600 italic">{seg.criteria}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 py-2.5 border border-gray-100 rounded-xl text-[11px] font-semibold text-slate-900 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                <Eye size={14} /> View List
                            </button>
                            <button className="flex-1 py-2.5 bg-gray-50 text-slate-900 rounded-xl text-[11px] font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                                <Send size={14} /> Targeted Msg
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AnalyticsTab({ analytics }) {
    if (!analytics) return null;

    const metrics = [
        {
            label: 'Total Emails Sent',
            value: analytics.totalSent?.toLocaleString() || '0',
            change: '↑ 24% from last month',
            color: 'text-emerald-500'
        },
        {
            label: 'Average Open Rate',
            value: `${analytics.avgOpenRate}%`,
            change: '↑ 12% from last month',
            color: 'text-emerald-500'
        },
        {
            label: 'Average Click Rate',
            value: `${analytics.avgClickRate}%`,
            change: '↑ 8% from last month',
            color: 'text-emerald-500'
        }
    ];

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-slate-200/50 p-8 md:p-10 animate-fade-in relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Communication Analytics</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">Deep insights into your investor outreach performance</p>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-gray-200">
                    {['Daily', 'Weekly', 'Monthly'].map(period => (
                        <button key={period} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === 'Weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{period}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {metrics.map((metric, i) => (
                    <div key={i} className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[28px] border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{metric.label}</p>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Activity size={16} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mb-2">{metric.value}</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-emerald-500 font-bold text-xs">
                                <ArrowUpRight size={14} />
                                12.4%
                            </span>
                            <span className="text-xs text-slate-400 font-medium">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Engagement Trends Chart */}
                <div className="bg-slate-50/50 rounded-[32px] border border-gray-200 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Engagement Trends</h4>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opens</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clicks</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[200px] flex items-end justify-between gap-3 px-2">
                        {[45, 78, 56, 89, 65, 92, 74].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                                <div className="w-full flex gap-1 items-end h-[160px]">
                                    <div
                                        className="flex-1 bg-indigo-500/80 rounded-t-lg group-hover:bg-indigo-600 transition-all duration-500 shadow-sm"
                                        style={{ height: `${val}%` }}
                                    ></div>
                                    <div
                                        className="flex-1 bg-emerald-400/80 rounded-t-lg group-hover:bg-emerald-500 transition-all duration-500 shadow-sm"
                                        style={{ height: `${val * 0.6}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Device Distribution Chart */}
                <div className="bg-slate-50/50 rounded-[32px] border border-gray-200 p-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-8">Device Distribution</h4>
                    <div className="flex items-center justify-around h-[200px]">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#F1F5F9" strokeWidth="4" />
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent" stroke="#6366F1" strokeWidth="4"
                                    strokeDasharray="65 100" strokeDashoffset="0" className="transition-all duration-1000"
                                />
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent" stroke="#10B981" strokeWidth="4"
                                    strokeDasharray="25 100" strokeDashoffset="-65" className="transition-all duration-1000"
                                />
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent" stroke="#F59E0B" strokeWidth="4"
                                    strokeDasharray="10 100" strokeDashoffset="-90" className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-2xl font-bold text-slate-900 leading-none">100%</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Verified</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {[
                                { label: 'Desktop', val: '65%', color: 'bg-indigo-500' },
                                { label: 'Mobile', val: '25%', color: 'bg-emerald-500' },
                                { label: 'Tablet', val: '10%', color: 'bg-amber-500' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between min-w-[120px]">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-900">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none"></div>
        </div>
    );
}

function TemplatesTab({ templates = [], setShowNewTemplateModal, onDelete }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');

    const tags = ['All', 'Onboarding', 'Marketing', 'Transactional', 'Billing', 'Operations'];

    const filteredTemplates = (templates || []).filter(t => {
        const title = t?.name || t?.title || "";
        const desc = t?.desc || "";
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            desc.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === 'All' || (t?.category || t?.tag) === selectedTag;
        return matchesSearch && matchesTag;
    });

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-3 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Email Templates</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Manage your standardized baseline messaging</p>
                </div>
                <button
                    onClick={() => setShowNewTemplateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                >
                    <Plus size={18} />
                    New Template
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:bg-white outline-none transition-all placeholder:text-gray-300"
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-gray-200 overflow-x-auto no-scrollbar">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedTag === tag
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((temp) => (
                    <div key={temp.id} className="p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-all bg-white group shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <FileText size={16} />
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg transition-colors"><Eye size={16} /></button>
                                <button className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg transition-colors" onClick={() => onDelete(temp.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">{temp.name || temp.title}</h4>
                                <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">{temp.category || temp.tag}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{temp.desc}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usage: {temp.usage || temp.used} Ops</span>
                                <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Plus size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NewTemplateModal({ onClose, onSave }) {
    const [form, setForm] = useState({ title: '', tag: 'Marketing', desc: '' });

    const handleSubmit = () => {
        if (!form.title) return;
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Create New Template</h3>
                        <p className="text-[11px] font-medium text-gray-400 italic">Standardize your outreach design</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Template Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Q1 Investor Recap"
                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-200 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category Tag</label>
                        <select
                            value={form.tag}
                            onChange={e => setForm({ ...form, tag: e.target.value })}
                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none focus:bg-white"
                        >
                            <option>Marketing</option>
                            <option>Onboarding</option>
                            <option>Transactional</option>
                            <option>Billing</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Baseline Description</label>
                        <textarea
                            value={form.desc}
                            onChange={e => setForm({ ...form, desc: e.target.value })}
                            placeholder="Briefly describe the purpose..."
                            className="w-full h-24 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-medium outline-none focus:bg-white resize-none"
                        ></textarea>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-gray-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        Create Template
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewCampaignModal({ onClose, onSave, templates = [], segments = [] }) {
    const [form, setForm] = useState({ title: '', template: '', segment: '', schedule: 'now' });

    const handleSubmit = () => {
        if (!form.title) return;
        const selectedTemplate = templates.find(t => t.title === form.template) || templates[0];
        onSave({
            ...form,
            type: selectedTemplate?.title || 'Custom',
            recipients: segments.find(s => s.title === form.segment)?.count || 0
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Launch New Campaign</h3>
                        <p className="text-[11px] font-medium text-gray-400 italic">Engage your audience with targeted messaging</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Campaign Name</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Spring Deals Alert"
                            className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none focus:bg-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Template</label>
                            <select
                                onChange={e => setForm({ ...form, template: e.target.value })}
                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none"
                            >
                                <option value="">Choose Template...</option>
                                {templates.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Target Segment</label>
                            <select
                                onChange={e => setForm({ ...form, segment: e.target.value })}
                                className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium outline-none"
                            >
                                <option value="">Choose Audience...</option>
                                {segments.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Schedule</label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="sched"
                                    checked={form.schedule === 'now'}
                                    onChange={() => setForm({ ...form, schedule: 'now' })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 transition-all focus:ring-offset-2"
                                />
                                <span className="text-sm font-semibold text-gray-600 group-hover:text-slate-900">Send Now</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group opacity-60 hover:opacity-100 transition-all">
                                <input
                                    type="radio"
                                    name="sched"
                                    checked={form.schedule === 'later'}
                                    onChange={() => setForm({ ...form, schedule: 'later' })}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 focus:ring-offset-2"
                                />
                                <span className="text-sm font-semibold text-gray-500 group-hover:text-slate-900">Schedule for later</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50/50 border-t border-gray-200 flex items-center justify-between">
                    <button onClick={onClose} className="text-sm font-bold text-indigo-600 hover:underline">Save as Draft</button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            Launch Campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NewSegmentModal({ onClose, onSave }) {
    const [form, setForm] = useState({ title: '', desc: '', criteria: 'User Role equals Investor' });

    const handleSubmit = () => {
        if (!form.title) return;
        onSave(form);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Define Segment</h3>
                        <p className="text-xs text-slate-400 font-medium">Group users based on specific criteria</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Segment Name</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Active Investors"
                            className="w-full h-11 bg-slate-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:bg-white focus:border-indigo-200 transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                        <textarea
                            value={form.desc}
                            onChange={e => setForm({ ...form, desc: e.target.value })}
                            placeholder="Briefly describe this audience..."
                            className="w-full h-20 bg-slate-50 border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:bg-white resize-none"
                        ></textarea>
                    </div>
                    <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                        <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Rules & Refinement</p>
                        <div className="flex items-center gap-3">
                            <select className="flex-1 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10">
                                <option>User Role</option>
                                <option>Account Status</option>
                                <option>Last Activity</option>
                            </select>
                            <input type="text" placeholder="value" className="w-24 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none" />
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-center">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Est. Reach: ~247 users</p>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-slate-50/30">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                        Create Segment
                    </button>
                </div>
            </div>
        </div>
    );
}
