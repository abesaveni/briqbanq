import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Send, Settings, Plus, Eye, Edit2, Copy, Trash2,
    Users, BarChart2, FileText, ChevronRight, Search, Filter,
    ArrowUpRight, Clock, CheckCircle2, AlertCircle, Calendar,
    ChevronDown, MoreHorizontal, Layout, Zap, Rocket, ChevronLeft, X, Activity, ArrowLeft
} from "lucide-react";
import { communicationService } from '../../api/dataService';

export default function LenderCommunications() {
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
    const [viewingCampaign, setViewingCampaign] = useState(null);

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

    const handleDeleteTemplate = async (id) => {
        setTemplates(prev => prev.filter(t => t.id !== id));
        await communicationService.deleteTemplate(id);
    };

    const handleDeleteCampaign = async (id) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        await communicationService.deleteCampaign(id);
    };

    const handleDeleteSegment = async (id) => {
        setSegments(prev => prev.filter(s => s.id !== id));
        await communicationService.deleteSegment(id);
    };

    const handleAddTemplate = async (newTemp) => {
        setShowNewTemplateModal(false);
        const res = await communicationService.createTemplate({ title: newTemp.title, desc: newTemp.desc, tag: newTemp.tag });
        if (res.success) {
            setTemplates(prev => [res.data, ...prev]);
        } else {
            setTemplates(prev => [{ ...newTemp, id: Date.now(), used: 0, modified: 'Just now' }, ...prev]);
        }
    };

    const handleAddCampaign = async (newCamp) => {
        setShowNewCampaignModal(false);
        const res = await communicationService.createCampaign({
            title: newCamp.title || newCamp.name,
            status: newCamp.schedule === 'now' ? 'sending' : 'scheduled',
            recipients: newCamp.recipients || 0,
            type: newCamp.type,
            date: new Date().toISOString().split('T')[0],
        });
        if (res.success) {
            setCampaigns(prev => [res.data, ...prev]);
        } else {
            setCampaigns(prev => [{ ...newCamp, id: Date.now(), status: 'scheduled', date: new Date().toISOString().split('T')[0] }, ...prev]);
        }
    };

    const handleAddSegment = async (newSeg) => {
        setShowNewSegmentModal(false);
        const res = await communicationService.createSegment({ title: newSeg.title, desc: newSeg.desc, criteria: newSeg.criteria, count: 0 });
        if (res.success) {
            setSegments(prev => [res.data, ...prev]);
        } else {
            setSegments(prev => [{ ...newSeg, id: Date.now(), count: 0, bg: 'bg-blue-50', color: 'text-blue-600' }, ...prev]);
        }
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
                <div className="flex flex-col items-center gap-4 text-blue-600 animate-pulse">
                    <Mail size={40} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Loading Communication Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-6">
            {/* Context Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Client Communications</h1>
                    <p className="text-sm text-slate-500">Manage templates, campaigns, and audience segments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/lender/settings')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                    <button
                        onClick={() => setShowNewCampaignModal(true)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                        <Plus size={16} />
                        Create New Campaign
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.id}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="space-y-4">
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
                        onViewCampaign={setViewingCampaign}
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
                        onView={setViewingCampaign}
                    />
                )}
                {activeTab === 'Segments' && (
                    <SegmentsTab
                        segments={segments}
                        onDelete={handleDeleteSegment}
                        onAddNew={() => setShowNewSegmentModal(true)}
                        onLaunchCampaign={(seg) => {
                            setShowNewCampaignModal(true);
                        }}
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
            {viewingCampaign && (
                <CampaignDetailModal
                    campaign={viewingCampaign}
                    onClose={() => setViewingCampaign(null)}
                />
            )}
        </div>
    );
}

function OverviewTab({
    templates = [], campaigns = [], segments = [], analytics,
    setActiveTab, onNewCampaign, onNewTemplate, onNewSegment, onDeleteCampaign, onViewCampaign
}) {
    const stats = [
        { label: 'Total Templates', value: templates?.length || 0, sub: `${templates?.length || 0} active`, icon: <FileText className="text-blue-500" />, bg: 'bg-blue-50/50' },
        { label: 'Active Campaigns', value: (campaigns || []).filter(c => c?.status === 'sending' || c?.status === 'scheduled').length, sub: `${(campaigns || []).filter(c => c?.status === 'scheduled' || c?.status === 'sending').length} active`, icon: <Send className="text-emerald-500" />, bg: 'bg-emerald-50/50' },
        { label: 'User Segments', value: segments?.length || 0, sub: `${segments?.reduce((acc, s) => acc + (s.count || 0), 0).toLocaleString()} contacts`, icon: <Users className="text-purple-500" />, bg: 'bg-purple-50/50' },
        { label: 'Avg Open Rate', value: analytics?.avgOpenRate ? `${analytics.avgOpenRate}%` : '—', sub: analytics?.avgOpenRate ? `↑ vs last month` : 'No data yet', icon: <BarChart2 className="text-orange-500" />, bg: 'bg-orange-50/50' }
    ];

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                {React.cloneElement(stat.icon, { size: 16 })}
                            </div>
                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                                    <h4 className="text-[13px] font-semibold text-slate-900">{campaign.name || campaign.title}</h4>
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
                                        <span className="text-[10px] font-semibold text-gray-400">Open Rate: <span className="text-emerald-500">{campaign.openRate}%</span></span>
                                        <span className="text-[10px] font-semibold text-gray-400">Click Rate: <span className="text-blue-500">{campaign.clickRate}%</span></span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onViewCampaign && onViewCampaign(campaign)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="View campaign"><Eye size={16} /></button>
                                <button onClick={() => setActiveTab('Analytics')} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="View analytics"><BarChart2 size={16} /></button>
                                <button
                                    onClick={() => onDeleteCampaign(campaign.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!campaigns || campaigns.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-sm font-medium">No campaigns yet. Create your first campaign above.</div>
                    )}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        onClick={onNewCampaign}
                        className="bg-indigo-600 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-indigo-700 transition-colors"
                    >
                        <Send size={16} className="text-white shrink-0" />
                        <span className="text-sm font-semibold text-white">New Campaign</span>
                    </button>
                    <button
                        onClick={onNewTemplate}
                        className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                        <FileText size={16} className="text-indigo-600 shrink-0" />
                        <span className="text-sm font-semibold text-slate-800">New Template</span>
                    </button>
                    <button
                        onClick={onNewSegment}
                        className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                        <Users size={16} className="text-indigo-600 shrink-0" />
                        <span className="text-sm font-semibold text-slate-800">New Segment</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function CampaignsTab({ campaigns = [], onDelete, onAddNew, onView }) {
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
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
                    Create New Campaign
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
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium focus:bg-white outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 max-w-full overflow-x-auto no-scrollbar">
                    {statuses.map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${selectedStatus === status
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
                                    <h4 className="text-[14px] font-semibold text-slate-900">{camp.name || camp.title}</h4>
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
                                <button onClick={() => onView && onView(camp)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View campaign"><Eye size={16} /></button>
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View analytics"><BarChart2 size={16} /></button>
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
                {filteredCampaigns.length === 0 && (
                    <div className="py-10 text-center text-slate-400 text-sm font-medium">
                        No campaigns found. Create your first campaign above.
                    </div>
                )}
            </div>
        </div>
    );
}

// Parse "Key: Value, Key2: Value2" criteria string into structured chips
function parseCriteriaChips(criteria) {
    if (!criteria) return [];
    return criteria.split(',').map(part => {
        const colonIdx = part.indexOf(':');
        if (colonIdx === -1) return { key: part.trim(), value: '' };
        return {
            key: part.slice(0, colonIdx).trim(),
            value: part.slice(colonIdx + 1).trim(),
        };
    }).filter(c => c.key);
}

function CriteriaChips({ criteria }) {
    const chips = parseCriteriaChips(criteria);
    if (!chips.length) return <p className="text-[12px] text-slate-400 italic">No filters set</p>;
    return (
        <div className="flex flex-wrap gap-2">
            {chips.map((c, i) => (
                <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{c.key}</span>
                    {c.value && (
                        <>
                            <span className="text-[10px] text-slate-300 mx-0.5">=</span>
                            <span className="text-[11px] font-semibold text-slate-700">{c.value}</span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

function SegmentsTab({ segments = [], onDelete, onAddNew, onLaunchCampaign }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingSeg, setViewingSeg] = useState(null);

    const filteredSegments = (segments || []).filter(s =>
        (s?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s?.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Audience Segments</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Targeted groups based on live behavior and roles</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                >
                    <Plus size={18} />
                    Define Segment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSegments.map((seg, i) => (
                    <div key={seg.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${seg.bg || 'bg-blue-50'} ${seg.color || 'text-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[14px] font-bold text-slate-900 truncate">{seg.title}</h4>
                                <p className={`text-[12px] font-semibold ${seg.color || 'text-blue-600'}`}>{(seg.count || 0).toLocaleString()} Members</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setViewingSeg(seg)} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg transition-colors" title="View details">
                                    <Eye size={15} />
                                </button>
                                <button onClick={() => onDelete(seg.id)} className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>

                        <p className="text-[13px] font-medium text-gray-500">{seg.desc}</p>

                        {/* Criteria as chips */}
                        <div className="pt-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Filters</p>
                            <CriteriaChips criteria={seg.criteria} />
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                            <button
                                onClick={() => setViewingSeg(seg)}
                                className="flex-1 py-2 border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Eye size={13} /> View List
                            </button>
                            <button
                                onClick={() => onLaunchCampaign && onLaunchCampaign(seg)}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[12px] font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Send size={13} /> Targeted Msg
                            </button>
                        </div>
                    </div>
                ))}
                {filteredSegments.length === 0 && (
                    <div className="col-span-2 py-10 text-center text-slate-400 text-sm font-medium">
                        No segments defined yet. Create your first audience segment above.
                    </div>
                )}
            </div>

            {/* View Segment Detail Modal */}
            {viewingSeg && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingSeg(null)} />
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                        {/* Modal header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Users size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-bold text-white">{viewingSeg.title}</h3>
                                        <p className="text-[12px] text-indigo-200 font-medium">{(viewingSeg.count || 0).toLocaleString()} members in this segment</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingSeg(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Description */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">About this Segment</p>
                                <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{viewingSeg.desc || 'No description provided.'}</p>
                            </div>

                            {/* Criteria chips */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Filter Rules</p>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <CriteriaChips criteria={viewingSeg.criteria} />
                                </div>
                            </div>

                            {/* Reach stat */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Members</p>
                                    <p className="text-[26px] font-bold text-indigo-700 leading-none">{(viewingSeg.count || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Deliverability</p>
                                    <p className="text-[26px] font-bold text-emerald-700 leading-none">~98%</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => { setViewingSeg(null); onLaunchCampaign && onLaunchCampaign(viewingSeg); }}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                                <Send size={15} /> Send Campaign
                            </button>
                            <button onClick={() => setViewingSeg(null)} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-100 transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                , document.body
            )}
        </div>
    );
}

