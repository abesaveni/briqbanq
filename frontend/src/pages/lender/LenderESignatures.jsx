import React, { useState, useEffect } from 'react';
import {
    Shield, FileText, CheckCircle, Clock, Key, Activity,
    MoreHorizontal, Search, Filter, Download, Eye, Archive,
    HelpCircle, Plus, ChevronRight, Lock, Bell, Settings,
    Cpu, Globe, Terminal, UserCheck, AlertCircle, FileCheck,
    UploadCloud, PenTool, RefreshCw, Briefcase, Trash2, X, ArrowLeft, AlertTriangle
} from "lucide-react";
import { borrowerApi } from '../borrower/api';
import { generateBrandedPDF } from '../../utils/pdfGenerator';
// Redefined mock data to match Figma exactly
const MOCK_DATA = {
    stats: { pending: 0, awaiting: 0, drafts: 0, expiring: 0 },
    tasks: [],
    alerts: [],
    activity: []
};

const GOVSIGN_TABS = [
    'Dashboard',
    'Envelopes',
    'Documents',
    'Templates',
    'Certificates & Keys',
    'Evidence Ledger',
    'Reports',
    'Help',
];

function getMockGovSignData() {
    return {
        stats: { pending: 0, awaiting: 0, drafts: 0, expiring: 0 },
        tasks: [], alerts: [], activity: [], envelopes: [], documents: [],
        templates: [], certificates: [], evidenceChain: {}, evidenceEvents: [],
        adminSovereignty: {}, adminPolicies: [], adminSecurity: [], reportTypes: [],
        reports: [], helpFaq: [], helpLinks: [],
    };
}

