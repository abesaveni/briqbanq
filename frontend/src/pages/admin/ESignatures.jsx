import { useState, useEffect } from 'react'
import { borrowerApi } from '../borrower/api'
import { generateBrandedPDF } from '../../utils/pdfGenerator'
const GOVSIGN_TABS = [
  'Dashboard',
  'Envelopes',
  'Documents',
  'Templates',
  'Certificates & Keys',
  'Evidence Ledger',
  'Reports',
  'Admin',
  'Help',
]

function getMockGovSignData() {
  return {
    stats: {}, tasks: [], alerts: [], activity: [],
    envelopes: [], documents: [], templates: [],
    hsmCluster: {}, certificates: [], evidenceChain: {},
    evidenceEvents: [], adminSovereignty: {}, adminPolicies: [],
    adminSecurity: [], reportTypes: [], reports: [],
    helpFaq: [], helpLinks: [],
  }
}

export default function ESignatures() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [envelopeSearch, setEnvelopeSearch] = useState('')
  const [evidenceSearch, setEvidenceSearch] = useState('')
  const [documentSearch, setDocumentSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [adminToggles, setAdminToggles] = useState({})
  const [signedIds, setSignedIds] = useState(new Set())
  const [documents, setDocuments] = useState([])
  const [templates, setTemplates] = useState([])
  const [envelopes, setEnvelopes] = useState([])
  const [showCreateEnvelopeModal, setShowCreateEnvelopeModal] = useState(false)
  const [signModalEnv, setSignModalEnv] = useState(null)
  const [certificateModal, setCertificateModal] = useState(false)
  const [sovereigntyModal, setSovereigntyModal] = useState(false)
  const [createTemplateModal, setCreateTemplateModal] = useState(false)
  const [certificateDetail, setCertificateDetail] = useState(null)
  const [createEnvelopeForm, setCreateEnvelopeForm] = useState({ title: '', type: 'Procurement', risk: 'OFFICIAL', progress: '0/1' })
  const [viewingEnvelope, setViewingEnvelope] = useState(null)
  const [viewingDocument, setViewingDocument] = useState(null)
  const [envelopeActionsOpen, setEnvelopeActionsOpen] = useState(null)
  const [showIssueCertificateModal, setShowIssueCertificateModal] = useState(false)
  const [issueCertificateForm, setIssueCertificateForm] = useState({
    subjectName: 'CN=John Smith, O=Organisation, OU=Department, C=AU',
    clearanceLevel: 'OFFICIAL',
    validityPeriod: '1 year',
    signatureAlgorithm: 'RSA-4096 + SHA-512',
  })
  const [issuedCertificates, setIssuedCertificates] = useState([])
  const [showNewPolicyRuleModal, setShowNewPolicyRuleModal] = useState(false)
  const [newPolicyRuleForm, setNewPolicyRuleForm] = useState({ title: '', description: '', scope: 'All organisations', status: 'Active' })
  const [localPolicyRules, setLocalPolicyRules] = useState([])
  const [createTemplateForm, setCreateTemplateForm] = useState({ name: '', type: 'Procurement', description: '' })
  const [documentTypeFilter, setDocumentTypeFilter] = useState('All Types')
  const [documentStatusFilter, setDocumentStatusFilter] = useState('All Statuses')
  const [showUploadDocumentModal, setShowUploadDocumentModal] = useState(false)
  const [uploadDocumentForm, setUploadDocumentForm] = useState({ name: '', type: 'PDF', envelopeId: '' })
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editTemplateForm, setEditTemplateForm] = useState({ name: '', type: 'Procurement', description: '' })
  const [reports, setReports] = useState([])
  const [reportTypeFilter, setReportTypeFilter] = useState('envelope-summary')
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [helpSearch, setHelpSearch] = useState('')
  const [expandedFaqId, setExpandedFaqId] = useState(null)
  const [showEnvelopeFilters, setShowEnvelopeFilters] = useState(false)
  const [envelopeTypeFilter, setEnvelopeTypeFilter] = useState('All Types')
  const [envelopeStatusFilter, setEnvelopeStatusFilter] = useState('All Statuses')
  const [showDocumentFilters, setShowDocumentFilters] = useState(false)
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState('All Types')
  const [evidenceActorFilter, setEvidenceActorFilter] = useState('All Actors')
  const [showEvidenceFilters, setShowEvidenceFilters] = useState(false)
  const [showConfigureHsmModal, setShowConfigureHsmModal] = useState(false)
  const [hsmConfig, setHsmConfig] = useState({ keyRetention: '90', backupEnabled: true, autoRotate: true, auditLevel: 'Full' })

  useEffect(() => {
    let cancelled = false
    borrowerApi
      .getGovSignData()
      .then((res) => {
        if (cancelled) return
        const payload = res?.data || {}
        setData({
          stats: payload.stats ?? {},
          tasks: payload.tasks ?? [],
          alerts: payload.alerts ?? [],
          activity: payload.activity ?? [],
          envelopes: payload.envelopes ?? [],
          documents: payload.documents ?? [],
          templates: payload.templates ?? [],
          hsmCluster: payload.hsmCluster ?? {},
          certificates: payload.certificates ?? [],
          evidenceChain: payload.evidenceChain ?? {},
          evidenceEvents: payload.evidenceEvents ?? [],
          adminSovereignty: Array.isArray(payload.adminSovereignty) ? payload.adminSovereignty : [],
          adminPolicies: payload.adminPolicies ?? [],
          adminSecurity: payload.adminSecurity ?? [],
          reportTypes: payload.reportTypes ?? [],
          reports: payload.reports ?? [],
          helpFaq: payload.helpFaq ?? [],
          helpLinks: payload.helpLinks ?? [],
        })
        setEnvelopes(payload.envelopes ?? [])
        setDocuments(payload.documents ?? [])
        setTemplates(payload.templates ?? [])
        setReports(payload.reports ?? [])
        const initial = {}
        ;(payload.adminSecurity ?? []).forEach((s) => {
          initial[s.id] = s.enabled
        })
        setAdminToggles(initial)
      })
      .catch(() => {
        if (cancelled) return
        const mock = getMockGovSignData()
        setData(mock)
        setEnvelopes(mock.envelopes)
        setDocuments(mock.documents)
        setTemplates(mock.templates)
        setReports(mock.reports ?? [])
        const initial = {}
        mock.adminSecurity.forEach((s) => {
          initial[s.id] = s.enabled
        })
        setAdminToggles(initial)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const stats = data?.stats ?? {}
  const tasks = data?.tasks ?? []
  const alerts = data?.alerts ?? []
  const activity = data?.activity ?? []
  const hsmCluster = data?.hsmCluster ?? {}
  const certificates = Array.isArray(data?.certificates) ? data.certificates : []
  const certificatesDisplay = [...certificates, ...(Array.isArray(issuedCertificates) ? issuedCertificates : [])]
  const evidenceChain = data?.evidenceChain ?? {}
  const evidenceEvents = data?.evidenceEvents ?? []
  const adminSovereignty = Array.isArray(data?.adminSovereignty) ? data.adminSovereignty : []
  const adminPolicies = Array.isArray(data?.adminPolicies) ? data.adminPolicies : []
  const adminPoliciesDisplay = [...adminPolicies, ...(Array.isArray(localPolicyRules) ? localPolicyRules : [])]
  const adminSecurity = data?.adminSecurity ?? []
  const DEFAULT_REPORT_TYPES = [
    { id: 'envelope-summary', name: 'Envelope Summary', description: 'Summary of all envelopes and their signing status.' },
    { id: 'signing-activity', name: 'Signing Activity', description: 'Detailed log of all signing events within the date range.' },
    { id: 'certificate-status', name: 'Certificate Status', description: 'Current status and validity of all digital certificates.' },
    { id: 'evidence-audit', name: 'Evidence Audit Trail', description: 'Full cryptographic evidence chain for compliance auditing.' },
    { id: 'user-access', name: 'User Access Report', description: 'Record of all user access and authentication events.' },
  ]
  const reportTypes = (data?.reportTypes ?? []).length > 0 ? data.reportTypes : DEFAULT_REPORT_TYPES
  const helpFaq = data?.helpFaq ?? []
  const helpLinks = data?.helpLinks ?? []
  const filteredFaq = helpSearch
    ? helpFaq.filter(
        (f) =>
          f.question.toLowerCase().includes(helpSearch.toLowerCase()) ||
          f.answer.toLowerCase().includes(helpSearch.toLowerCase())
      )
    : helpFaq

  const documentsList = documents.length ? documents : (data?.documents ?? [])
  const templatesList = templates.length ? templates : (data?.templates ?? [])

  const filteredEnvelopes = envelopes.filter((e) => {
    if (envelopeSearch && ![e.id, e.title, e.sender, e.type].some((v) => String(v).toLowerCase().includes(envelopeSearch.toLowerCase()))) return false
    if (envelopeTypeFilter !== 'All Types' && e.type !== envelopeTypeFilter) return false
    if (envelopeStatusFilter !== 'All Statuses' && e.status !== envelopeStatusFilter) return false
    return true
  })
  const evidenceTypeOptions = ['All Types', ...Array.from(new Set((evidenceEvents || []).map((e) => e.type).filter(Boolean)))]
  const evidenceActorOptions = ['All Actors', ...Array.from(new Set((evidenceEvents || []).map((e) => e.actor).filter(Boolean)))]
  const filteredEvidence = (evidenceEvents || []).filter((e) => {
    if (evidenceSearch && ![e.id, e.type, e.actor].some((v) => String(v).toLowerCase().includes(evidenceSearch.toLowerCase()))) return false
    if (evidenceTypeFilter !== 'All Types' && e.type !== evidenceTypeFilter) return false
    if (evidenceActorFilter !== 'All Actors' && e.actor !== evidenceActorFilter) return false
    return true
  })
  const filteredDocuments = documentsList.filter((d) => {
    if (documentSearch && ![d.name, d.type, d.uploadedBy, d.status, d.envelopeId].some((v) => String(v || '').toLowerCase().includes(documentSearch.toLowerCase()))) return false
    if (documentTypeFilter !== 'All Types' && d.type !== documentTypeFilter) return false
    if (documentStatusFilter !== 'All Statuses' && d.status !== documentStatusFilter) return false
    return true
  })

  const documentStats = {
    total: documentsList.length,
    signed: documentsList.filter((d) => d.status === 'Signed').length,
    pending: documentsList.filter((d) => d.status === 'Pending').length,
    inSigning: documentsList.filter((d) => d.status === 'In Signing').length,
  }
  const filteredTemplates = templatesList.filter(
    (t) =>
      !templateSearch ||
      [t.name, t.type, t.description].some((v) => String(v || '').toLowerCase().includes(templateSearch.toLowerCase()))
  )

  useEffect(() => {
    const handler = (e) => {
      if (envelopeActionsOpen != null && !e.target.closest('[data-envelope-actions]')) setEnvelopeActionsOpen(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [envelopeActionsOpen])

  const triggerFileDownload = (filename, content, mimeType = 'application/pdf') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCreateEnvelope = () => setShowCreateEnvelopeModal(true)
  const handleViewAllEnvelopes = () => setActiveTab('Envelopes')
  const handleViewEnvelope = (envelope) => {
    if (envelope) setViewingEnvelope(envelope)
    setEnvelopeActionsOpen(null)
  }
  const handleDownloadEnvelope = async (envelope) => {
    if (!envelope) return
    setEnvelopeActionsOpen(null)
    await generateBrandedPDF({
      title: envelope.title || 'Envelope',
      subtitle: `Type: ${envelope.type || '—'} · Status: ${envelope.status || '—'}`,
      fileName: `envelope-${(envelope.id || 'unknown').replace(/\s+/g, '_')}.pdf`,
      infoItems: [
        { label: 'Envelope ID', value: envelope.id || '—' },
        { label: 'Type', value: envelope.type || '—' },
        { label: 'Status', value: envelope.status || '—' },
        { label: 'Progress', value: envelope.progress || '—' },
        { label: 'SLA', value: envelope.sla || '—' },
        { label: 'Risk Level', value: envelope.risk || '—' },
      ],
    })
  }
  const handleEnvelopeActions = (row) => () => setEnvelopeActionsOpen((prev) => (prev === row.id ? null : row.id))
  const handleReviewSign = (task) => () => setSignModalEnv(task)
  const handleConfirmSign = () => {
    if (signModalEnv) setSignedIds((prev) => new Set(prev).add(signModalEnv.id))
    setSignModalEnv(null)
  }
  const handleRenewCertificate = () => setCertificateModal(true)
  const handleCloseCertificateModal = () => setCertificateModal(false)
  const handleSovereignty = () => setSovereigntyModal(true)
  const handleExportLedger = async () => {
    await generateBrandedPDF({
      title: 'Evidence Ledger Proof',
      subtitle: `Chain Integrity: ${evidenceChain.chainIntegrity || '—'} · Total Events: ${evidenceChain.totalEvents || 0}`,
      fileName: `evidence-ledger-${new Date().toISOString().slice(0, 10)}.pdf`,
      infoItems: [
        { label: 'Chain Integrity', value: evidenceChain.chainIntegrity || '—' },
        { label: 'Total Events', value: String(evidenceChain.totalEvents || 0) },
        { label: 'Last Event', value: evidenceChain.lastEvent || '—' },
        { label: 'Export Date', value: new Date().toLocaleDateString('en-AU') },
      ],
      sections: filteredEvidence.length > 0 ? [{
        heading: 'Evidence Events',
        head: ['Event ID', 'Type', 'Actor', 'Timestamp', 'Hash'],
        rows: filteredEvidence.map((e) => [e.id || '—', e.type || '—', e.actor || '—', e.timestamp || '—', e.hash || '—']),
      }] : [],
    })
  }
  const handleIssueCertificate = () => setShowIssueCertificateModal(true)
  const handleConfigureHSM = () => setShowConfigureHsmModal(true)
  const closeIssueCertificateModal = () => {
    setShowIssueCertificateModal(false)
    setIssueCertificateForm({
      subjectName: 'CN=John Smith, O=Organisation, OU=Department, C=AU',
      clearanceLevel: 'OFFICIAL',
      validityPeriod: '1 year',
      signatureAlgorithm: 'RSA-4096 + SHA-512',
    })
  }
  const handleSubmitIssueCertificate = () => {
    if (!issueCertificateForm.subjectName.trim()) return
    const from = new Date()
    const years = issueCertificateForm.validityPeriod === '2 years' ? 2 : issueCertificateForm.validityPeriod === '3 years' ? 3 : 1
    const to = new Date(from)
    to.setFullYear(to.getFullYear() + years)
    const newCert = {
      id: `cert-issued-${Date.now()}`,
      subject: issueCertificateForm.subjectName.trim(),
      issuer: 'GovSign Root CA',
      serial: [...Array(8)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
      algorithm: issueCertificateForm.signatureAlgorithm,
      validFrom: from.toISOString().slice(0, 10),
      validTo: to.toISOString().slice(0, 10),
      status: 'Active',
      tags: ['HSM-Backed', issueCertificateForm.clearanceLevel],
    }
    setIssuedCertificates((prev) => [newCert, ...prev])
    closeIssueCertificateModal()
  }
  const handleCertificateExport = async (certId) => {
    const cert = certificatesDisplay.find((c) => c.id === certId)
    if (!cert) return
    await generateBrandedPDF({
      title: 'Digital Certificate',
      subtitle: cert.subject || certId,
      fileName: `certificate-${(cert.subject || certId).replace(/\s+/g, '_').slice(0, 40)}.pdf`,
      infoItems: [
        { label: 'Subject', value: cert.subject || '—' },
        { label: 'Issuer', value: cert.issuer || '—' },
        { label: 'Serial Number', value: cert.serial || '—' },
        { label: 'Algorithm', value: cert.algorithm || '—' },
        { label: 'Valid From', value: cert.validFrom || '—' },
        { label: 'Valid To', value: cert.validTo || '—' },
        { label: 'Status', value: cert.status || '—' },
      ],
    })
  }
  const handleCertificateView = (cert) => () => setCertificateDetail(cert)
  const [renewalToast, setRenewalToast] = useState(null)
  const handleCertificateRenew = (certId) => {
    const cert = certificatesDisplay.find((c) => c.id === certId)
    if (cert) {
      setRenewalToast(`Renewal requested for: ${cert.subject}. You will be notified when ready.`)
      setTimeout(() => setRenewalToast(null), 4000)
    }
  }
  const setAdminToggle = (id, value) => setAdminToggles((prev) => ({ ...prev, [id]: value }))
  const closeNewPolicyRuleModal = () => {
    setShowNewPolicyRuleModal(false)
    setNewPolicyRuleForm({ title: '', description: '', scope: 'All organisations', status: 'Active' })
  }
  const handleSubmitNewPolicyRule = () => {
    if (!newPolicyRuleForm.title.trim()) return
    const modified = `${new Date().toISOString().slice(0, 10)} by User`
    const newRule = {
      id: `policy-${Date.now()}`,
      title: newPolicyRuleForm.title.trim(),
      description: newPolicyRuleForm.description.trim() || '—',
      scope: newPolicyRuleForm.scope,
      modified,
      status: newPolicyRuleForm.status,
    }
    setLocalPolicyRules((prev) => [newRule, ...prev])
    closeNewPolicyRuleModal()
  }
  const handleNewPolicyRule = () => setShowNewPolicyRuleModal(true)
  const handleUploadDocument = () => setShowUploadDocumentModal(true)
  const handleSubmitUploadDocument = () => {
    if (!uploadDocumentForm.name.trim()) return
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: uploadDocumentForm.name.trim().replace(/\s+/g, '_') + (uploadDocumentForm.type === 'PDF' ? '.pdf' : '.docx'),
      type: uploadDocumentForm.type,
      size: '—',
      uploadedDate: new Date().toISOString().slice(0, 10),
      uploadedBy: 'You',
      status: 'Pending',
      envelopeId: uploadDocumentForm.envelopeId || null,
      hash: `sha256:${Math.random().toString(36).slice(2, 11)}...`,
    }
    setDocuments((prev) => [newDoc, ...prev])
    setShowUploadDocumentModal(false)
    setUploadDocumentForm({ name: '', type: 'PDF', envelopeId: '' })
  }
  const handleDocumentView = (doc) => {
    if (doc) setViewingDocument(doc)
  }
  const handleDocumentDownload = async (doc) => {
    if (!doc) return
    await generateBrandedPDF({
      title: doc.name || 'Document',
      subtitle: `Type: ${doc.type || '—'} · Status: ${doc.status || '—'}`,
      fileName: (doc.name || `document-${doc.id}`).replace(/\s+/g, '_').replace(/\.[^.]+$/, '') + '.pdf',
      infoItems: [
        { label: 'Document Name', value: doc.name || '—' },
        { label: 'Type', value: doc.type || '—' },
        { label: 'Status', value: doc.status || '—' },
        { label: 'Envelope ID', value: doc.envelopeId || '—' },
        { label: 'Uploaded By', value: doc.uploadedBy || '—' },
        { label: 'Upload Date', value: doc.uploadedDate || '—' },
        { label: 'Hash', value: doc.hash || '—' },
      ],
    })
  }
  const handleDocumentDelete = (id) => setDocuments((prev) => prev.filter((d) => d.id !== id))
  const handleCreateTemplate = () => setCreateTemplateModal(true)
  const handleEditTemplate = (t) => () => {
    setEditingTemplate(t)
    setEditTemplateForm({ name: t.name, type: t.type, description: t.description || '' })
  }
  const handleSaveEditTemplate = () => {
    if (!editingTemplate || !editTemplateForm.name.trim()) return
    setTemplates((prev) =>
      prev.map((x) =>
        x.id === editingTemplate.id
          ? { ...x, name: editTemplateForm.name.trim(), type: editTemplateForm.type, description: editTemplateForm.description.trim() || x.description }
          : x
      )
    )
    setEditingTemplate(null)
  }
  const handleGenerateReport = () => {
    setGeneratingReport(true)
    const typeInfo = reportTypes.find((r) => r.id === reportTypeFilter) || reportTypes[0]
    const from = reportDateFrom || new Date().toISOString().slice(0, 10)
    const to = reportDateTo || new Date().toISOString().slice(0, 10)
    setTimeout(() => {
      const newRpt = {
        id: `rpt-${Date.now()}`,
        name: `${typeInfo.name} - ${from} to ${to}`,
        type: reportTypeFilter,
        generatedAt: new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }),
        dateFrom: from,
        dateTo: to,
        status: 'Ready',
      }
      setReports((prev) => [newRpt, ...prev])
      setGeneratingReport(false)
    }, 1200)
  }
  const handleDownloadReport = async (r) => {
    if (!r) return
    await generateBrandedPDF({
      title: r.name || 'Report',
      subtitle: `Date range: ${r.dateFrom || '—'} — ${r.dateTo || '—'}`,
      fileName: `report-${(r.name || r.id || 'report').replace(/\s+/g, '_')}.pdf`,
      infoItems: [
        { label: 'Report Name', value: r.name || '—' },
        { label: 'Type', value: r.type || '—' },
        { label: 'Date From', value: r.dateFrom || '—' },
        { label: 'Date To', value: r.dateTo || '—' },
        { label: 'Generated', value: r.generatedAt || '—' },
        { label: 'Status', value: r.status || '—' },
      ],
    })
  }
  const handleToggleFaq = (id) => () => setExpandedFaqId((prev) => (prev === id ? null : id))
  const closeCreateTemplateModal = () => {
    setCreateTemplateModal(false)
    setCreateTemplateForm({ name: '', type: 'Procurement', description: '' })
  }
  const handleSubmitCreateTemplate = (e) => {
    e.preventDefault()
    if (!createTemplateForm.name.trim()) return
    const newTpl = {
      id: `tpl-${Date.now()}`,
      name: createTemplateForm.name.trim(),
      type: createTemplateForm.type,
      description: createTemplateForm.description.trim() || 'No description',
      lastUsed: new Date().toISOString().slice(0, 10),
      createdDate: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      usageCount: 0,
    }
    setTemplates((prev) => [newTpl, ...prev])
    closeCreateTemplateModal()
  }
  const handleUseTemplate = (id) => {
    const tpl = templatesList.find((t) => t.id === id)
    if (tpl) handleCreateEnvelope()
  }
  const handleTemplateDelete = (id) => setTemplates((prev) => prev.filter((t) => t.id !== id))
  const handleSubmitCreateEnvelope = () => {
    if (!createEnvelopeForm.title.trim()) return
    const progressStr = String(createEnvelopeForm.progress || '0/1').trim()
    const progressMatch = progressStr.match(/^(\d+)\s*\/\s*(\d+)$/)
    const progressVal = progressMatch
      ? Math.min(1, Math.max(0, Number(progressMatch[1]) / Number(progressMatch[2]) || 0))
      : 0
    const newEnv = {
      id: `MBI-2021-${String(envelopes.length + 1).padStart(4, '0')}`,
      title: createEnvelopeForm.title.trim(),
      sender: 'You',
      type: createEnvelopeForm.type,
      risk: createEnvelopeForm.risk || 'OFFICIAL',
      status: 'Draft',
      progress: progressStr || '0/1',
      progressVal,
      sla: '—',
    }
    setEnvelopes((prev) => [newEnv, ...prev])
    setShowCreateEnvelopeModal(false)
    setCreateEnvelopeForm({ title: '', type: 'Procurement', risk: 'OFFICIAL', progress: '0/1' })
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">Loading e-signatures...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {renewalToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm">
          {renewalToast}
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your mortgage resolution case</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* GovSign header */}
        <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">G</div>
            <div>
              <h2 className="text-white text-lg font-semibold">GovSign</h2>
              <p className="text-slate-300 text-sm">High-Assurance E-Signature Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> HSM Active
            </span>
            <span className="text-slate-300 text-sm">AU Sovereign</span>
            <span className="text-slate-400 text-xs">HSM Cluster: SYD-01 Active</span>
            <button
              type="button"
              onClick={handleCreateEnvelope}
              className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 flex items-center gap-2 shrink-0"
            >
              <span>+</span> Create Envelope
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0 border-t border-slate-700 bg-slate-800">
          {GOVSIGN_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'bg-slate-800 text-white border-red-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Red banner - show on Dashboard, Envelopes, Documents, Templates */}
        {['Dashboard', 'Envelopes', 'Documents', 'Templates'].includes(activeTab) && (
          <div className="bg-red-600 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">GovSign High-Assurance Platform</h3>
              <p className="text-red-100 text-sm mt-0.5">Cryptographic digital signatures • HSM-backed keys • Tamper-proof evidence ledger • AU data sovereignty</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-100 text-sm">AU Sovereign</span>
              <span className="text-red-100 text-sm">HSM Cluster: SYD-01 Active</span>
              <button type="button" onClick={handleSovereignty} className="border border-white text-white text-sm px-3 py-1.5 rounded hover:bg-red-500">
                AU Sovereign
              </button>
              <button type="button" onClick={handleCreateEnvelope} className="bg-white text-red-600 text-sm font-semibold px-4 py-2 rounded hover:bg-red-50 flex items-center gap-2">
                <span>+</span> Create Envelope
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white border-t border-gray-200 min-h-[400px]">
          {activeTab === 'Dashboard' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pending for Me', value: stats.pendingForMe, sub: 'Requires your signature', color: 'blue', badge: stats.pendingForMe },
                  { label: 'Awaiting Others', value: stats.awaitingOthers, sub: "Envelopes you've sent", color: 'orange' },
                  { label: 'Drafts', value: stats.drafts, sub: 'Incomplete envelopes', color: 'purple' },
                  { label: 'Expiring Certificates', value: stats.expiringCertificates, sub: 'Action required', color: 'red', badge: stats.expiringCertificates },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-xl border-2 p-5 relative ${
                      card.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                      card.color === 'orange' ? 'border-amber-200 bg-amber-50/30' :
                      card.color === 'purple' ? 'border-purple-200 bg-purple-50/30' :
                      'border-red-200 bg-red-50/30'
                    }`}
                  >
                    {card.badge > 0 && (
                      <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">{card.badge}</span>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${
                        card.color === 'blue' ? 'bg-blue-500' : card.color === 'orange' ? 'bg-amber-500' : card.color === 'purple' ? 'bg-purple-500' : 'bg-red-500'
                      }`}>
                        {card.value}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{card.value} {card.label}</p>
                        <p className="text-sm text-gray-600">{card.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
                    <p className="text-sm text-gray-500">Envelopes requiring your action</p>
                  </div>
                  <button type="button" onClick={handleViewAllEnvelopes} className="text-indigo-600 text-sm font-medium hover:underline">
                    View All Envelopes
                  </button>
                </div>
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const isSigned = signedIds.has(task.id)
                    return (
                      <div key={task.id} className="rounded-lg border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{task.id} • {task.type} • {task.signed} • SLA: <span className="text-amber-600 font-medium">{task.sla}</span></p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(task.tags || []).map((tag) => (
                                <span key={tag} className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${tag === 'HSM-Backed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{tag}</span>
                              ))}
                              {task.hash && <span className="text-xs text-gray-400 truncate max-w-[120px]">{task.hash}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${task.classification === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {task.classification}
                          </span>
                          {isSigned ? (
                            <span className="text-sm font-medium text-emerald-600">Signed</span>
                          ) : (
                            <button type="button" onClick={handleReviewSign(task)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Review & Sign
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="text-amber-500">⚠</span> Security Alerts
                </h3>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'certificate' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                          {alert.type === 'certificate' ? (
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                        </div>
                      </div>
                      {alert.action && (
                        <button type="button" onClick={handleRenewCertificate} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                          {alert.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent Activity</h3>
                <p className="text-sm text-gray-500 mb-4">System-wide envelope activity</p>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {activity.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span className="font-medium text-gray-900">{item.action}</span>
                        <span className="text-gray-500">—</span>
                        <span className="text-gray-600 truncate">{item.user}</span>
                        {item.hash && <span className="text-gray-400 text-xs truncate max-w-[100px]">{item.hash}</span>}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Envelopes' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Envelopes</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage signature envelopes and execution workflows</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by ID, title, sender, hash..."
                    value={envelopeSearch}
                    onChange={(e) => setEnvelopeSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleCreateEnvelope} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <span>+</span> Create Envelope
                  </button>
                  <button type="button" onClick={() => setShowEnvelopeFilters((v) => !v)} className={`px-4 py-2.5 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showEnvelopeFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filters{(envelopeTypeFilter !== 'All Types' || envelopeStatusFilter !== 'All Statuses') && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">{(envelopeTypeFilter !== 'All Types' ? 1 : 0) + (envelopeStatusFilter !== 'All Statuses' ? 1 : 0)}</span>}
                  </button>
                </div>
              </div>
              {showEnvelopeFilters && (
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Envelope Type</label>
                    <select value={envelopeTypeFilter} onChange={(e) => setEnvelopeTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>All Types</option>
                      <option>Procurement</option>
                      <option>Legal</option>
                      <option>Financial</option>
                      <option>HR</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                    <select value={envelopeStatusFilter} onChange={(e) => setEnvelopeStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>All Statuses</option>
                      <option>Draft</option>
                      <option>In Signing</option>
                      <option>Completed</option>
                      <option>Expired</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => { setEnvelopeTypeFilter('All Types'); setEnvelopeStatusFilter('All Statuses') }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 font-semibold text-gray-900">Envelope ID</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Title</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Risk</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Progress</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">SLA</th>
                      <th className="px-6 py-3 font-semibold text-gray-900 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnvelopes.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No envelopes match your search.</td></tr>
                    ) : (
                      filteredEnvelopes.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-gray-700 font-medium">{row.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{row.title}</p>
                            <p className="text-xs text-gray-500">{row.sender}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{row.type}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.risk === 'URGENT' ? 'bg-red-100 text-red-800' :
                              row.risk === 'PROTECTED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>{row.risk}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              row.status === 'In Signing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>{row.status}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(row.progressVal || 0) * 100}%` }} />
                              </div>
                              <span className="text-xs text-gray-600">{row.progress}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{row.sla}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => handleDownloadEnvelope(row)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Download" aria-label="Download">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </button>
                              <button type="button" onClick={() => handleViewEnvelope(row)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="View" aria-label="View">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <div className="relative" data-envelope-actions>
                                <button type="button" onClick={handleEnvelopeActions(row)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="More" aria-label="More actions" aria-expanded={envelopeActionsOpen === row.id}>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                </button>
                                {envelopeActionsOpen === row.id && (
                                  <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button type="button" onClick={() => handleViewEnvelope(row)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                      View
                                    </button>
                                    <button type="button" onClick={() => handleDownloadEnvelope(row)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      Download
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="p-6 space-y-6">
              {/* Document summary cards — Figma: four white cards with icons and counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
                    <p className="text-sm font-medium text-gray-900">Total Documents</p>
                    <p className="text-xs text-gray-500">All documents in envelopes</p>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.signed}</p>
                    <p className="text-sm font-medium text-gray-900">Signed</p>
                    <p className="text-xs text-gray-500 text-green-600">Completed</p>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.pending}</p>
                    <p className="text-sm font-medium text-gray-900">Pending</p>
                    <p className="text-xs text-gray-500">Awaiting action</p>
                  </div>
                </div>
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.inSigning}</p>
                    <p className="text-sm font-medium text-gray-900">In Signing</p>
                    <p className="text-xs text-gray-500 text-indigo-600">In progress</p>
                  </div>
                </div>
              </div>

              {/* Documents list header and actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Documents in envelopes — view, download, or upload</p>
                </div>
                <button type="button" onClick={handleUploadDocument} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                  Upload Document
                </button>
              </div>

              {/* Search and filters — Figma: search bar + filter controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, type, uploader, envelope ID..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select value={documentTypeFilter} onChange={(e) => setDocumentTypeFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>All Types</option>
                  <option>PDF</option>
                  <option>DOCX</option>
                </select>
                <select value={documentStatusFilter} onChange={(e) => setDocumentStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>All Statuses</option>
                  <option>Signed</option>
                  <option>Pending</option>
                  <option>In Signing</option>
                </select>
                <button type="button" onClick={() => setShowDocumentFilters((v) => !v)} className={`px-4 py-2.5 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showDocumentFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filters
                </button>
              </div>

              {/* Documents table — white card with border */}
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 font-semibold text-gray-900">Document Name</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Size</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Envelope ID</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Uploaded By</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No documents match your filters.</td></tr>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="font-medium text-gray-900">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{doc.type}</td>
                            <td className="px-6 py-4 text-gray-700">{doc.size}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                doc.status === 'Signed' ? 'bg-green-100 text-green-800' : doc.status === 'In Signing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>{doc.status}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{doc.envelopeId || '—'}</td>
                            <td className="px-6 py-4 text-gray-700">{doc.uploadedBy}</td>
                            <td className="px-6 py-4 text-gray-700">{doc.uploadedDate}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => handleDocumentView(doc)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                <button type="button" onClick={() => handleDocumentDownload(doc)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                <button type="button" onClick={() => handleDocumentDelete(doc.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {filteredDocuments.length > 0 && (
                <p className="text-xs text-gray-500">Showing {filteredDocuments.length} of {documentsList.length} documents</p>
              )}
            </div>
          )}

          {activeTab === 'Templates' && (
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Templates</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Reusable envelope templates — create once, use many times</p>
                </div>
                <button type="button" onClick={handleCreateTemplate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <span>+</span> Create Template
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, type, or description..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="rounded-xl border-2 border-gray-200 p-5 hover:border-indigo-200 transition-colors flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{t.type}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Last used: {t.lastUsed} • Used {t.usageCount} times</p>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button type="button" onClick={() => handleUseTemplate(t.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Use Template</button>
                      <button type="button" onClick={handleEditTemplate(t)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                      <button type="button" onClick={() => handleTemplateDelete(t.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredTemplates.length === 0 && (
                <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">No templates match your search. Create one to get started.</div>
              )}
            </div>
          )}

          {activeTab === 'Certificates & Keys' && (
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Certificates and Keys</h2>
                  <p className="text-sm text-gray-500 mt-0.5">HSM-backed cryptographic certificates</p>
                </div>
                <button type="button" onClick={handleIssueCertificate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <span>+</span> Issue Certificate
                </button>
              </div>
              <div className="rounded-lg border-2 border-green-200 bg-green-50/30 p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">HSM Cluster Status</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{hsmCluster.primary}</p>
                    <p className="text-sm text-gray-600">{hsmCluster.secondary}</p>
                    <p className="text-sm text-gray-500 mt-1">Region: {hsmCluster.region} • {hsmCluster.certified}</p>
                  </div>
                </div>
                <button type="button" onClick={handleConfigureHSM} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  Configure HSM
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificatesDisplay.map((cert) => (
                  <div key={cert.id} className={`rounded-xl border-2 p-5 ${cert.status === 'Expiring' ? 'border-amber-300 bg-amber-50/30' : 'border-green-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <span className={`text-sm font-medium ${cert.status === 'Expiring' ? 'text-amber-700' : 'text-green-700'}`}>{cert.status}</span>
                    </div>
                    {cert.expiringIn && <p className="text-xs text-amber-700 mb-2">Expires in {cert.expiringIn}</p>}
                    <dl className="space-y-1 text-sm">
                      <div><dt className="text-gray-500">Subject</dt><dd className="text-gray-900 font-medium truncate" title={cert.subject}>{cert.subject}</dd></div>
                      <div><dt className="text-gray-500">Issuer</dt><dd className="text-gray-900">{cert.issuer}</dd></div>
                      <div><dt className="text-gray-500">Serial</dt><dd className="text-gray-900 font-mono text-xs">{cert.serial}</dd></div>
                      <div><dt className="text-gray-500">Valid</dt><dd className="text-gray-900">{cert.validFrom} — {cert.validTo}</dd></div>
                    </dl>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(cert.tags || []).map((tag) => (
                        <span key={tag} className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${tag === 'HSM-Backed' ? 'bg-green-100 text-green-800' : tag === 'SECRET' || tag === 'TOP SECRET' ? 'bg-red-100 text-red-800' : tag === 'PROTECTED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{tag}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
                      <button type="button" onClick={() => handleCertificateExport(cert.id)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">Export</button>
                      <button type="button" onClick={handleCertificateView(cert)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">View</button>
                      {cert.status === 'Expiring' && (
                        <button type="button" onClick={() => handleCertificateRenew(cert.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">Renew</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Evidence Ledger' && (
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Evidence Ledger</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tamper-proof audit trail with cryptographic hash chain</p>
                </div>
                <button type="button" onClick={handleExportLedger} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                  Export Ledger Proof
                </button>
              </div>
              <div className="rounded-lg border-2 border-purple-200 bg-purple-50/30 p-5 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tamper-Proof Evidence Chain</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Every action is recorded with cryptographic hash chaining. Each event references the previous event&apos;s hash.</p>
                    <p className="text-sm text-gray-700 mt-2">Total events: <strong>{evidenceChain.totalEvents}</strong> • Chain Integrity: <strong className="text-green-700">{evidenceChain.chainIntegrity}</strong> • Last event: {evidenceChain.lastEvent}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search"
                  value={evidenceSearch}
                  onChange={(e) => setEvidenceSearch(e.target.value)}
                  className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => setShowEvidenceFilters((v) => !v)} className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showEvidenceFilters || evidenceTypeFilter !== 'All Types' || evidenceActorFilter !== 'All Actors' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filter{(evidenceTypeFilter !== 'All Types' || evidenceActorFilter !== 'All Actors') && <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">{(evidenceTypeFilter !== 'All Types' ? 1 : 0) + (evidenceActorFilter !== 'All Actors' ? 1 : 0)}</span>}
                </button>
              </div>
              {showEvidenceFilters && (
                <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Event Type</label>
                    <select value={evidenceTypeFilter} onChange={(e) => setEvidenceTypeFilter(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {evidenceTypeOptions.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Actor</label>
                    <select value={evidenceActorFilter} onChange={(e) => setEvidenceActorFilter(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {evidenceActorOptions.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => { setEvidenceTypeFilter('All Types'); setEvidenceActorFilter('All Actors') }} className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Event Chain</h3>
                {filteredEvidence.map((evt) => (
                  <div key={evt.id} className="rounded-lg border border-gray-200 p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-gray-900">{evt.id} <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{evt.type}</span></span>
                      <span className="text-xs text-gray-500">{evt.timestamp}</span>
                    </div>
                    <p className="text-gray-600">Actor: {evt.actor} • Origin IP: {evt.originIp}</p>
                    <p className="text-gray-600">Event Hash: <span className="text-green-700 font-mono">{evt.eventHash}</span> • Previous: <span className="text-green-700 font-mono">{evt.previousHash}</span></p>
                    {evt.device && <p className="text-gray-500">Device: {evt.device}</p>}
                    {evt.auth && <p className="text-gray-500">Auth: {evt.auth}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reports</h2>
                <p className="text-sm text-gray-500 mt-0.5">Generate and download envelope, signing, and certificate reports</p>
              </div>
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50/50 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Generate new report</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report type</label>
                    <select value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      {reportTypes.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">{reportTypes.find((r) => r.id === reportTypeFilter)?.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                    <input type="date" value={reportDateFrom} onChange={(e) => setReportDateFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                    <input type="date" value={reportDateTo} onChange={(e) => setReportDateTo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingReport ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Generating…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Generate Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Generated reports</h3>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 font-semibold text-gray-900">Report name</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Date range</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Generated</th>
                      <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-900 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No reports yet. Generate one above.</td></tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                          <td className="px-6 py-4 text-gray-700">{reportTypes.find((t) => t.id === r.type)?.name ?? r.type}</td>
                          <td className="px-6 py-4 text-gray-700">{r.dateFrom} — {r.dateTo}</td>
                          <td className="px-6 py-4 text-gray-700">{r.generatedAt}</td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{r.status}</span></td>
                          <td className="px-6 py-4 text-right">
                            <button type="button" onClick={() => handleDownloadReport(r)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Download</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Admin' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Administration</h2>
                <p className="text-sm text-gray-500 mt-0.5">System configuration and governance</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">Data Sovereignty</h3>
                {adminSovereignty.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.value || item.description}</p>
                    </div>
                    {!item.locked && 'enabled' in item && (
                      <button
                        type="button"
                        onClick={() => setAdminToggle(item.id, !adminToggles[item.id])}
                        className={`relative w-11 h-6 rounded-full transition-colors ${adminToggles[item.id] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${adminToggles[item.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h3 className="font-semibold text-gray-900">Policy Engine</h3>
                  <button type="button" onClick={handleNewPolicyRule} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                    <span>+</span> New Policy Rule
                  </button>
                </div>
                <div className="space-y-3">
                  {adminPoliciesDisplay.map((policy) => (
                    <div key={policy.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{policy.title}</p>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                        <p className="text-xs text-gray-500">Scope: {policy.scope} • Last modified: {policy.modified}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${policy.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{policy.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Security Configuration</h3>
                <div className="space-y-3">
                  {adminSecurity.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{s.title}</p>
                        <p className="text-sm text-gray-500">{s.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminToggle(s.id, !adminToggles[s.id])}
                        className={`relative w-11 h-6 rounded-full transition-colors ${adminToggles[s.id] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${adminToggles[s.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Help' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Help</h2>
                <p className="text-sm text-gray-500 mt-0.5">Documentation, FAQs, and support for GovSign</p>
              </div>
              <div className="relative mb-6">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search help and FAQs..."
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Frequently asked questions</h3>
                  <div className="space-y-2">
                    {filteredFaq.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 p-6 text-center text-gray-500">No FAQs match your search.</div>
                    ) : (
                      filteredFaq.map((faq) => (
                        <div key={faq.id} className="rounded-lg border border-gray-200 overflow-hidden">
                          <button
                            type="button"
                            onClick={handleToggleFaq(faq.id)}
                            className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left font-medium text-gray-900 bg-white hover:bg-gray-50"
                          >
                            {faq.question}
                            <span className="shrink-0 text-gray-500">{expandedFaqId === faq.id ? '−' : '+'}</span>
                          </button>
                          {expandedFaqId === faq.id && (
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-600">{faq.answer}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Documentation</h3>
                  <div className="space-y-2">
                    {helpLinks.map((link) => (
                      <a key={link.id} href={link.url} className="block rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                        <p className="font-medium text-gray-900">{link.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
                      </a>
                    ))}
                  </div>
                  <div className="mt-6 rounded-lg border-2 border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Contact support</h3>
                    <p className="text-sm text-gray-600 mb-3">Need help? Our team is available for technical and compliance questions.</p>
                    <p className="text-sm text-gray-700">Email: <a href="mailto:support@govsign.example" className="text-indigo-600 hover:underline">support@govsign.example</a></p>
                    <p className="text-sm text-gray-700 mt-1">Phone: 1300 GOVSIGN</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateEnvelopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900">Create Envelope</h3>
            <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new signing envelope</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={createEnvelopeForm.title}
                  onChange={(e) => setCreateEnvelopeForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter envelope title..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={createEnvelopeForm.type}
                  onChange={(e) => setCreateEnvelopeForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option>Procurement</option>
                  <option>Contract</option>
                  <option>Deed</option>
                  <option>Board Resolution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk</label>
                <select
                  value={createEnvelopeForm.risk}
                  onChange={(e) => setCreateEnvelopeForm((prev) => ({ ...prev, risk: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="OFFICIAL">OFFICIAL</option>
                  <option value="PROTECTED">PROTECTED</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                <input
                  type="text"
                  value={createEnvelopeForm.progress}
                  onChange={(e) => setCreateEnvelopeForm((prev) => ({ ...prev, progress: e.target.value }))}
                  placeholder="e.g. 0/1 or 1/3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Format: signed/total (e.g. 0/1)</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setShowCreateEnvelopeModal(false)} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSubmitCreateEnvelope} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {viewingEnvelope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="view-envelope-title">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h3 id="view-envelope-title" className="text-lg font-semibold text-gray-900">Envelope Details</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-gray-500">Envelope ID</dt><dd className="text-gray-900 font-medium">{viewingEnvelope.id}</dd></div>
              <div><dt className="text-gray-500">Title</dt><dd className="text-gray-900">{viewingEnvelope.title}</dd></div>
              <div><dt className="text-gray-500">Sender</dt><dd className="text-gray-900">{viewingEnvelope.sender}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="text-gray-900">{viewingEnvelope.type}</dd></div>
              <div><dt className="text-gray-500">Risk</dt><dd className="text-gray-900">{viewingEnvelope.risk}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd className="text-gray-900">{viewingEnvelope.status}</dd></div>
              <div><dt className="text-gray-500">Progress</dt><dd className="text-gray-900">{viewingEnvelope.progress}</dd></div>
              <div><dt className="text-gray-500">SLA</dt><dd className="text-gray-900">{viewingEnvelope.sla || '—'}</dd></div>
            </dl>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => handleDownloadEnvelope(viewingEnvelope)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Download</button>
              <button type="button" onClick={() => setViewingEnvelope(null)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="view-document-title">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h3 id="view-document-title" className="text-lg font-semibold text-gray-900">Document Details</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-gray-500">Name</dt><dd className="text-gray-900 font-medium">{viewingDocument.name}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="text-gray-900">{viewingDocument.type}</dd></div>
              <div><dt className="text-gray-500">Size</dt><dd className="text-gray-900">{viewingDocument.size}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd className="text-gray-900">{viewingDocument.status}</dd></div>
              <div><dt className="text-gray-500">Envelope ID</dt><dd className="text-gray-900 font-mono text-xs">{viewingDocument.envelopeId || '—'}</dd></div>
              <div><dt className="text-gray-500">Uploaded by</dt><dd className="text-gray-900">{viewingDocument.uploadedBy}</dd></div>
              <div><dt className="text-gray-500">Date</dt><dd className="text-gray-900">{viewingDocument.uploadedDate}</dd></div>
              {viewingDocument.hash && <div><dt className="text-gray-500">Hash</dt><dd className="text-gray-900 font-mono text-xs break-all">{viewingDocument.hash}</dd></div>}
            </dl>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => handleDocumentDownload(viewingDocument)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Download</button>
              <button type="button" onClick={() => setViewingDocument(null)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {signModalEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Sign</h3>
            <p className="text-sm text-gray-600 mt-2">{signModalEnv.title}</p>
            <p className="text-xs text-gray-500 mt-1">ID: {signModalEnv.id} • {signModalEnv.type}</p>
            <p className="text-sm text-gray-600 mt-2">By signing you confirm you have read and agree to the document.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setSignModalEnv(null)} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleConfirmSign} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Sign</button>
            </div>
          </div>
        </div>
      )}

      {certificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Certificate Review</h3>
            <p className="text-sm text-gray-600 mt-2">Robert Taylor&apos;s certificate expires in 20 days. Use the Certificates & Keys tab to renew.</p>
            <button type="button" onClick={handleCloseCertificateModal} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {sovereigntyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">AU Sovereign</h3>
            <p className="text-sm text-gray-600 mt-2">GovSign keeps signing keys and evidence on Australian sovereign infrastructure. Your data stays in-region.</p>
            <button type="button" onClick={() => setSovereigntyModal(false)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {createTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Template</h3>
            <form onSubmit={handleSubmitCreateTemplate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={createTemplateForm.name} onChange={(e) => setCreateTemplateForm((p) => ({ ...p, name: e.target.value }))} placeholder="Template name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={createTemplateForm.type} onChange={(e) => setCreateTemplateForm((p) => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>Procurement</option>
                  <option>Contract</option>
                  <option>Deed</option>
                  <option>Board Resolution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={createTemplateForm.description} onChange={(e) => setCreateTemplateForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={closeCreateTemplateModal} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="upload-document-title" onClick={() => { setShowUploadDocumentModal(false); setUploadDocumentForm({ name: '', type: 'PDF', envelopeId: '' }); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 id="upload-document-title" className="text-lg font-semibold text-gray-900">Upload Document</h3>
            <p className="text-sm text-gray-500 mt-1">Add a document to an envelope or as a standalone file</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document name *</label>
                <input
                  type="text"
                  value={uploadDocumentForm.name}
                  onChange={(e) => setUploadDocumentForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Contract_2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={uploadDocumentForm.type} onChange={(e) => setUploadDocumentForm((p) => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>PDF</option>
                  <option>DOCX</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to envelope (optional)</label>
                <select value={uploadDocumentForm.envelopeId || ''} onChange={(e) => setUploadDocumentForm((p) => ({ ...p, envelopeId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">— None —</option>
                  {envelopes.map((env) => (
                    <option key={env.id} value={env.id}>{env.id} — {env.title}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-0.5">Envelopes from your current list ({envelopes.length})</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => { setShowUploadDocumentModal(false); setUploadDocumentForm({ name: '', type: 'PDF', envelopeId: '' }); }} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSubmitUploadDocument} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Upload</button>
            </div>
          </div>
        </div>
      )}

      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editTemplateForm.name} onChange={(e) => setEditTemplateForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={editTemplateForm.type} onChange={(e) => setEditTemplateForm((p) => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>Procurement</option>
                  <option>Contract</option>
                  <option>Deed</option>
                  <option>Board Resolution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editTemplateForm.description} onChange={(e) => setEditTemplateForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setEditingTemplate(null)} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSaveEditTemplate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {showIssueCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="issue-certificate-title" onClick={closeIssueCertificateModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="issue-certificate-title" className="text-lg font-semibold text-gray-900">Issue New Certificate</h3>
                <p className="text-sm text-gray-500 mt-1">Create HSM-backed cryptographic signing certificate.</p>
              </div>
              <button type="button" onClick={closeIssueCertificateModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={issueCertificateForm.subjectName}
                  onChange={(e) => setIssueCertificateForm((p) => ({ ...p, subjectName: e.target.value }))}
                  placeholder="CN=John Smith, O=Organisation, OU=Department, C=AU"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clearance Level *</label>
                <select value={issueCertificateForm.clearanceLevel} onChange={(e) => setIssueCertificateForm((p) => ({ ...p, clearanceLevel: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="OFFICIAL">OFFICIAL</option>
                  <option value="PROTECTED">PROTECTED</option>
                  <option value="SECRET">SECRET</option>
                  <option value="TOP SECRET">TOP SECRET</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validity Period *</label>
                <select value={issueCertificateForm.validityPeriod} onChange={(e) => setIssueCertificateForm((p) => ({ ...p, validityPeriod: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                  <option value="3 years">3 years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Algorithm *</label>
                <select value={issueCertificateForm.signatureAlgorithm} onChange={(e) => setIssueCertificateForm((p) => ({ ...p, signatureAlgorithm: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="RSA-4096 + SHA-512">RSA-4096 + SHA-512</option>
                  <option value="RSA-2048 + SHA-512">RSA-2048 + SHA-512</option>
                  <option value="ECDSA P-384 + SHA-384">ECDSA P-384 + SHA-384</option>
                </select>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">HSM-Backed Key Generation</p>
                    <p className="text-xs text-blue-800 mt-0.5">Private key will be generated and stored in FIPS 140-2 Level 3 certified HSM. Key never leaves the HSM boundary.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={closeIssueCertificateModal} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSubmitIssueCertificate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Issue Certificate</button>
            </div>
          </div>
        </div>
      )}

      {showNewPolicyRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="new-policy-rule-title" onClick={closeNewPolicyRuleModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 id="new-policy-rule-title" className="text-lg font-semibold text-gray-900">New Policy Rule</h3>
              <button type="button" onClick={closeNewPolicyRuleModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newPolicyRuleForm.title}
                  onChange={(e) => setNewPolicyRuleForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Deed Execution Requires Witness"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPolicyRuleForm.description}
                  onChange={(e) => setNewPolicyRuleForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. If doc type = deed, require witness attestation"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                <select value={newPolicyRuleForm.scope} onChange={(e) => setNewPolicyRuleForm((p) => ({ ...p, scope: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="All organisations">All organisations</option>
                  <option value="Defence, Banking">Defence, Banking</option>
                  <option value="Defence, Intelligence">Defence, Intelligence</option>
                  <option value="Banking">Banking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={newPolicyRuleForm.status} onChange={(e) => setNewPolicyRuleForm((p) => ({ ...p, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={closeNewPolicyRuleModal} className="flex-1 border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSubmitNewPolicyRule} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Add Rule</button>
            </div>
          </div>
        </div>
      )}

      {certificateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-gray-500">Subject</dt><dd className="text-gray-900">{certificateDetail.subject}</dd></div>
              <div><dt className="text-gray-500">Issuer</dt><dd className="text-gray-900">{certificateDetail.issuer}</dd></div>
              <div><dt className="text-gray-500">Serial</dt><dd className="text-gray-900 font-mono">{certificateDetail.serial}</dd></div>
              <div><dt className="text-gray-500">Algorithm</dt><dd className="text-gray-900">{certificateDetail.algorithm}</dd></div>
              <div><dt className="text-gray-500">Valid From / To</dt><dd className="text-gray-900">{certificateDetail.validFrom} — {certificateDetail.validTo}</dd></div>
            </dl>
            <button type="button" onClick={() => setCertificateDetail(null)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Configure HSM Modal */}
      {showConfigureHsmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={() => setShowConfigureHsmModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configure HSM</h3>
                <p className="text-sm text-gray-500 mt-0.5">Hardware Security Module cluster settings</p>
              </div>
              <button type="button" onClick={() => setShowConfigureHsmModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
    </div>
  )
}
