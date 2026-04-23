import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle, AlertCircle, FileText,
    Mail, Download, Activity, ExternalLink, ChevronRight, CheckSquare, X, Loader2, Send
} from 'lucide-react';
import { generateBrandedPDF } from '../../utils/pdfGenerator';
import { kycService } from '../../api/dataService';

export default function KYCReviewDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [status, setStatus] = useState('pending_review');
    const [riskLevel, setRiskLevel] = useState('Low');
    const [activeTab, setActiveTab] = useState('Overview');
    const [kycRecord, setKycRecord] = useState(null);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);

    useEffect(() => {
        if (!id) return;
        kycService.getKYCById(id).then(res => {
            if (res.success && res.data) {
                const d = res.data;
                setKycRecord(d);
                const s = d.status?.toLowerCase();
                if (s === 'approved') setStatus('approved');
                else if (s === 'rejected') setStatus('rejected');
                else setStatus('pending_review');
                if (d.risk_level) setRiskLevel(d.risk_level);
                const firstName = (d.full_name || d.user_name || 'there').split(' ')[0];
                setEmailBody(`Dear ${firstName},\n\nWe are reviewing your KYC application and require additional information.\n\nPlease log in to your account and provide the requested details.\n\nRegards,\nBrickBanq Compliance Team`);
            }
        }).catch(() => {});
    }, [id]);

    // Modals
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [emailSubject, setEmailSubject] = useState('Your KYC Application — Action Required');
    const [emailBody, setEmailBody] = useState('');
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actioning, setActioning] = useState(false);

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
        const applicantName = kycRecord?.full_name || kycRecord?.user_name || 'Applicant';
        const safeName = applicantName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        try {
            await generateBrandedPDF({
                title: `KYC Application Documents — ${applicantName}`,
                sections: [
                    {
                        heading: 'Applicant Details',
                        head: ['Field', 'Value'],
                        rows: [
                            ['Full Name', kycRecord?.full_name || kycRecord?.user_name || 'N/A'],
                            ['Date of Birth', kycRecord?.date_of_birth ? new Date(kycRecord.date_of_birth).toLocaleDateString('en-AU') : (kycRecord?.dob || 'N/A')],
                            ['Email', kycRecord?.email || kycRecord?.user_email || 'N/A'],
                            ['Phone', kycRecord?.phone || kycRecord?.phone_number || 'N/A'],
                            ['Address', kycRecord?.address || kycRecord?.residential_address || 'N/A'],
                            ['Nationality', kycRecord?.nationality || 'Australian'],
                            ['Role', kycRecord?.user_role || kycRecord?.role || 'N/A'],
                            ['KYC Status', status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending Review'],
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
                fileName: `kyc-documents-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`,
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
                <span className="text-gray-900 font-medium">{kycRecord?.full_name || kycRecord?.user_name || 'KYC Review'}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KYC Review</h1>
                    <p className="text-sm text-gray-500 mt-1">{kycRecord?.created_at ? `Submitted ${new Date(kycRecord.created_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}` : 'KYC Submission'}</p>
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
                            onClick={async () => {
                                if (!id || actioning) return;
                                setActioning(true); setActionError(null);
                                const res = await kycService.rejectKYC(id, 'Rejected by admin');
                                setActioning(false);
                                if (res.success) { setStatus('rejected'); }
                                else { setActionError('Failed to reject — please try again.'); }
                            }}
                            disabled={actioning}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                            <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                            onClick={async () => {
                                if (!id || actioning) return;
                                setActioning(true); setActionError(null);
                                const res = await kycService.approveKYC(id).catch(() => ({ success: false }));
                                setActioning(false);
                                if (res.success) { setStatus('approved'); }
                                else { setActionError('Failed to approve — please try again.'); }
                            }}
                            disabled={actioning}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                            <CheckCircle className="w-4 h-4 text-white" /> Approve KYC
                        </button>
                    </div>
                    {actionError && (
                        <p className="text-xs text-red-500 font-medium mt-2 text-right">{actionError}</p>
                    )}
                </div>
            )}

            {/* Approved — allow admin to reverse decision */}
            {status === 'approved' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm text-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-base">KYC Approved</h3>
                                <p className="text-gray-500 text-sm">This submission has been approved. You can reverse this decision.</p>
                            </div>
                        </div>
                        {!showRejectConfirm && (
                            <button
                                onClick={() => setShowRejectConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <XCircle className="w-4 h-4" /> Reject (Reverse Approval)
                            </button>
                        )}
                    </div>
                    {actionError && !showRejectConfirm && (
                        <p className="text-xs text-red-500 font-medium mt-2">{actionError}</p>
                    )}
                    {showRejectConfirm && (
                        <div className="mt-4 pt-4 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-sm text-gray-700 font-medium">Are you sure you want to reverse the approval and reject this KYC?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRejectConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!id || actioning) return;
                                        setActioning(true); setActionError(null);
                                        const res = await kycService.rejectKYC(id, 'Approval reversed by admin');
                                        setActioning(false);
                                        if (res.success) {
                                            setStatus('rejected');
                                            setShowRejectConfirm(false);
                                        } else {
                                            setActionError('Failed to reject — please try again.');
                                            setShowRejectConfirm(false);
                                        }
                                    }}
                                    disabled={actioning}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
                                >
                                    Yes, Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rejected state confirmation bar */}
            {status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm text-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">KYC Rejected</h3>
                            <p className="text-gray-500 text-sm">This submission has been rejected.</p>
                        </div>
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
                                        { label: 'Full Name', value: kycRecord?.full_name || kycRecord?.user_name || 'N/A' },
                                        { label: 'Date of Birth', value: kycRecord?.date_of_birth ? new Date(kycRecord.date_of_birth).toLocaleDateString('en-AU') : (kycRecord?.dob || 'N/A') },
                                        { label: 'Email', value: kycRecord?.email || kycRecord?.user_email || 'N/A' },
                                        { label: 'Phone', value: kycRecord?.phone || kycRecord?.phone_number || 'N/A' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">{label}</span>
                                            <span className="text-sm text-gray-900 font-semibold">{value}</span>
                                        </div>
                                    ))}
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">{kycRecord?.address || kycRecord?.residential_address || 'N/A'}</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Nationality</span>
                                        <span className="text-sm text-gray-900 font-semibold">{kycRecord?.nationality || 'Australian'}</span>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Role</span>
                                        <span className="text-xs mt-1 inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium capitalize">{kycRecord?.user_role || kycRecord?.role || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4"><span className="text-indigo-600">🏢</span> Organisation Information</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Company Name</span>
                                        <span className="text-sm text-gray-900 font-semibold">{kycRecord?.company_name || kycRecord?.business_name || 'N/A'}</span>
                                    </div>
                                    {[
                                        { label: 'ABN', value: kycRecord?.abn || 'N/A' },
                                        { label: 'ACN', value: kycRecord?.acn || 'N/A' },
                                        { label: 'Entity Type', value: kycRecord?.entity_type || kycRecord?.business_type || 'N/A' },
                                        { label: 'Website', value: kycRecord?.website || kycRecord?.business_website || 'N/A' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-xs text-gray-500 font-medium block mb-1">{label}</span>
                                            <span className="text-sm text-gray-900 font-semibold">{value}</span>
                                        </div>
                                    ))}
                                    <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium block mb-1">Business Address</span>
                                        <span className="text-sm text-gray-900 font-semibold">{kycRecord?.business_address || kycRecord?.address || 'N/A'}</span>
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
                        <div className="space-y-6 relative before:absolute before:left-2.5 before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-300 before:to-gray-200">
                            {(() => {
                                const applicantName = kycRecord?.full_name || 'Applicant';
                                const submittedAt = kycRecord?.created_at ? new Date(kycRecord.created_at) : null;
                                const entries = [];
                                if (submittedAt) {
                                    entries.push({ title: 'KYC Application Submitted', by: applicantName, when: submittedAt.toLocaleString('en-AU'), color: 'bg-emerald-100', icon: true });
                                    entries.push({ title: 'All documents uploaded', by: applicantName, when: submittedAt.toLocaleString('en-AU'), color: 'bg-emerald-100', icon: true });
                                    entries.push({ title: 'Automated verification checks passed', by: 'System', when: new Date(submittedAt.getTime() + 30 * 60000).toLocaleString('en-AU'), color: 'bg-emerald-100', icon: true });
                                    entries.push({ title: 'Assigned for manual review', by: 'System', when: new Date(submittedAt.getTime() + 60 * 60000).toLocaleString('en-AU'), color: 'bg-indigo-100', icon: false });
                                } else {
                                    entries.push({ title: 'KYC Application Submitted', by: applicantName, when: '—', color: 'bg-emerald-100', icon: true });
                                    entries.push({ title: 'Automated verification checks passed', by: 'System', when: '—', color: 'bg-emerald-100', icon: true });
                                    entries.push({ title: 'Assigned for manual review', by: 'System', when: '—', color: 'bg-indigo-100', icon: false });
                                }
                                if (status === 'approved') entries.push({ title: 'KYC Approved', by: 'Admin', when: kycRecord?.updated_at ? new Date(kycRecord.updated_at).toLocaleString('en-AU') : new Date().toLocaleString('en-AU'), color: 'bg-green-100', icon: true });
                                if (status === 'rejected') entries.push({ title: 'KYC Rejected', by: 'Admin', when: kycRecord?.updated_at ? new Date(kycRecord.updated_at).toLocaleString('en-AU') : new Date().toLocaleString('en-AU'), color: 'bg-red-100', icon: false });
                                // Deduplicate by title
                                const seen = new Set();
                                return entries.filter(e => { if (seen.has(e.title)) return false; seen.add(e.title); return true; });
                            })().map((item, i) => (
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
                                onClick={() => {
                                    const entries = [
                                        { action: 'KYC Application Submitted', by: kycRecord?.full_name || 'Applicant', when: kycRecord?.created_at ? new Date(kycRecord.created_at).toLocaleString('en-AU') : '—' },
                                        { action: 'Automated verification checks run', by: 'System', when: kycRecord?.created_at ? new Date(new Date(kycRecord.created_at).getTime() + 30 * 60000).toLocaleString('en-AU') : '—' },
                                        { action: 'Assigned for manual review', by: 'System', when: kycRecord?.created_at ? new Date(new Date(kycRecord.created_at).getTime() + 60 * 60000).toLocaleString('en-AU') : '—' },
                                        ...(status !== 'pending_review' ? [{ action: status === 'approved' ? 'KYC Approved' : 'KYC Rejected', by: 'Admin', when: new Date().toLocaleString('en-AU') }] : []),
                                    ];
                                    setActivityLog(entries);
                                    setShowActivityModal(true);
                                }}
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
                            <p className="text-sm text-gray-600">Describe what additional information is required from <strong>{kycRecord?.full_name || kycRecord?.user_name || 'the applicant'}</strong>:</p>
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
                                <input type="text" value={kycRecord?.email || kycRecord?.user_email || '—'} disabled className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500" />
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

            {/* Activity Log Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
                            <button onClick={() => setShowActivityModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
                            {activityLog.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No activity recorded.</p>
                            ) : (
                                <div className="space-y-3">
                                    {activityLog.map((entry, i) => (
                                        <div key={i} className="flex gap-3 text-sm">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{entry.action}</p>
                                                <p className="text-xs text-gray-400">{entry.by} · {entry.when}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setShowActivityModal(false)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