export default function LenderESignatures() {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [showNewEnvelopeModal, setShowNewEnvelopeModal] = useState(false);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [showConfigureHsmModal, setShowConfigureHsmModal] = useState(false);
    const [hsmConfig, setHsmConfig] = useState({ keyRetention: '90', backupEnabled: true, autoRotate: true, auditLevel: 'Full' });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Using timeout to simulate loading as per figma screenshot "Initialising..."
                setLoading(true);
                setTimeout(() => {
                    const mock = getMockGovSignData() || {};
                    setData({
                        overviewStats: mock.overviewStats || {
                            totalEnvelopes: 0, envelopesTrend: "0%", completedThisMonth: 0, completedTrend: "0%",
                            pendingGovSign: 0, pendingTrend: "0%", averageTurnaround: "0h", turnaroundTrend: "0%"
                        },
                        tasks: mock.tasks || [],
                        envelopes: mock.envelopes || [],
                        documents: mock.documents || [],
                        templates: mock.templates || [],
                        certificates: mock.certificates || [],
                        ledger: mock.ledger || [],
                        reportTypes: mock.reportTypes || [],
                        reports: mock.reports || [],
                        helpFaq: mock.helpFaq || [],
                        helpLinks: mock.helpLinks || []
                    });
                    setLoading(false);
                }, 800);
            } catch (err) {
                const mock = getMockGovSignData() || {};
                setData({
                    overviewStats: mock.overviewStats || {},
                    tasks: [], envelopes: [], documents: [], templates: [], certificates: [],
                    ledger: [], reportTypes: [], reports: [], helpFaq: [], helpLinks: []
                });
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleDeleteTemplate = (id) => {
        setData(prev => ({
            ...prev,
            templates: prev.templates.filter(t => (t.id || t.id) !== id)
        }));
    };

    const handleDeleteDocument = (id) => {
        setData(prev => ({
            ...prev,
            documents: prev.documents.filter(doc => doc.id !== id)
        }));
    };

    const handleDeleteEnvelope = (id) => {
        setData(prev => ({
            ...prev,
            envelopes: prev.envelopes.filter(env => env.id !== id),
            tasks: prev.tasks.filter(t => t.id !== id)
        }));
    };

    const handleAddTemplate = (newTpl) => {
        const id = `tpl-${Math.floor(Math.random() * 900) + 100}`;
        const template = {
            ...newTpl,
            id,
            usageCount: 0,
            lastUsed: 'Just now',
            createdDate: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        setData(prev => ({
            ...prev,
            templates: [template, ...prev.templates]
        }));
        setShowNewTemplateModal(false);
    };

    const handleReviewSign = (taskId) => {
        setData(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task) return prev;

            const updatedTasks = prev.tasks.map(t =>
                t.id === taskId ? { ...t, status: 'SIGNED', signed: '3/3' } : t
            );

            const newActivity = {
                id: Date.now(),
                type: 'DOCUMENT SIGNED',
                user: 'You',
                hash: 'share.' + Math.random().toString(36).substring(7),
                time: new Date().toLocaleString('en-AU', { hour12: false }) + ' AEDT'
            };

            return {
                ...prev,
                tasks: updatedTasks,
                activity: [newActivity, ...prev.activity]
            };
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Initialising Secure Vault...</p>
            </div>
        </div>
    );

    const internalTabs = [
        { id: 'Dashboard' },
        { id: 'Envelopes' },
        { id: 'Documents' },
        { id: 'Templates' },
        { id: 'Certificates & Keys' },
        { id: 'Evidence Ledger' },
        { id: 'Reports' },
        { id: 'Help' }
    ];

    return (
        <><div className="animate-fade-in font-['Inter',sans-serif] text-slate-900 antialiased">
            {/* Page Header (Figma) */}
            <div className="max-w-[1700px] mx-auto px-4 pt-6 mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                <p className="text-gray-500 text-[13px] font-medium mt-1">Manage your mortgage resolution case</p>
            </div>

            {/* GovSign Card (Figma) - Now Full Width */}
            <div className="bg-slate-900 shadow-2xl relative">
                <div className="max-w-[1700px] mx-auto px-4">
                    {/* Navy Header - Reduced padding */}
                    <div className="py-4 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                                G
                            </div>
                            <div>
                                <h2 className="text-[20px] md:text-[22px] font-bold text-white tracking-tight leading-none">GovSign</h2>
                                <p className="text-[9px] md:text-[10px] font-semibold text-blue-200/60 mt-1.5 uppercase tracking-[0.2em]">High-Assurance E-Signature Platform</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 md:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-[10px] md:text-[11px] font-bold text-green-500 uppercase tracking-wider">HSM Active</span>
                            </div>
                            <span className="text-[10px] md:text-[11px] font-bold text-blue-200/60 uppercase tracking-wider">AU Sovereign</span>
                            <span className="text-[10px] md:text-[11px] font-bold text-blue-200/60 uppercase tracking-wider hidden lg:inline">HSM Cluster: SYD-01 Active</span>
                            <button
                                onClick={() => setShowNewEnvelopeModal(true)}
                                className="bg-white text-red-700 px-4 py-1.5 rounded-lg font-bold text-[11px] md:text-[12px] flex items-center gap-2 hover:bg-gray-100 transition-all shadow-xl ml-auto md:ml-0"
                            >
                                <Plus size={14} /> <span className="hidden xs:inline">Create Envelope</span><span className="xs:hidden">Create</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs (Navy) - Reduced padding */}
                    <div className="flex items-center overflow-x-auto no-scrollbar bg-slate-900 border-t border-gray-800/20 px-0">
                        <div className="flex items-center gap-1 min-w-max">
                            {internalTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 md:px-5 py-3 text-[12px] md:text-[13px] font-bold tracking-tight transition-all relative border-b-2 whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-white border-white'
                                        : 'text-gray-400 hover:text-gray-200 border-transparent'
                                        }`}
                                >
                                    {tab.id}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Red Banner Sub-Header (Dashboard Only) - Full Width Background */}
                {activeTab === 'Dashboard' && (
                    <div className="bg-red-700 border-t border-white/10">
                        <div className="max-w-[1700px] mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold tracking-tight uppercase">GovSign High-Assurance Platform</h3>
                                <p className="text-white/80 text-[11px] md:text-[12px] mt-1 font-medium leading-relaxed max-w-2xl">
                                    Cryptographic digital signatures • HSM-backed keys • Tamper-proof evidence ledger • AU data sovereignty
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded">AU Sovereign</span>
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider border border-white/20 px-3 py-1 rounded hidden sm:inline">HSM SYD-01</span>
                                <button
                                    onClick={() => setShowNewEnvelopeModal(true)}
                                    className="bg-white text-red-700 px-5 py-2 rounded-lg font-bold text-[11px] md:text-[12px] flex items-center gap-2 hover:bg-gray-100 transition-all shadow-xl uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Create Envelope
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-[1700px] mx-auto px-4 pb-20">

                {/* Modals (Figma) */}
                {showNewEnvelopeModal && (
                    <CreateEnvelopeModal
                        onClose={() => setShowNewEnvelopeModal(false)}
                        onSave={(val) => {
                            const newEnv = {
                                id: `ENV-${Math.floor(Math.random() * 9000) + 1000}`,
                                title: val.title,
                                sender: 'You',
                                status: 'Draft',
                                progress: '0/1',
                                risk: 'OFFICIAL'
                            };
                            setData(prev => ({
                                ...prev,
                                envelopes: [newEnv, ...prev.envelopes]
                            }));
                            setShowNewEnvelopeModal(false);
                        }}
                    />
                )}

                {/* Content Switcher */}
                <div className="mt-8">
                    {activeTab === 'Dashboard' && <SignatureMainView data={data} onNavigate={setActiveTab} onSign={handleReviewSign} />}
                    {activeTab === 'Documents' && (
                        <DocumentsTab
                            documents={data.documents}
                            onUpload={() => setShowUploadModal(true)}
                            onDelete={handleDeleteDocument}
                        />
                    )}
                    {activeTab === 'Envelopes' && (
                        <EnvelopesTab
                            envelopes={[
                                ...data.tasks.map(t => ({
                                    id: t.id,
                                    title: t.title,
                                    sender: 'You',
                                    type: t.type || 'Contract',
                                    risk: t.status === 'URGENT' ? 'URGENT' : 'OFFICIAL',
                                    status: t.status === 'SIGNED' ? 'Completed' : 'In Signing',
                                    progress: t.signed,
                                    sla: t.sla || '23h 37m'
                                })),
                                ...data.envelopes.map(e => ({
                                    ...e,
                                    type: e.type || 'Finance',
                                    risk: e.risk || 'PROTECTED',
                                    sla: e.sla || '48h 00m'
                                }))
                            ]}
                            onAddNew={() => setShowNewEnvelopeModal(true)}
                            onDelete={handleDeleteEnvelope}
                        />
                    )}
                    {activeTab === 'Certificates & Keys' && (
                        <CertificatesTab
                            certificates={data.certificates}
                            onView={setSelectedCertificate}
                            onIssue={() => {
                                const newCert = {
                                    id: `cert-${Date.now()}`,
                                    subject: 'CN=New Certificate Holder, O=Organization, C=AU',
                                    issuer: 'GovSign Internal CA',
                                    serial: Math.random().toString(16).toUpperCase().substring(2, 10),
                                    validFrom: new Date().toISOString().split('T')[0],
                                    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    status: 'Active',
                                    classification: 'OFFICIAL',
                                    algorithm: 'RSA-2048 + SHA-512',
                                    hsm: true
                                };
                                setData(prev => ({
                                    ...prev,
                                    certificates: [newCert, ...prev.certificates]
                                }));
                            }}
                            onConfigure={() => setShowConfigureHsmModal(true)}
                            onExport={async (cert) => {
                                await generateBrandedPDF({
                                    title: 'Digital Certificate',
                                    subtitle: cert.subject || cert.id,
                                    fileName: `certificate-${(cert.subject || cert.id || 'cert').replace(/\s+/g, '_').slice(0, 40)}.pdf`,
                                    infoItems: [
                                        { label: 'Subject', value: cert.subject || '—' },
                                        { label: 'Issuer', value: cert.issuer || 'GovSign Root CA' },
                                        { label: 'Serial Number', value: cert.serial || '—' },
                                        { label: 'Algorithm', value: cert.algorithm || '—' },
                                        { label: 'Valid From', value: cert.validFrom || '—' },
                                        { label: 'Valid To', value: cert.validTo || '—' },
                                        { label: 'Status', value: cert.status || '—' },
                                    ],
                                });
                            }}
                            onRenew={(cert) => {
                                setData(prev => ({
                                    ...prev,
                                    certificates: prev.certificates.map(c =>
                                        c.id === cert.id ? { ...c, status: 'Active', expiresDays: null } : c
                                    )
                                }));
                            }}
                        />
                    )}
                    {activeTab === 'Evidence Ledger' && <EvidenceLedgerTab chain={data.evidenceChain} events={data.evidenceEvents} />}
                    {activeTab === 'Templates' && (
                        <TemplatesTab
                            templates={data.templates}
                            onDelete={handleDeleteTemplate}
                            onAddNew={() => setShowNewTemplateModal(true)}
                        />
                    )}

                    {activeTab === 'Reports' && (
                        <ReportsTab
                            types={(data.reportTypes || []).length > 0 ? data.reportTypes : [
                              { id: 'envelope-summary', name: 'Envelope Summary', description: 'Summary of all envelopes and their signing status.' },
                              { id: 'signing-activity', name: 'Signing Activity', description: 'Detailed log of all signing events within the date range.' },
                              { id: 'certificate-status', name: 'Certificate Status', description: 'Current status and validity of all digital certificates.' },
                              { id: 'evidence-audit', name: 'Evidence Audit Trail', description: 'Full cryptographic evidence chain for compliance auditing.' },
                              { id: 'user-access', name: 'User Access Report', description: 'Record of all user access and authentication events.' },
                            ]}
                            reports={data.reports}
                            onGenerate={(newRep) => {
                                setData(prev => ({
                                    ...prev,
                                    reports: [newRep, ...prev.reports]
                                }));
                            }}
                        />
                    )}
                    {activeTab === 'Help' && <HelpTab faq={data.helpFaq} links={data.helpLinks} />}
                </div>

                {/* Modals */}
                {showNewTemplateModal && (
                    <NewTemplateModal
                        onClose={() => setShowNewTemplateModal(false)}
                        onSave={handleAddTemplate}
                    />
                )}

                {showUploadModal && (
                    <UploadDocumentModal
                        onClose={() => setShowUploadModal(false)}
                        envelopes={data.envelopes}
                        onSave={(newDoc) => {
                            const doc = {
                                ...newDoc,
                                id: `DOC-${Math.floor(Math.random() * 9000) + 1000}`,
                                size: '1.2 MB',
                                uploadedBy: 'You',
                                date: new Date().toISOString().split('T')[0],
                                status: 'Pending',
                                hash: 'sha256:' + Math.random().toString(36).substring(7)
                            };
                            setData(prev => ({
                                ...prev,
                                documents: [doc, ...prev.documents]
                            }));
                            setShowUploadModal(false);
                        }}
                    />
                )}

                {selectedCertificate && (
                    <CertificateDetailModal
                        cert={selectedCertificate}
                        onClose={() => setSelectedCertificate(null)}
                    />
                )}
            </div>
        </div>

        {/* Configure HSM Modal */}
        {showConfigureHsmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowConfigureHsmModal(false)}>
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure HSM</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Hardware Security Module cluster settings</p>
                        </div>
                        <button type="button" onClick={() => setShowConfigureHsmModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Key Retention Period (days)</label>
                            <select value={hsmConfig.keyRetention} onChange={(e) => setHsmConfig((p) => ({ ...p, keyRetention: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                                <option value="90">90 days (recommended)</option>
                                <option value="180">180 days</option>
                                <option value="365">365 days</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Audit Logging Level</label>
                            <select value={hsmConfig.auditLevel} onChange={(e) => setHsmConfig((p) => ({ ...p, auditLevel: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="Full">Full (all operations)</option>
                                <option value="Standard">Standard (sign/key ops only)</option>
                                <option value="Minimal">Minimal (errors only)</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Automatic Key Rotation</p>
                                <p className="text-xs text-gray-500">Rotate keys every {hsmConfig.keyRetention} days automatically</p>
                            </div>
                            <button type="button" onClick={() => setHsmConfig((p) => ({ ...p, autoRotate: !p.autoRotate }))} className={`relative w-11 h-6 rounded-full transition-colors ${hsmConfig.autoRotate ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hsmConfig.autoRotate ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Backup Cluster Enabled</p>
                                <p className="text-xs text-gray-500">Mirror keys to secondary HSM cluster</p>
                            </div>
                            <button type="button" onClick={() => setHsmConfig((p) => ({ ...p, backupEnabled: !p.backupEnabled }))} className={`relative w-11 h-6 rounded-full transition-colors ${hsmConfig.backupEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hsmConfig.backupEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button type="button" onClick={() => setShowConfigureHsmModal(false)} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="button" onClick={() => { localStorage.setItem('hsmConfig', JSON.stringify(hsmConfig)); setShowConfigureHsmModal(false); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Save Configuration</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function CreateEnvelopeModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        type: 'Procurement'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-8 py-6">
                    <h3 className="text-2xl font-bold text-gray-900">Create Envelope</h3>
                    <p className="text-gray-500 text-sm mt-1">Create a new signing envelope</p>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Document title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="e.g. Asset Purchase Agreement"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Category</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option>Procurement</option>
                                <option>Legal</option>
                                <option>HR</option>
                                <option>Finance</option>
                            </select>
                        </div>

                        <div className="pt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-blue-800 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 uppercase tracking-widest"
                            >
                                Create Envelope
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


function TemplatesTab({ templates, onDelete, onAddNew }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    const filtered = (templates || []).filter(tpl =>
        (tpl.name.toLowerCase().includes(search.toLowerCase()) || tpl.id.toLowerCase().includes(search.toLowerCase())) &&
        (filter === 'All' || tpl.type === filter)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl border border-gray-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Master Templates</h1>
                    <p className="text-gray-500 text-[11px] font-medium uppercase tracking-[0.1em] mt-2 italic">Controlled blueprint versioning for rapid execution</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg"
                >
                    <Plus size={14} /> New Template
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="w-full bg-white border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[12px] font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Legal', 'Finance', 'Procurement', 'Governance'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-blue-800 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {filtered.map((tpl, i) => (
                    <div key={i} className="bg-white rounded-[20px] border border-gray-100 p-5 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group relative overflow-hidden">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => onDelete(tpl.id)}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                title="Delete Template"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                    <PenTool size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate uppercase tracking-tight">{tpl.name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{tpl.type} • {tpl.risk}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-4 border-y border-gray-50">
                                <div className="text-center flex-1 border-r border-gray-50">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Executions</p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">{tpl.usageCount}</p>
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Last Activity</p>
                                    <p className="text-[11px] font-bold text-gray-900 mt-0.5 uppercase tracking-tight">{tpl.lastUsed}</p>
                                </div>
                            </div>

                            <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                <Plus size={12} /> Create from Template
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={onAddNew}
                    className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-3 group hover:border-blue-600 hover:bg-blue-50/10 transition-all cursor-pointer min-h-[160px]"
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 group-hover:text-blue-600 transition-all border border-gray-100 shadow-sm">
                        <Plus size={20} />
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Create Template</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

function SignatureMainView({ data, onNavigate, onSign }) {
    const { stats = {}, tasks = [], alerts = [], activity = [] } = data || {};

    return (
        <div className="space-y-12 animate-fade-in mt-10 pb-10">
            {/* FIGMA STAT CARDS - Reduced height */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    number={stats.pending || 0}
                    label="Pending for Me"
                    sub="Requires your signature"
                    color="blue"
                    badge={stats.pending}
                />
                <StatCard
                    number={stats.awaiting || 0}
                    label="Awaiting Others"
                    sub="Envelopes you've sent"
                    color="yellow"
                />
                <StatCard
                    number={stats.drafts || 0}
                    label="Drafts"
                    sub="Incomplete envelopes"
                    color="purple"
                />
                <StatCard
                    number={stats.expiring || 0}
                    label="Expiring Certificates"
                    sub="Action required"
                    color="red"
                    badge={stats.expiring}
                />
            </div>

            {/* FIGMA MY TASKS */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">My Tasks</h3>
                        <p className="text-gray-500 text-[12px] md:text-[13px] font-medium mt-1">Envelopes requiring your action</p>
                    </div>
                    <button
                        onClick={() => onNavigate('Envelopes')}
                        className="text-indigo-600 font-bold text-sm hover:underline transition-all text-left sm:text-right"
                    >
                        View All Envelopes
                    </button>
                </div>
                <div className="grid gap-5">
                    {tasks.map((task, i) => (
                        <TaskItem key={i} task={task} onSign={() => onSign(task.id)} />
                    ))}
                </div>
            </div>

            {/* FIGMA SECURITY ALERTS */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <AlertTriangle size={20} className="text-orange-500" />
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Security Alerts</h3>
                </div>
                <div className="grid gap-4">
                    {alerts.map((alert, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-lg transition-all">
                            <div className="flex items-center gap-4 md:gap-5">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'warning' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {alert.type === 'warning' ? <AlertCircle size={20} /> : <Activity size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-[15px] md:text-[17px] font-bold text-slate-900">{alert.title}</h4>
                                    <p className="text-gray-500 text-[12px] md:text-[13px] mt-1 font-medium">{alert.description}</p>
                                </div>
                            </div>
                            {alert.action && (
                                <button className="w-full sm:w-auto border border-gray-200 px-6 py-2 rounded-xl font-bold text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                                    {alert.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* FIGMA RECENT ACTIVITY */}
            <div className="space-y-6">
                <div className="px-2">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Recent Activity</h3>
                    <p className="text-gray-500 text-[13px] font-medium mt-1">System-wide envelope activity</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50">
                        {activity.map((item, i) => (
                            <div key={item.id || i} className="px-8 py-4 flex items-center justify-between group hover:bg-gray-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <Activity size={16} className="text-gray-300" />
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">{item.type} —</span>
                                        <span className="text-sm font-medium text-gray-700">{item.user}</span>
                                        {item.hash && <span className="text-gray-300 text-xs font-mono">{item.hash}</span>}
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-gray-400 font-mono tracking-tight uppercase">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// FIGMA SUB-COMPONENTS
function StatCard({ number, label, sub, color, badge }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    };

    return (
        <div className={`bg-white rounded-[20px] border p-5 flex items-center gap-5 ${colorClasses[color]} relative transition-all hover:scale-[1.02] hover:shadow-lg`}>
            {badge && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                    {badge}
                </div>
            )}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${color === 'blue' ? 'bg-blue-600 text-white' : color === 'yellow' ? 'bg-yellow-500 text-white' : color === 'purple' ? 'bg-purple-500 text-white' : 'bg-red-500 text-white'}`}>
                {number}
            </div>
            <div>
                <p className="text-[17px] font-bold text-gray-900 leading-tight">{number} {label}</p>
                <p className="text-[12px] text-gray-500 mt-1 font-medium">{sub}</p>
            </div>
        </div>
    );
}

function TaskItem({ task, onSign }) {
    const isSigned = task.status === 'SIGNED';

    return (
        <div className={`bg-white rounded-[24px] border border-gray-100 p-6 flex items-center justify-between group hover:border-indigo-100 hover:shadow-xl transition-all duration-300 ${isSigned ? 'opacity-75 grayscale-[0.2]' : ''}`}>
            <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isSigned ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                    {isSigned ? <CheckCircle size={22} /> : <FileText size={22} />}
                </div>
                <div>
                    <h4 className={`text-lg font-bold tracking-tight transition-colors ${isSigned ? 'text-gray-500' : 'text-gray-900 group-hover:text-indigo-700'}`}>{task.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[12px] font-mono font-bold text-gray-400">{task.id}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">{task.type}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className={`text-[12px] font-bold ${isSigned ? 'text-green-600' : 'text-gray-400'}`}>{isSigned ? 'Completed' : `${task.signed} signed`}</span>
                        {!isSigned && (
                            <>
                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                <span className="text-[12px] font-bold text-orange-500">SLA: {task.sla}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest ${isSigned ? 'bg-green-50 text-green-700' : task.status === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                    {isSigned ? 'SIGNED' : task.status}
                </span>
                {!isSigned ? (
                    <button
                        onClick={onSign}
                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
                    >
                        <PenTool size={18} /> Review & Sign
                    </button>
                ) : (
                    <button className="bg-gray-50 text-gray-400 px-8 py-3.5 rounded-2xl font-bold text-sm cursor-default border border-gray-100 flex items-center gap-2">
                        <CheckCircle size={18} /> Sealed
                    </button>
                )}
            </div>
        </div>
    );
}

function EnvelopesTab({ envelopes, onAddNew, onDelete }) {
    const [search, setSearch] = useState('');

    const filtered = (envelopes || []).filter(env =>
        (env.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (env.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (env.sender || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Envelope Management</h1>
                    <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wider mt-1.5 opacity-80 italic">Active cryptographic execution lifecycles</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-800 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
                >
                    <Plus size={14} /> New Envelope
                </button>
            </div>

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by ID, title, or sender..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-[14px] font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left table-fixed">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            <th className="px-2 py-4 w-[12%]">Envelope ID</th>
                            <th className="px-2 py-4 w-[25%]">Title / Sender</th>
                            <th className="px-2 py-4 w-[12%] text-center">Type</th>
                            <th className="px-2 py-4 w-[10%] text-center">Risk</th>
                            <th className="px-2 py-4 w-[12%] text-center">Status</th>
                            <th className="px-2 py-4 w-[12%] text-center">Progress</th>
                            <th className="px-2 py-4 w-[8%] text-center">SLA</th>
                            <th className="px-2 py-4 w-[9%] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(env => {
                            const progParts = (env.progress || "0/1").split('/');
                            const progPercent = (parseInt(progParts[0]) / parseInt(progParts[1])) * 100;

                            return (
                                <tr key={env.id} className="group hover:bg-blue-50/10 transition-all">
                                    <td className="px-2 py-5 text-[12px] font-mono font-bold text-blue-600 underline cursor-pointer">{env.id}</td>
                                    <td className="px-2 py-5">
                                        <p className="text-[14px] font-bold text-gray-900 leading-tight">{env.title}</p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-widest">{env.sender}</p>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <span className="text-[13px] font-medium text-gray-600">{env.type || 'Contract'}</span>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${env.risk === 'URGENT' ? 'bg-red-50 text-red-600 border border-red-100' :
                                            env.risk === 'PROTECTED' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {env.risk}
                                        </span>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold inline-block min-w-[120px] ${env.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                            env.status === 'In Signing' ? 'bg-blue-50 text-blue-600' :
                                                'bg-orange-50 text-orange-600'
                                            }`}>
                                            {env.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                                                    style={{ width: `${progPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-[12px] font-bold text-gray-400">{env.progress}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-5 text-center">
                                        <span className="text-[12px] font-bold text-gray-700">{env.sla || '---'}</span>
                                    </td>
                                    <td className="px-2 py-5 text-right flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={async () => {
                                                await generateBrandedPDF({
                                                    title: env.title || 'Envelope',
                                                    subtitle: `Type: ${env.type || '—'} · Status: ${env.status || '—'}`,
                                                    fileName: `envelope-${(env.id || 'unknown').replace(/\s+/g, '_')}.pdf`,
                                                    infoItems: [
                                                        { label: 'Envelope ID', value: env.id || '—' },
                                                        { label: 'Type', value: env.type || '—' },
                                                        { label: 'Status', value: env.status || '—' },
                                                        { label: 'Progress', value: env.progress || '—' },
                                                        { label: 'SLA', value: env.sla || '—' },
                                                    ],
                                                });
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"
                                        ><Download size={16} /></button>
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-all"><Eye size={16} /></button>
                                        <button
                                            onClick={() => onDelete(env.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ReportsTab({ types, reports, onGenerate }) {
    const [selectedType, setSelectedType] = useState('env-summary');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [search, setSearch] = useState('');

    const activeType = (types || []).find(t => t.id === selectedType) || {};

    const handleGenerate = () => {
        if (!fromDate || !toDate) return;
        const newRep = {
            id: `rep-${Date.now()}`,
            name: `${activeType.name} - ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
            type: activeType.name,
            range: `${fromDate} — ${toDate}`,
            generated: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' AEDT',
            status: 'Ready'
        };
        if (onGenerate) onGenerate(newRep);
    };

    const filtered = (reports || []).filter(r =>
        (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.type || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in mt-6 max-w-[1400px]">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
                <p className="text-gray-500 text-[13px] font-medium mt-1">Generate and download envelope, signing, and certificate reports</p>
            </div>

            {/* Generate Report Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-[17px] font-bold text-gray-900 mb-6">Generate new report</h3>

                <div className="flex items-start gap-6">
                    <div className="flex-1 max-w-[320px]">
                        <label className="block text-sm font-bold text-gray-900 mb-2 opacity-70">Report type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                        >
                            {(types || []).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">{activeType.description}</p>
                    </div>

                    <div className="w-[180px]">
                        <label className="block text-sm font-bold text-gray-900 mb-2 opacity-70">From date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase shadow-sm"
                        />
                    </div>

                    <div className="w-[180px]">
                        <label className="block text-sm font-bold text-gray-900 mb-2 opacity-70">To date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase shadow-sm"
                        />
                    </div>

                    <div className="pt-[30px]">
                        <button
                            onClick={handleGenerate}
                            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg whitespace-nowrap ${(!fromDate || !toDate) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100/50'}`}
                            disabled={!fromDate || !toDate}
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Generated Reports Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[17px] font-bold text-slate-900 tabular-nums">Generated reports</h3>
                    <div className="relative w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">
                                <th className="px-6 py-4">Report name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Date range</th>
                                <th className="px-6 py-4">Generated</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((rep) => (
                                <tr key={rep.id} className="group hover:bg-gray-50 transition-all">
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-930">{rep.name}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-gray-500 uppercase tracking-tight">{rep.type}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-gray-400">{rep.range}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-gray-400 uppercase tracking-tighter">{rep.generated}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {rep.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={async () => {
                                                await generateBrandedPDF({
                                                    title: rep.name || 'Report',
                                                    subtitle: `Date range: ${rep.range || '—'}`,
                                                    fileName: `report-${(rep.name || rep.id || 'report').replace(/\s+/g, '_')}.pdf`,
                                                    infoItems: [
                                                        { label: 'Report Name', value: rep.name || '—' },
                                                        { label: 'Type', value: rep.type || '—' },
                                                        { label: 'Date Range', value: rep.range || '—' },
                                                        { label: 'Generated', value: rep.generated || '—' },
                                                        { label: 'Status', value: rep.status || '—' },
                                                    ],
                                                });
                                            }}
                                            className="px-4 py-1.5 border border-gray-200 rounded-lg text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                        >
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="text-gray-200" />
                                            <p className="text-[13px] font-bold text-gray-400">No reports found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function HelpTab({ faq, links }) {
    const [search, setSearch] = useState('');
    const [openIndex, setOpenIndex] = useState(null);

    const filteredFaq = (faq || []).filter(item =>
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in mt-4 max-w-[1400px]">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help</h1>
                <p className="text-gray-500 text-[13px] font-medium mt-1">Documentation, FAQs, and support for GovSign</p>

                <div className="relative mt-6 max-w-[1400px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search help and FAQs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-[17px] font-bold text-gray-900">Frequently asked questions</h3>
                    <div className="space-y-2.5">
                        {filteredFaq.map((item, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-gray-300 transition-all">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left group"
                                >
                                    <span className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.question}</span>
                                    {openIndex === i ? <X size={16} className="text-gray-400" /> : <Plus size={16} className="text-gray-400" />}
                                </button>
                                {openIndex === i && (
                                    <div className="px-6 pb-4">
                                        <div className="h-px bg-gray-50 mb-3" />
                                        <p className="text-[13px] font-medium text-gray-500 leading-relaxed uppercase tracking-tight">
                                            {item.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-8">
                    {/* Documentation Section */}
                    <div className="space-y-4">
                        <h3 className="text-[17px] font-bold text-gray-900">Documentation</h3>
                        <div className="space-y-2.5">
                            {(links || []).map((link, i) => (
                                <div key={i} className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                                    <h4 className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{link.name}</h4>
                                    <p className="text-[12px] font-medium text-gray-400 mt-1 uppercase tracking-tight">{link.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-[17px] font-bold text-gray-900">Contact support</h3>
                        <p className="text-[12px] font-medium text-gray-500 mt-2 leading-relaxed uppercase tracking-tight">
                            Need help? Our team is available for technical and compliance questions.
                        </p>
                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                <p className="text-[13px] font-bold text-indigo-600 uppercase mt-1">support@govsign.example</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                                <p className="text-[13px] font-bold text-gray-900 uppercase mt-1">1300 GOVSIGN</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EvidenceLedgerTab({ chain, events }) {
    const [search, setSearch] = useState('');

    const filteredEvents = (events || []).filter(e =>
        (e.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.type || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.actor || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Evidence Ledger</h1>
                    <p className="text-gray-500 text-sm mt-1">Tamper-proof audit trail with cryptographic hash chain</p>
                </div>
                <button
                    onClick={async () => {
                        await generateBrandedPDF({
                            title: 'Evidence Ledger Proof',
                            subtitle: `Chain Integrity: ${chain?.chainIntegrity || '—'} · Total Events: ${chain?.totalEvents || 0}`,
                            fileName: `evidence-ledger-${new Date().toISOString().slice(0, 10)}.pdf`,
                            infoItems: [
                                { label: 'Chain Integrity', value: chain?.chainIntegrity || '—' },
                                { label: 'Total Events', value: String(chain?.totalEvents || 0) },
                                { label: 'Last Event', value: chain?.lastEvent || '—' },
                                { label: 'Export Date', value: new Date().toLocaleDateString('en-AU') },
                            ],
                            sections: (events || []).length > 0 ? [{
                                heading: 'Evidence Events',
                                head: ['Event ID', 'Type', 'Actor', 'Timestamp', 'Hash'],
                                rows: (events || []).map((e) => [e.id || '—', e.type || '—', e.actor || '—', e.timestamp || '—', e.hash || '—']),
                            }] : [],
                        });
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-[10px] text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/50"
                >
                    Export Ledger Proof
                </button>
            </div>

            {/* Evidence Chain Summary Card */}
            <div className="bg-violet-50 border border-purple-100 rounded-[16px] p-6 flex items-start gap-5">
                <div className="w-12 h-12 bg-violet-50 rounded-[12px] flex items-center justify-center text-violet-600 shadow-sm border border-violet-200">
                    <Shield size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-950">Tamper-Proof Evidence Chain</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mt-1">
                        Every action is recorded with cryptographic hash chaining. Each event references the previous event's hash.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Total events: <span className="text-gray-900 font-bold">{chain?.totalEvents || '24567'}</span></span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600 font-medium">Chain Integrity: <span className="text-emerald-600 font-bold">{chain?.chainIntegrity === 'VERIFIED' ? 'Verified' : 'Checking...'}</span></span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600 font-medium">Last event: <span className="text-gray-900 font-bold">{chain?.lastEvent || '2 minutes ago'}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-[12px] py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                </div>
                <button className="px-4 py-3 bg-white border border-gray-200 rounded-[12px] text-sm font-bold text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all">
                    <Filter size={18} /> Filter
                </button>
            </div>

            <div className="space-y-4 pt-2">
                <h3 className="text-lg font-bold text-gray-900">Event Chain</h3>

                <div className="space-y-4">
                    {filteredEvents.map((e) => (
                        <div key={e.id} className="bg-white border border-gray-100 rounded-[16px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-700 tracking-tight">{e.id}</span>
                                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-[4px] text-[11px] font-bold uppercase tracking-wider">
                                            {e.type}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                                        <div>
                                            <p className="inline-block text-[12px] font-bold text-gray-400">Actor: </p>
                                            <p className="inline-block text-[12px] font-bold text-gray-700 ml-1.5">{e.actor} • Origin IP: {e.ip}</p>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <p className="inline-block text-[12px] font-bold text-gray-400">Event Hash: </p>
                                            <p className="inline-block text-[12px] font-mono font-bold text-emerald-600 ml-1.5">{e.eventHash}</p>
                                            <span className="text-gray-300 mx-2">•</span>
                                            <p className="inline-block text-[12px] font-bold text-gray-400">Previous: </p>
                                            <p className="inline-block text-[12px] font-mono font-bold text-emerald-600 ml-1.5">{e.previousHash}</p>
                                        </div>
                                        <div>
                                            <p className="inline-block text-[12px] font-bold text-gray-400">Device: </p>
                                            <p className="inline-block text-[12px] font-bold text-gray-700 ml-1.5">{e.device}</p>
                                        </div>
                                        <div>
                                            <p className="inline-block text-[12px] font-bold text-gray-400">Auth: </p>
                                            <p className="inline-block text-[12px] font-bold text-gray-700 ml-1.5">{e.auth}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-bold text-gray-400 whitespace-nowrap">{e.timestamp}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                            <p className="text-gray-500 text-sm">Adjust your search or filter to find specific ledger entries.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CertificatesTab({ certificates, onView, onIssue, onConfigure, onExport, onRenew }) {
    if (!certificates || certificates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in mt-6 border-2 border-dashed border-gray-100 rounded-[20px] bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm">
                    <Shield size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">No Certificates Found</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">No cryptographic certificates or HSM keys are currently provisioned in this environment.</p>
                </div>
                <button
                    onClick={onIssue}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-[10px] text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                    Issue First Certificate
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certificates and Keys</h1>
                    <p className="text-gray-500 text-[13px] font-medium mt-1">HSM-backed cryptographic certificates</p>
                </div>
                <button
                    onClick={onIssue}
                    className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white rounded-[10px] text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/50"
                >
                    <Plus size={16} /> Issue Certificate
                </button>
            </div>

            {/* HSM Cluster Status Card */}
            <div className="bg-green-50 border border-emerald-200 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-[12px] border border-emerald-200 flex items-center justify-center text-green-600 shadow-sm shrink-0">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-900 opacity-90">HSM Cluster Status</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-[11px] font-medium text-gray-600 truncate">HSM-01-SYD: <span className="text-green-600 font-bold">Active</span></p>
                            <p className="text-[11px] font-medium text-gray-600 truncate">HSM-02-SYD: <span className="text-gray-400 font-bold">Standby</span></p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-60">FIPS 140-2 Level 3 Certified</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onConfigure}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-white border border-gray-200 rounded-[8px] text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                    Configure
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {certificates.map((c, i) => {
                    const isExpiring = c.status === 'Expiring';
                    return (
                        <div key={c.id || i} className={`bg-white rounded-[16px] border ${isExpiring ? 'border-amber-300' : 'border-emerald-200'} p-4 space-y-3 shadow-sm relative overflow-hidden transition-all hover:shadow-md`}>
                            <div className="flex items-center justify-between">
                                <div className="w-8 h-8 bg-gray-50 rounded-[8px] flex items-center justify-center text-gray-400 border border-gray-100">
                                    <Shield size={16} />
                                </div>
                                <span className={`text-[11px] font-bold ${isExpiring ? 'text-amber-600' : 'text-green-600'}`}>
                                    {(c.status || 'Active').toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-2 pt-0.5">
                                {isExpiring && (
                                    <p className="text-[11px] font-bold text-amber-600">Expires in {c.expiresDays || 'N/A'} days</p>
                                )}
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Subject</p>
                                    <p className="text-[12px] font-bold text-gray-900 leading-tight break-all mt-0.5">{c.subject || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Issuer</p>
                                    <p className="text-[12px] font-bold text-gray-900 leading-tight mt-0.5">{c.issuer || 'System CA'}</p>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Serial</p>
                                        <p className="text-[12px] font-mono font-bold text-gray-500 uppercase mt-0.5 truncate">{c.serial || 'N/A'}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Valid</p>
                                        <p className="text-[12px] font-bold text-gray-900 mt-0.5">{c.validFrom || '—'} — {c.validTo || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-0.5">
                                {c.hsm && (
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-[4px] text-[9px] font-bold uppercase tracking-widest">HSM-Backed</span>
                                )}
                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest ${c.classification === 'SECRET' || c.classification === 'TOP SECRET' ? 'bg-red-50 text-red-500' :
                                    c.classification === 'PROTECTED' ? 'bg-amber-50 text-amber-600' :
                                        'bg-blue-50 text-blue-500'
                                    }`}>
                                    {c.classification || 'OFFICIAL'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                                <button
                                    onClick={() => onExport && onExport(c)}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-[8px] text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={() => onView(c)}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-[8px] text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    View
                                </button>
                                {isExpiring && (
                                    <button
                                        onClick={() => onRenew && onRenew(c)}
                                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-[8px] text-[11px] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                    >
                                        Renew
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function CertificateDetailModal({ cert, onClose }) {
    if (!cert) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[380px] rounded-[20px] shadow-2xl overflow-hidden p-6 space-y-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Certificate Details</h3>

                <div className="space-y-2.5">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Subject</p>
                        <p className="text-[12px] font-bold text-gray-900 leading-tight mt-0.5">{cert.subject || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Issuer</p>
                        <p className="text-[12px] font-bold text-gray-900 mt-0.5">{cert.issuer || 'System CA'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Serial</p>
                        <p className="text-[12px] font-mono font-bold text-gray-500 uppercase mt-0.5">{cert.serial || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Algorithm</p>
                            <p className="text-[12px] font-bold text-gray-900 mt-0.5">{cert.algorithm || 'RSA-2048'}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none opacity-60">Validity</p>
                            <p className="text-[12px] font-bold text-gray-900 mt-0.5 whitespace-nowrap">{cert.validFrom || '—'} — {cert.validTo || '—'}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-1">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-[10px] shadow-lg hover:bg-indigo-700 transition-all font-sans"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function DocumentsTab({ documents, onUpload, onDelete }) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    const filtered = (documents || []).filter(doc => {
        const matchesSearch = (doc.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (doc.uploadedBy || '').toLowerCase().includes(search.toLowerCase()) ||
            (doc.envelopeId || '').toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'All Types' || doc.type === typeFilter;
        const matchesStatus = statusFilter === 'All Statuses' || doc.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const stats = {
        total: documents.length,
        signed: documents.filter(d => d.status === 'Signed').length,
        pending: documents.filter(d => d.status === 'Pending').length,
        inSigning: documents.filter(d => d.status === 'In Signing').length
    };

    return (
        <div className="space-y-6 animate-fade-in mt-10">
            {/* Stat Cards for Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 leading-none">{stats.total}</span>
                            <span className="text-[13px] font-bold text-slate-900 leading-none">Total Documents</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-400 mt-2 uppercase tracking-[0.2em] opacity-80">All documents in envelopes</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 leading-none">{stats.signed}</span>
                            <span className="text-[13px] font-bold text-slate-900 leading-none">Signed</span>
                        </div>
                        <p className="text-[11px] font-bold text-green-500 mt-2 uppercase tracking-[0.2em] opacity-80">Completed</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 leading-none">{stats.pending}</span>
                            <span className="text-[13px] font-bold text-slate-900 leading-none">Pending</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-400 mt-2 uppercase tracking-[0.2em] opacity-80">Awaiting action</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                        <PenTool size={24} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 leading-none">{stats.inSigning}</span>
                            <span className="text-[13px] font-bold text-slate-900 leading-none">In Signing</span>
                        </div>
                        <p className="text-[11px] font-bold text-indigo-400 mt-2 uppercase tracking-[0.2em] opacity-80">In progress</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
                    <p className="text-gray-500 text-[12px] md:text-[13px] font-medium mt-1">Manage documents across your high-assurance envelopes</p>
                </div>
                <button
                    onClick={onUpload}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50"
                >
                    <UploadCloud size={16} /> Upload Document
                </button>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, type, uploader, envelope ID..."
                        className="w-full bg-gray-50/50 border border-transparent rounded-xl py-3 pl-11 pr-4 text-[13px] font-medium text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="bg-gray-50/50 border border-transparent rounded-xl px-4 py-3 text-[13px] font-bold text-gray-700 outline-none hover:bg-white hover:border-indigo-100 transition-all font-sans"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option>All Types</option>
                    <option>PDF</option>
                    <option>DOCX</option>
                </select>
                <select
                    className="bg-gray-50/50 border border-transparent rounded-xl px-4 py-3 text-[13px] font-bold text-gray-700 outline-none hover:bg-white hover:border-indigo-100 transition-all font-sans"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option>All Statuses</option>
                    <option>Signed</option>
                    <option>Pending</option>
                    <option>In Signing</option>
                </select>
                <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    <Filter size={16} /> Filters
                </button>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left table-fixed">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">
                            <th className="px-2 py-5 w-[38%]">Document Name</th>
                            <th className="px-2 py-5 text-center w-[10%]">Type</th>
                            <th className="px-2 py-5 text-center w-[10%]">Status</th>
                            <th className="px-2 py-5 text-center w-[10%]">Envelope ID</th>
                            <th className="px-2 py-5 text-center w-[15%]">Uploaded By</th>
                            <th className="px-2 py-5 text-center w-[7%]">Date</th>
                            <th className="px-2 py-5 text-center w-[10%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((doc, i) => (
                            <tr key={doc.id || i} className="hover:bg-blue-50/10 transition-all group">
                                <td className="px-2 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold text-[13px]">
                                            D
                                        </div>
                                        <span className="text-[13px] font-bold text-gray-900 truncate max-w-[300px]" title={doc.name}>{doc.name}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-5 text-[12px] font-bold text-gray-500 text-center">{doc.type}</td>
                                <td className="px-2 py-5 text-center">
                                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-block min-w-[100px] text-center ${doc.status === 'Signed' ? 'bg-green-50 text-green-600' :
                                        doc.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                        {doc.status}
                                    </span>
                                </td>
                                <td className="px-2 py-5 text-[11px] font-mono font-bold text-gray-400 text-center opacity-60 italic">{doc.envelopeId}</td>
                                <td className="px-2 py-5 text-[12px] font-bold text-gray-700 text-center">{doc.uploadedBy}</td>
                                <td className="px-2 py-5 text-[12px] font-bold text-gray-500 text-center">{doc.date}</td>
                                <td className="px-2 py-5">
                                    <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Eye size={16} /></button>
                                        <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Download size={16} /></button>
                                        <button
                                            onClick={() => onDelete(doc.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function NewTemplateModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'Legal',
        risk: 'OFFICIAL'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-8 py-6">
                    <h3 className="text-2xl font-bold text-gray-900">New Template</h3>
                    <p className="text-gray-500 text-sm mt-1">Create a reusable signature workflow template</p>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Template Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Master Service Agreement"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-900">Type</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option>Legal</option>
                                    <option>Finance</option>
                                    <option>Procurement</option>
                                    <option>Governance</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-900">Risk Classification</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
                                    value={formData.risk}
                                    onChange={e => setFormData({ ...formData, risk: e.target.value })}
                                >
                                    <option>OFFICIAL</option>
                                    <option>PROTECTED</option>
                                    <option>SECRET</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                            >
                                Create Template
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function UploadDocumentModal({ onClose, onSave, envelopes }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'PDF',
        envelopeId: '-- None --'
    });

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-8 py-6">
                    <h3 className="text-2xl font-bold text-gray-900">Upload Document</h3>
                    <p className="text-gray-500 text-sm mt-1">Add a document to an envelope or as a standalone file</p>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Document name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Contract_2026"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Type</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>PDF</option>
                                <option>DOCX</option>
                                <option>PNG</option>
                                <option>JPG</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Link to envelope (optional)</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
                                value={formData.envelopeId}
                                onChange={e => setFormData({ ...formData, envelopeId: e.target.value })}
                            >
                                <option>-- None --</option>
                                {envelopes.map(env => (
                                    <option key={env.id} value={env.id}>{env.id} - {env.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                            >
                                Upload
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