function AnalyticsTab({ analytics }) {
    if (!analytics) return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <BarChart2 size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm font-medium">No analytics data available yet</p>
            <p className="text-slate-300 text-xs font-medium mt-1">Data will appear once campaigns have been sent</p>
        </div>
    );

    const hasSentData = analytics.totalSent > 0;

    const metrics = [
        {
            label: 'Total Recipients',
            value: analytics.totalSent != null ? analytics.totalSent.toLocaleString() : '0',
            sub: analytics.totalCampaigns != null ? `Across ${analytics.totalCampaigns} campaign${analytics.totalCampaigns !== 1 ? 's' : ''}` : 'No campaigns yet',
            color: 'text-indigo-500',
            icon: <Send size={18} className="text-indigo-500" />,
            bg: 'bg-indigo-50',
        },
        {
            label: 'Avg Open Rate',
            value: analytics.avgOpenRate != null ? `${analytics.avgOpenRate}%` : '—',
            sub: hasSentData ? 'From sent campaigns' : 'No sent campaigns yet',
            color: analytics.avgOpenRate != null ? 'text-emerald-500' : 'text-slate-400',
            icon: <Eye size={18} className="text-emerald-500" />,
            bg: 'bg-emerald-50',
        },
        {
            label: 'Avg Click Rate',
            value: analytics.avgClickRate != null ? `${analytics.avgClickRate}%` : '—',
            sub: hasSentData ? 'From sent campaigns' : 'No sent campaigns yet',
            color: analytics.avgClickRate != null ? 'text-blue-500' : 'text-slate-400',
            icon: <ArrowUpRight size={18} className="text-blue-500" />,
            bg: 'bg-blue-50',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                            <div className={`w-9 h-9 ${m.bg} rounded-xl flex items-center justify-center`}>{m.icon}</div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{m.value}</h3>
                        <p className={`text-[12px] font-semibold ${m.color}`}>{m.sub}</p>
                    </div>
                ))}
            </div>

            {/* Top templates */}
            {analytics.topTemplates && analytics.topTemplates.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h4 className="text-[14px] font-bold text-slate-900 mb-5 uppercase tracking-wider">Top Templates by Usage</h4>
                    <div className="space-y-4">
                        {analytics.topTemplates.map((t, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[13px] font-semibold text-slate-800 truncate">{t.name}</span>
                                        <span className="text-[12px] font-bold text-slate-400 ml-2 shrink-0">{(t.used || 0).toLocaleString()} uses</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(t.performance, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No sent campaigns notice */}
            {!hasSentData && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                    <Send size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-[14px] font-semibold text-slate-500">No campaigns sent yet</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-1">Open rate and click rate data will appear here once you send your first campaign.</p>
                </div>
            )}
        </div>
    );
}

function TemplatesTab({ templates = [], setTemplates, setShowNewTemplateModal, onDelete }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [viewingTemplate, setViewingTemplate] = useState(null);

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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md font-sans"
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
                        className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[12px] font-bold focus:bg-white outline-none transition-all placeholder:text-gray-300"
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 overflow-x-auto no-scrollbar">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((temp) => (
                    <div key={temp.id} className="p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-all bg-white group shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <FileText size={16} />
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setViewingTemplate(temp)} className="p-1.5 text-gray-300 hover:text-blue-600 rounded-lg transition-colors"><Eye size={16} /></button>
                                <button className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg transition-colors" onClick={() => onDelete(temp.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">{temp.name || temp.title}</h4>
                                <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">{temp.category || temp.tag}</span>
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

            {viewingTemplate && (
                <div className="fixed inset-0 z-[510] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingTemplate(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative my-auto" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">{viewingTemplate.name || viewingTemplate.title}</h3>
                            <button onClick={() => setViewingTemplate(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</span><p className="text-sm font-semibold text-slate-800 mt-1">{viewingTemplate.category || viewingTemplate.tag || '—'}</p></div>
                            <div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</span><p className="text-sm font-medium text-slate-600 mt-1">{viewingTemplate.desc || '—'}</p></div>
                            <div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usage count</span><p className="text-sm font-medium text-slate-600 mt-1">{viewingTemplate.usage || viewingTemplate.used || 0} times</p></div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100"><button onClick={() => setViewingTemplate(null)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">Close</button></div>
                    </div>
                </div>
            )}
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Colored header bar */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                <FileText size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-white">New Template</h3>
                                <p className="text-[11px] text-indigo-200 font-medium">Standardize your outreach messaging</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Template Title <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Q1 Investor Recap"
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                        <select
                            value={form.tag}
                            onChange={e => setForm({ ...form, tag: e.target.value })}
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                        >
                            <option>Marketing</option>
                            <option>Onboarding</option>
                            <option>Transactional</option>
                            <option>Billing</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                            value={form.desc}
                            onChange={e => setForm({ ...form, desc: e.target.value })}
                            placeholder="Briefly describe the purpose of this template..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                        />
                    </div>
                </div>
                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.title}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <FileText size={15} />
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
        const selectedTemplate = templates.find(t => (t.title || t.name) === form.template) || templates[0];
        onSave({
            ...form,
            name: form.title,
            type: selectedTemplate?.title || selectedTemplate?.name || 'Custom',
            recipients: segments.find(s => s.title === form.segment)?.count || 0
        });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Colored header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                <Send size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-white">Create New Campaign</h3>
                                <p className="text-[11px] text-blue-200 font-medium">Reach your audience with targeted messaging</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campaign Name <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Spring Deals Alert"
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Template</label>
                            <select
                                value={form.template}
                                onChange={e => setForm({ ...form, template: e.target.value })}
                                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                            >
                                <option value="">Choose template...</option>
                                {templates.map(t => <option key={t.id} value={t.title || t.name}>{t.title || t.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audience</label>
                            <select
                                value={form.segment}
                                onChange={e => setForm({ ...form, segment: e.target.value })}
                                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-medium outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                            >
                                <option value="">All users</option>
                                {segments.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Send Schedule</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, schedule: 'now' })}
                                className={`h-11 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${form.schedule === 'now' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                            >
                                <Send size={14} /> Send Now
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, schedule: 'later' })}
                                className={`h-11 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${form.schedule === 'later' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                            >
                                <Calendar size={14} /> Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-all">Save as Draft</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.title}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send size={15} />
                        Create & Send
                    </button>
                </div>
            </div>
        </div>
    );
}

function CampaignDetailModal({ campaign, onClose }) {
    if (!campaign) return null;
    const statusColors = {
        sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
        sending: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        draft: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    const statusCls = statusColors[campaign.status] || 'bg-gray-50 text-gray-600 border-gray-200';

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Send size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-bold text-white">{campaign.name || campaign.title}</h3>
                                <p className="text-[12px] text-indigo-200 font-medium capitalize">{campaign.status} campaign</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusCls}`}>
                            {campaign.status}
                        </span>
                        {campaign.date && (
                            <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1">
                                <Calendar size={12} />
                                {campaign.status === 'sent' ? 'Sent' : 'Scheduled'} {campaign.date}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipients</p>
                            <p className="text-[22px] font-bold text-slate-900">{(campaign.recipients || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                            <p className="text-[13px] font-semibold text-slate-700 mt-1">{campaign.category || campaign.type || '—'}</p>
                        </div>
                    </div>

                    {campaign.status === 'sent' && (campaign.openRate != null || campaign.clickRate != null) && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Open Rate</p>
                                <p className="text-[26px] font-bold text-emerald-700 leading-none">{campaign.openRate ?? '—'}%</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Click Rate</p>
                                <p className="text-[26px] font-bold text-blue-700 leading-none">{campaign.clickRate ?? '—'}%</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-6">
                    <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewSegmentModal({ onClose, onSave }) {
    const [form, setForm] = useState({ title: '', desc: '', criteria: 'User Role equals Lender', ruleField: 'User Role', ruleValue: '' });

    const handleSubmit = () => {
        if (!form.title) return;
        onSave({ ...form, criteria: `${form.ruleField} equals ${form.ruleValue || 'any'}` });
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Colored header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-white">New Segment</h3>
                                <p className="text-[11px] text-purple-200 font-medium">Define a targeted audience group</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Segment Name <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Active Investors"
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-medium outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                            value={form.desc}
                            onChange={e => setForm({ ...form, desc: e.target.value })}
                            placeholder="Briefly describe this audience group..."
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] font-medium outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filter Rules</label>
                        <div className="flex items-center gap-2 p-3 bg-violet-50/50 border border-violet-100 rounded-xl">
                            <select
                                value={form.ruleField}
                                onChange={e => setForm({ ...form, ruleField: e.target.value })}
                                className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-3 text-[12px] font-semibold outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer"
                            >
                                <option>User Role</option>
                                <option>Account Status</option>
                                <option>Last Activity</option>
                                <option>KYC Status</option>
                            </select>
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">equals</span>
                            <input
                                type="text"
                                value={form.ruleValue}
                                onChange={e => setForm({ ...form, ruleValue: e.target.value })}
                                placeholder="value..."
                                className="w-28 h-9 bg-white border border-slate-200 rounded-lg px-3 text-[12px] font-medium outline-none focus:ring-2 focus:ring-violet-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.title}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-[13px] font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Users size={15} />
                        Create Segment
                    </button>
                </div>
            </div>
        </div>
    );
}


