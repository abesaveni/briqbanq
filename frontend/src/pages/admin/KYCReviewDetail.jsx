import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle, AlertCircle, FileText,
    Mail, Download, Activity, ExternalLink, ChevronRight, CheckSquare, X, Loader2, Send
} from 'lucide-react';
import { generateBrandedPDF } from '../../utils/pdfGenerator';

export default function KYCReviewDetail() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('pending_review');
    const [riskLevel, setRiskLevel] = useState('Low');
    const [activeTab, setActiveTab] = useState('Overview');

    // Modals
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [emailSubject, setEmailSubject] = useState('Your KYC Application — Action Required');
    const [emailBody, setEmailBody] = useState('Dear Jennifer,\n\nWe are reviewing your KYC application and require additional information.\n\nPlease log in to your account and provide the requested details.\n\nRegards,\nBrickBanq Compliance Team');
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const handleRequestMoreInfo = async () => {
        setSending(true);
        await new Promise(r => setTimeout(r, 900));
        setSending(false);
        setRequestSent(true);
        setShowRequestModal(false);
        setRequestMessage('');
    };

    const handleEmailApplicant = async () => {
        setSending(true);
        await new Promise(r => setTimeout(r, 900));
        setSending(false);
        setShowEmailModal(false);
    };

    const handleDownloadAllDocuments = async () => {
        setDownloading(true);
        try {
            await generateBrandedPDF({
                title: 'KYC Application Documents — Jennifer Brown',
                role: 'Admin',
                sections: [
                    {
                        heading: 'Applicant Details',
                        head: ['Field', 'Value'],
                        rows: [
                            ['Full Name', 'Jennifer Brown'],
                            ['Date of Birth', '15/03/1985'],
                            ['Email', 'jennifer.brown@example.com'],
                            ['Phone', '+61 412 345 678'],
                            ['Address', '123 Collins Street, Melbourne VIC 3000'],
                            ['Nationality', 'Australian'],
                            ['Role', 'Investor'],
                            ['KYC Status', status],
                            ['Risk Level', riskLevel],
                        ],
                    },
                    {
                        heading: 'Documents Submitted',
                        head: ['Document', 'Status'],
                        rows: [
                            ['Passport / Driver Licence', 'Verified'],
                            ['Proof of Address', 'Verified'],
                            ['ABN Certificate', 'Verified'],
                            ['Company ASIC Extract', 'Verified'],
                            ['Source of Funds Declaration', 'Verified'],
                            ['Beneficial Ownership Form', 'Verified'],
                        ],
                    },
                    {
                        heading: 'Compliance Checks',
                        head: ['Check', 'Result'],
                        rows: [
                            ['PEP Status', 'No'],
                            ['Sanctions Match', 'No'],
                            ['Adverse Media', 'None'],
                            ['Fraud Score', '2 (Low)'],
                            ['Document Authenticity', '98%'],
                            ['Facial Recognition Match', '96%'],
                        ],
                    },
                ],
                fileName: `kyc-documents-jennifer-brown-${new Date().toISOString().split('T')[0]}.pdf`,
            });
        } catch { /* ignore */ } finally {
            setDownloading(false);
        }
    };

    const tabs = ['Overview', 'Documents (6)', 'Verification Checklist'];

    return (
        <div className="space-y-6 pb-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/admin/dashboard')} className="hover:text-gray-900">⌂</button>
                <ChevronRight className="w-4 h-4" />
                <button onClick={() => navigate('/admin/kyc-review')} className="hover:text-gray-900">Admin</button>
                <ChevronRight className="w-4 h-4" />
                <button onClick={() => navigate('/admin/kyc-review')} className="hover:text-gray-900">KYC Review</button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">Jennifer Brown</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KYC Review</h1>
                    <p className="text-sm text-gray-500 mt-1">Submitted 13/03/2026, 12:23:11 pm</p>
                </div>
                <div className={`px-3 py-1.5 font-medium rounded-full text-sm self-start ${
                    status === 'approved' ? 'bg-green-100 text-green-700' :
                    status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-indigo-600 text-white'
                }`}>
                    {status === 'pending_review' ? 'Pending Review' : status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
            </div>

            {requestSent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Information request sent to applicant.
                </div>
            )}

            {/* Decision Bar */}
            {status === 'pending_review' && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm text-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Ready for Decision</h3>
                            <p className="text-gray-500 text-sm">100% of required checks completed</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <AlertCircle className="w-4 h-4 text-gray-500" /> Request More Info
                        </button>
                        <button
                            onClick={() => setStatus('rejected')}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                            onClick={() => setStatus('approved')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 text-white" /> Approve KYC
                        </button>
                    </div>
                </div>
            )}

            {/* AI Assessment */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="bg-emerald-600 text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold text-2xl flex-shrink-0">92</div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">🤖 AI Assessment</h3>
                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Approve</span>
                            <span className="text-emerald-700 text-sm font-medium">94% confidence</span>
                        </div>
                        <p className="text-emerald-800 text-sm">High-quality application with strong verification signals. All automated checks passed. Low fraud risk. Recommend approval.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Document Authenticity', pct: '98%' },
                        { label: 'Facial Recognition Match', pct: '96%' },
                        { label: 'Address Validation', pct: '95%' },
                        { label: 'Fraud Pattern Detection', pct: '99%' },
                    ].map(({ label, pct }) => (
                        <div key={label} className="bg-white rounded-lg p-3 border border-emerald-100">
                            <div className="flex justify-between items-start mb-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600 font-bold text-sm">{pct}</span>
                            </div>
                            <div className="text-emerald-900 font-medium text-xs">{label}</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-800 font-medium bg-emerald-100/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2"><span className="bg-emerald-200 w-5 h-5 rounded flex items-center justify-center text-xs">2</span> Fraud Score (low)</div>
                    <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Trusted Device</div>
                    <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Clean IP Reputation</div>
                    <div className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 0 Behavioral Flags</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                    activeTab === tab
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab === 'Overview' && <Shield className="w-4 h-4" />}
                                {tab.startsWith('Documents') && <FileText className="w-4 h-4" />}
                                {tab === 'Verification Checklist' && <CheckSquare className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'Overview' && (
                        <>
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4"><span className="text-indigo-600">👤</span> Personal Information</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {[
                                        { label: 'Full Name', value: 'Jennifer Brown' },
                                        { label: 'Date of Birth', value: '15/03/1985' },
                                        { label: 'Email', value: 'jennifer.brown@example.com' },
                                        { label: 'Phone', value: '+61 412 345 678' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">{label}</span>
                                            <span className="text-sm text-gray-900 font-semibold">{value}</span>
                                        </div>
                                    ))}
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">123 Collins Street, Melbourne VIC 3000</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Nationality</span>
                                        <span className="text-sm text-gray-900 font-semibold">Australian</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Role</span>
                                        <span className="text-xs mt-1 inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium">Investor</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4"><span className="text-indigo-600">🏢</span> Organization Information</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Company Name</span>
                                        <span className="text-sm text-gray-900 font-semibold">Brown Capital Partners Pty Ltd</span>
                                    </div>
                                    {[
                                        { label: 'ABN', value: '12 345 678 901' },
                                        { label: 'ACN', value: '123 456 789' },
                                        { label: 'Entity Type', value: 'Private Company' },
                                        { label: 'Website', value: 'www.browncapital.com.au' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">{label}</span>
                                            <span className="text-sm text-gray-900 font-semibold">{value}</span>
                                        </div>
                                    ))}
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Business Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">123 Collins Street, Melbourne VIC 3000</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4"><span className="text-indigo-600">🛡</span> Risk Assessment</h3>
                                <div className={`border rounded-lg p-4 mb-4 ${riskLevel === 'High' ? 'border-red-200 bg-red-50' : riskLevel === 'Low' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                    <div className={`text-sm font-medium mb-1 ${riskLevel === 'High' ? 'text-red-800' : riskLevel === 'Low' ? 'text-emerald-800' : 'text-amber-800'}`}>Overall Risk Level</div>
                                    <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={`text-xl font-bold bg-transparent focus:outline-none ${riskLevel === 'High' ? 'text-red-600' : riskLevel === 'Low' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'PEP Status', value: 'No', ok: true },
                                        { label: 'Sanctions Match', value: 'No', ok: true },
                                        { label: 'Adverse Media', value: 'None', ok: true },
                                        { label: 'Estimated Wealth', value: '$2M - $5M', ok: null },
                                    ].map(({ label, value, ok }) => (
                                        <div key={label} className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">{label}</span>
                                            <span className={`text-sm font-semibold flex items-center gap-1 ${ok ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                {ok && <CheckCircle className="w-4 h-4" />}{value}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Source of Funds</span>
                                        <span className="text-sm text-gray-900 font-semibold">Employment Income & Investments</span>
                                    </div>
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Transaction Profile</span>
                                        <span className="text-sm text-gray-900 font-semibold">Medium frequency, consistent amounts</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Documents (6)' && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Submitted Documents</h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'Passport / Driver Licence', type: 'Identity', status: 'Verified' },
                                    { name: 'Proof of Address', type: 'Address', status: 'Verified' },
                                    { name: 'ABN Certificate', type: 'Business', status: 'Verified' },
                                    { name: 'Company ASIC Extract', type: 'Business', status: 'Verified' },
                                    { name: 'Source of Funds Declaration', type: 'Financial', status: 'Verified' },
                                    { name: 'Beneficial Ownership Form', type: 'Compliance', status: 'Verified' },
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                                                <p className="text-xs text-gray-500">{doc.type}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {doc.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Verification Checklist' && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Checklist</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Identity documents uploaded and verified', done: true },
                                    { label: 'Facial recognition match confirmed (≥90%)', done: true },
                                    { label: 'Address verification completed', done: true },
                                    { label: 'ABN / ACN validated via ABR', done: true },
                                    { label: 'PEP screening completed — no match', done: true },
                                    { label: 'Sanctions check completed — no match', done: true },
                                    { label: 'Adverse media search — no findings', done: true },
                                    { label: 'Source of funds documented', done: true },
                                    { label: 'Beneficial ownership structure reviewed', done: true },
                                    { label: 'AML/CTF risk rating assigned', done: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                            {item.done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm ${item.done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Completion Status */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col items-center">
                        <h3 className="w-full text-base font-bold text-gray-900 mb-6">Completion Status</h3>
                        <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle className="text-gray-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                                <circle className="text-emerald-500 stroke-current" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="0" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-gray-900">100%</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Required checks completed</p>
                        <div className="w-full space-y-3">
                            {[
                                { label: 'Documents:', value: '6/6', color: '' },
                                { label: 'Identity:', value: 'Verified', color: 'text-emerald-600', icon: true },
                                { label: 'Address:', value: 'Verified', color: 'text-emerald-600', icon: true },
                                { label: 'Business:', value: 'Verified', color: 'text-emerald-600', icon: true },
                                { label: 'AML/CTF:', value: 'Cleared', color: 'text-emerald-600', icon: true },
                            ].map(({ label, value, color, icon }) => (
                                <div key={label} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className={`font-semibold ${color || 'text-gray-900'} flex items-center gap-1`}>
                                        {icon && <CheckCircle className="w-3.5 h-3.5" />}{value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-6">Timeline</h3>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:to-gray-200">
                            {[
                                { title: 'Assigned for manual review', by: 'System', when: '13/03/2026, 12:23:11 pm', color: 'bg-indigo-100', dot: 'bg-indigo-500' },
                                { title: 'Automated verification checks passed', by: 'System', when: '13/03/2026, 11:53:11 am', color: 'bg-emerald-100', icon: true },
                                { title: 'All documents uploaded', by: 'Jennifer Brown', when: '13/03/2026, 11:23:11 am', color: 'bg-emerald-100', icon: true },
                                { title: 'KYC Application Submitted', by: 'Jennifer Brown', when: '13/03/2026, 11:23:11 am', color: 'bg-emerald-100', icon: true },
                            ].map((item, i) => (
                                <div key={i} className="relative flex items-start gap-4">
                                    <div className={`absolute left-1/2 md:left-auto w-5 h-5 ${item.color} rounded-full border-4 border-white flex items-center justify-center -ml-2.5 shadow-sm z-10`}>
                                        {item.icon ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                                    </div>
                                    <div className="pl-6 md:pl-8">
                                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                                        <div className="text-xs text-gray-500 mt-1">{item.by}</div>
                                        <div className="text-xs text-gray-400">{item.when}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowEmailModal(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
                            >
                                <Mail className="w-4 h-4 text-gray-400" /> Email Applicant
                            </button>
                            <button
                                onClick={handleDownloadAllDocuments}
                                disabled={downloading}
                                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition disabled:opacity-70"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Download className="w-4 h-4 text-gray-400" />}
                                {downloading ? 'Downloading...' : 'Download All Documents'}
                            </button>
                            <button
                                onClick={() => navigate('/admin/audit')}
                                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
                            >
                                <Activity className="w-4 h-4 text-gray-400" /> View Activity Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request More Info Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Request More Information</h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Describe what additional information is required from <strong>Jennifer Brown</strong>:</p>
                            <textarea
                                value={requestMessage}
                                onChange={e => setRequestMessage(e.target.value)}
                                rows={5}
                                placeholder="e.g. Please provide a certified copy of your passport and an updated proof of address dated within the last 3 months."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowRequestModal(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button onClick={handleRequestMoreInfo} disabled={!requestMessage.trim() || sending} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {sending ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Applicant Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Email Applicant</h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">To</label>
                                <input type="text" value="jennifer.brown@example.com" disabled className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject</label>
                                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
                                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowEmailModal(false)} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button onClick={handleEmailApplicant} disabled={sending} className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {sending ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
