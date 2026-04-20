import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Shield, Globe, Clock, FileText, Gavel,
    Home, MessageSquare, Briefcase, DollarSign, TrendingUp,
    MapPin, CheckCircle2, AlertCircle, Eye, Download, Search,
    Filter, RotateCcw, ChevronRight, X, AlertTriangle, ShieldCheck,
    CheckCircle, MoreHorizontal, User, Building, Scale, Info,
    ArrowUpRight, Users, Printer, Edit3, BedDouble, Bath, Car,
    Target, FileSearch, Upload, RefreshCw, XCircle, Lock,
    Sparkles, ClipboardCheck, ClipboardList, Send, Paperclip,
    Pause, Handshake, Calendar, Mail, Check
} from 'lucide-react';
import { dealsService, auctionService, casesService, settlementService, documentService } from '../../api/dataService';
import { generateInvestmentMemorandumPDF, generateBrandedPDF } from '../../utils/pdfGenerator';
import LawyerReviewPanel from '../../components/common/LawyerReviewPanel';
import { LoadingState, ErrorState } from '../../components/common/States';
import CaseChat from '../../components/common/CaseChat';
import CaseActivityLog from '../../components/common/CaseActivityLog';
import CaseBidPanel from '../../components/common/CaseBidPanel';
import { useAuth } from '../../context/AuthContext';

export default function LenderCaseDetails() {
    console.log("LenderCaseDetails rendering, id:", useParams().id);
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [caseData, setCaseData] = useState(null);
    const [activeTab, setActiveTab] = useState("Dashboard");
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const fileInputRef = useRef(null);
    const settlementFileInputRef = useRef(null);

    // Lawyer Review State
    const [lawyerReviewNotes, setLawyerReviewNotes] = useState("");
    const [soaFile, setSoaFile] = useState(null);
    const [isGeneratingDoc, setIsGeneratingDoc] = useState({ active: false, type: null });
    const [uploadingFiles, setUploadingFiles] = useState([]);

    // Settlement State
    const [settlementSubTab, setSettlementSubTab] = useState("AI Checklist Manager");
    const [expandedCategory, setExpandedCategory] = useState("Legal Requirements");
    const [settlementMessage, setSettlementMessage] = useState("");
    const [pendingAttachment, setPendingAttachment] = useState(null); // { name, size }
    const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isAddChecklistItemModalOpen, setIsAddChecklistItemModalOpen] = useState(false);
    const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
    const [taskActionModal, setTaskActionModal] = useState(null); // { type, task }
    const [taskActionForm, setTaskActionForm] = useState({});
    const [taskActionSaving, setTaskActionSaving] = useState(false);

    const [caseSettlementData, setCaseSettlementData] = useState({
        summary: {
            completed: 0,
            total: 0,
            inProgress: 0,
            overdue: 0,
            blocked: 0,
            estCompletion: "—",
            daysLeft: 0
        },
        categories: []
    });

    const [settlementOverviewData, setSettlementOverviewData] = useState({
        property: {
            id: "",
            title: "",
            location: "",
            image: null,
            settlementDate: "—",
            readiness: 0,
            status: "Pending"
        },
        checklist: [],
        outstanding: [],
        thread: []
    });

    // Enforcement Steps State — loaded from backend metadata
    const [enforcementSteps, setEnforcementSteps] = useState([
        { id: 1, title: 'Mortgage Default Notice (s88)', status: 'pending', date: '—', notes: '' },
        { id: 2, title: 'Statement of Claim Served', status: 'pending', date: '—', notes: '' },
        { id: 3, title: 'Eviction/Possession Order', status: 'pending', date: '—', notes: '' },
        { id: 4, title: 'Auction Reserve Setting', status: 'pending', date: '—', notes: '' }
    ]);

    // Loan Compliance State — loaded from backend metadata
    const [loanCompliance, setLoanCompliance] = useState([
        { id: 1, title: 'Loan Agreement terms reviewed', checked: false, critical: true },
        { id: 2, title: 'Mortgage registration verified', checked: false, critical: true },
        { id: 3, title: 'No priority issues detected', checked: false, critical: true },
        { id: 4, title: 'Rate calculations/arrears verified', checked: false, critical: false },
        { id: 5, title: 'Default process compliant with NCCP', checked: false, critical: true }
    ]);

    // Missing Investor View States
    const [nccpStatus, setNccpStatus] = useState(null);
    const [propertyImages, setPropertyImages] = useState([]);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [manageModalTab, setManageModalTab] = useState("Case Details");
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [bidHistory, setBidHistory] = useState([]);
    const [caseMessages, setCaseMessages] = useState([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [isBulkCommModalOpen, setIsBulkCommModalOpen] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [bulkMessage, setBulkMessage] = useState({ subject: "", body: "" });
    const [newChecklistItem, setNewChecklistItem] = useState({ item: "", responsible: "Borrower", dueDate: new Date().toISOString().split('T')[0] });

    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefreshIntelligence = () => {
        setToast({ show: true, message: "Refreshing case intelligence...", type: "info" });
        setRefreshKey(k => k + 1);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const res = await casesService.getCaseById(id || "MIP-2026-001");
                const fetchedCase = res?.data || {};

                const primaryImageDoc = (fetchedCase.documents || []).find(d =>
                    (d.document_type || d.type) === 'Property Image'
                );
                let property_images = fetchedCase.property_images || [];
                if (typeof property_images === 'string') {
                    try { property_images = JSON.parse(property_images); } catch (e) { property_images = []; }
                }
                if (property_images.length === 0 && fetchedCase.metadata_json?.property_images) {
                    property_images = fetchedCase.metadata_json.property_images;
                }

                // Resolve image URL — prefer metadata property_images, fall back to document file_url
                let image = null;
                const rawImageUrl = property_images[0] || primaryImageDoc?.file_url || null;
                if (rawImageUrl) {
                    const isFullUrl = rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://') || rawImageUrl.startsWith('blob:') || rawImageUrl.startsWith('data:');
                    const isLocalUpload = rawImageUrl.startsWith('/uploads/');
                    if (isFullUrl || isLocalUpload) {
                        image = rawImageUrl;
                    } else if (primaryImageDoc?.id) {
                        // Try presigned URL via document download endpoint (S3 / cloud storage)
                        try {
                            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
                            const imgRes = await fetch(`/api/v1/documents/${primaryImageDoc.id}/download`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (imgRes.ok) {
                                const ct = imgRes.headers.get('content-type') || '';
                                if (ct.includes('application/json')) {
                                    const json = await imgRes.json();
                                    image = json.download_url || null;
                                } else {
                                    const blob = await imgRes.blob();
                                    image = URL.createObjectURL(blob);
                                }
                            }
                        } catch (imgErr) {
                            console.warn("Could not load property image:", imgErr);
                        }
                    }
                }

                // Map real data or fallback to zero/empty state
                const meta = fetchedCase.metadata_json || {};
                const outstandingDebt = Number(fetchedCase.outstanding_debt || fetchedCase.asking_price) || 0;
                const propertyValuation = Number(fetchedCase.estimated_value) || 0;
                const lvrCalc = propertyValuation > 0
                    ? parseFloat(((outstandingDebt / propertyValuation) * 100).toFixed(1))
                    : 0;

                // Parse address parts — prefer metadata fields set by admin
                let suburb = meta.suburb || "N/A";
                let state = meta.state || "N/A";
                let postcode = meta.postcode || "N/A";
                if ((suburb === "N/A" || state === "N/A") && fetchedCase.property_address) {
                    const parts = fetchedCase.property_address.split(",");
                    if (parts.length >= 2) {
                        if (suburb === "N/A") suburb = parts[parts.length - 2]?.trim() || "N/A";
                        const lastTokens = (parts[parts.length - 1] || "").trim().split(" ").filter(Boolean);
                        if (lastTokens.length >= 2 && /^\d{4}$/.test(lastTokens[lastTokens.length - 1])) {
                            if (postcode === "N/A") postcode = lastTokens[lastTokens.length - 1];
                            if (state === "N/A") state = lastTokens[lastTokens.length - 2];
                        } else {
                            if (state === "N/A") state = lastTokens.join(" ");
                        }
                    }
                }

                const mappedData = {
                    image,
                    id: fetchedCase.id || id || "Unknown ID",
                    case_number: fetchedCase.case_number || null,
                    lender_id: fetchedCase.assigned_lender_id || fetchedCase.lender_id || null,
                    borrower_id: fetchedCase.borrower_id || null,
                    status: fetchedCase.status || "Pending",
                    riskLevel: meta.risk_level || "N/A",
                    address: fetchedCase.property_address || "Address not provided",
                    borrower: meta.borrower_name || fetchedCase.borrower_name || "Unknown Borrower",
                    lender: meta.lender_name || fetchedCase.lender_name || fetchedCase.borrower_name || "Unknown Lender",
                    outstandingDebt,
                    propertyValuation,
                    equity: Math.max(0, propertyValuation - outstandingDebt),
                    lvr: lvrCalc,
                    highestBid: Number(fetchedCase.current_highest_bid) || 0,
                    bidsCount: Number(fetchedCase.total_bids) || 0,
                    daysActive: 0,
                    sinceDate: fetchedCase.created_at ? new Date(fetchedCase.created_at).toLocaleDateString('en-AU') : "-",
                    updatedDaysAgo: 0,
                    lastUpdated: fetchedCase.updated_at ? new Date(fetchedCase.updated_at).toLocaleDateString('en-AU') : "-",
                    riskScore: (() => {
                        // Derive risk score 0-100 from LVR and missed payments
                        const lvrRisk = Math.min(lvrCalc, 100); // 0-100
                        const missedPay = Number(fetchedCase.missed_payments) || Number(meta.missed_payments) || 0;
                        const missedRisk = Math.min(missedPay * 10, 40); // each missed payment adds 10 pts, cap at 40
                        return Math.min(Math.round(lvrRisk * 0.6 + missedRisk), 100);
                    })(),
                    bedrooms: Number(meta.bedrooms || fetchedCase.bedrooms) || 0,
                    bathrooms: Number(meta.bathrooms || fetchedCase.bathrooms) || 0,
                    parking: Number(meta.parking || fetchedCase.parking) || 0,
                    propertyType: fetchedCase.property_type || meta.property_type || "N/A",
                    landSize: meta.land_size || meta.land_size_sqm || meta.floor_area || fetchedCase.land_size || fetchedCase.land_size_sqm || fetchedCase.floor_area || meta.lot_size || fetchedCase.lot_size || "N/A",
                    documentCollection: { current: (fetchedCase.documents || []).length, total: (fetchedCase.documents || []).length },
                    verificationStatus: { current: 0, total: 0 },
                    totalParties: 0,
                    interestRate: Number(fetchedCase.interest_rate) || 0,
                    defaultRate: Number(meta.default_rate) || 0,
                    daysInDefault: Number(meta.days_in_default) || 0,
                    suburb,
                    state,
                    postcode,
                    valuationDate: meta.valuation_date || fetchedCase.valuation_date || "-",
                    valuerName: meta.valuer_name || meta.valuation_provider || fetchedCase.valuer_name || "-",
                    arrears: {
                        total: Number(fetchedCase.total_arrears) || Number(meta.total_arrears) || 0,
                        missedPayments: Number(fetchedCase.missed_payments) || Number(meta.missed_payments) || 0,
                        defaultDate: fetchedCase.default_notice_date || meta.default_notice_date || "-",
                        reason: fetchedCase.default_reason || meta.default_reason || "-"
                    },
                    recentActivity: fetchedCase.recentActivity || [],
                    documents: (fetchedCase.documents || []).map(doc => ({
                        id: doc.id,
                        name: doc.document_name || doc.file_name || doc.name || 'Document',
                        type: doc.document_type || doc.type || 'Document',
                        uploadedBy: doc.uploaded_by_name || doc.uploaded_by || 'Unknown',
                        date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-AU') : (doc.date || ''),
                        status: doc.status || 'UPLOADED',
                        file_url: doc.file_url
                    })),
                    metadata_json: fetchedCase.metadata_json || {},
                };

                // Dynamic calculations for zero states
                if (!mappedData.equity && mappedData.propertyValuation && mappedData.outstandingDebt) {
                    mappedData.equity = mappedData.propertyValuation - mappedData.outstandingDebt;
                }
                
                if (!mappedData.lvr && mappedData.propertyValuation && mappedData.propertyValuation > 0) {
                    mappedData.lvr = ((mappedData.outstandingDebt / mappedData.propertyValuation) * 100).toFixed(1);
                }

                setCaseData(mappedData);
                setFormData({ ...mappedData });
                setCaseMessages(fetchedCase.messages || []);
                setBidHistory(fetchedCase.bidHistory || []);

                // Load property images for the media gallery
                const allImages = property_images.length > 0 ? property_images : [];
                if (allImages.length > 0) {
                    setPropertyImages(allImages.map((url, idx) => ({
                        id: idx,
                        url,
                        name: url.split('/').pop()
                    })));
                }

                // Populate settlement overview property from real case data
                setSettlementOverviewData(prev => ({
                    ...prev,
                    property: {
                        ...prev.property,
                        id: fetchedCase.case_number || fetchedCase.id || prev.property.id,
                        title: fetchedCase.title || fetchedCase.property_address || prev.property.title,
                        location: fetchedCase.property_address || prev.property.location,
                        image: image || prev.property.image,
                        status: fetchedCase.status || prev.property.status,
                    }
                }));

                // Load compliance metadata
                if (fetchedCase.metadata) {
                    const meta = typeof fetchedCase.metadata === 'string' ? JSON.parse(fetchedCase.metadata) : fetchedCase.metadata;
                    if (meta.enforcementSteps) setEnforcementSteps(meta.enforcementSteps);
                    if (meta.loanCompliance) setLoanCompliance(meta.loanCompliance);
                    if (meta.lawyerReviewNotes) setLawyerReviewNotes(meta.lawyerReviewNotes);
                }

                // Load settlement breakdown
                try {
                    const settlementRes = await settlementService.getSettlement(id);
                    if (settlementRes?.success && settlementRes.data?.breakdown) {
                        const breakdown = typeof settlementRes.data.breakdown === 'string'
                            ? JSON.parse(settlementRes.data.breakdown)
                            : settlementRes.data.breakdown;

                        if (breakdown.property) {
                            setSettlementOverviewData(prev => ({
                                ...prev,
                                ...breakdown
                            }));
                        }
                        // Load checklist categories if stored
                        if (breakdown.categories && Array.isArray(breakdown.categories)) {
                            setCaseSettlementData(prev => ({
                                ...prev,
                                categories: breakdown.categories,
                                summary: breakdown.summary || prev.summary
                            }));
                        }
                    }
                } catch (sErr) {
                    console.warn("Settlement data not found for this case", sErr);
                }

            } catch (err) {
                console.error("Error fetching case details:", err);
                setError(err.message || "Failed to load case details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, refreshKey]);

    if (loading) return <LoadingState message="Fetching case intelligence..." />;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
    if (!caseData) return <ErrorState message="Case not found" />;

    // Persistence Helpers
    const persistSettlement = async (updatedData) => {
        try {
            await settlementService.saveChecklist(id, updatedData);
        } catch (err) {
            console.error("Failed to persist settlement checklist:", err);
            setToast({ show: true, message: "Sync error: Settlement data not saved.", type: "error" });
        }
    };

    const persistCompliance = async (metadata) => {
        try {
            await casesService.updateCaseMetadata(id, metadata);
        } catch (err) {
            console.error("Failed to persist compliance metadata:", err);
            setToast({ show: true, message: "Sync error: Compliance data not saved.", type: "error" });
        }
    };

    const handleUpdateCompliance = (listName, index, updates) => {
        let newList;
        if (listName === 'enforcementSteps') {
            newList = [...enforcementSteps];
            newList[index] = { ...newList[index], ...updates };
            setEnforcementSteps(newList);
            persistCompliance({
                enforcementSteps: newList,
                loanCompliance,
                lawyerReviewNotes
            });
        } else if (listName === 'loanCompliance') {
            newList = [...loanCompliance];
            newList[index] = { ...newList[index], ...updates };
            setLoanCompliance(newList);
            persistCompliance({
                enforcementSteps,
                loanCompliance: newList,
                lawyerReviewNotes
            });
        }
    };

    // ── Task action handlers ──────────────────────────────────────────────────
    const openTaskAction = (type, task) => {
        setOpenTaskMenuId(null);
        setTaskActionForm(
            type === 'edit' ? { title: task.title, desc: task.desc, assignee: task.assignee, date: task.date, priority: task.priority } :
            type === 'reassign' ? { assignee: task.assignee, email: task.email || '' } :
            type === 'priority' ? { priority: task.priority } :
            type === 'escalate' ? { reason: '' } :
            {}
        );
        setTaskActionModal({ type, task });
    };

    const applyTaskUpdate = (taskId, updates) => {
        const updatedCategories = caseSettlementData.categories.map(cat => ({
            ...cat,
            tasks: cat.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }));
        setCaseSettlementData(prev => ({ ...prev, categories: updatedCategories }));
        return updatedCategories;
    };

    const handleTaskActionSave = async () => {
        if (!taskActionModal) return;
        const { type, task } = taskActionModal;
        setTaskActionSaving(true);
        try {
            if (type === 'edit') {
                await settlementService.updateTask(id, task.id, taskActionForm);
                applyTaskUpdate(task.id, taskActionForm);
                setToast({ show: true, message: "Task updated successfully.", type: "success" });
            } else if (type === 'reassign') {
                await settlementService.updateTask(id, task.id, taskActionForm);
                applyTaskUpdate(task.id, taskActionForm);
                setToast({ show: true, message: `Task reassigned to ${taskActionForm.assignee}.`, type: "success" });
            } else if (type === 'priority') {
                await settlementService.updateTask(id, task.id, { priority: taskActionForm.priority });
                applyTaskUpdate(task.id, { priority: taskActionForm.priority });
                setToast({ show: true, message: `Priority set to ${taskActionForm.priority}.`, type: "success" });
            } else if (type === 'archive') {
                await settlementService.archiveTask(id, task.id);
                applyTaskUpdate(task.id, { archived: true, status: 'ARCHIVED' });
                setToast({ show: true, message: "Task archived.", type: "success" });
            } else if (type === 'escalate') {
                await settlementService.escalateTask(id, task.id, taskActionForm.reason);
                applyTaskUpdate(task.id, { escalated: true, priority: 'CRITICAL' });
                setToast({ show: true, message: "Task escalated to compliance.", type: "success" });
            }
            setTaskActionModal(null);
        } catch (err) {
            setToast({ show: true, message: err.message || "Action failed. Please try again.", type: "error" });
        } finally {
            setTaskActionSaving(false);
        }
    };

    const handleSaveNoteLocal = (taskId, text) => {
        const updatedCategories = caseSettlementData.categories.map(cat => ({
            ...cat,
            tasks: cat.tasks.map(t => t.id === taskId ? { ...t, notes: [...t.notes, text], currentNoteText: "", showNoteInput: false } : t)
        }));
        setCaseSettlementData(prev => ({ ...prev, categories: updatedCategories }));
        persistSettlement({ ...settlementOverviewData, categories: updatedCategories });
    };

    // Tabs Navigation
    const tabs = [
        { label: "Dashboard",              short: "Dashboard",   icon: Home },
        { label: "Full Details",           short: "Details",     icon: FileText },
        { label: "Lawyer Review",          short: "Lawyer",      icon: Gavel },
        { label: "Property",               short: "Property",    icon: Home },
        { label: "Documents",              short: "Documents",   icon: Briefcase },
        { label: "Investment Memorandum",  short: "Inv. Memo",   icon: Target },
        { label: "Settlement",             short: "Settlement",  icon: Handshake },
        { label: "Bids",                   short: "Bids",        icon: DollarSign },
        { label: "Messages",               short: "Messages",    icon: MessageSquare },
        { label: "Activity",               short: "Activity",    icon: RefreshCw }
    ];

    // Handlers
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await casesService.updateCaseMetadata(id, { ...caseData, ...formData });
            setCaseData({ ...caseData, ...formData });
            setToast({ show: true, message: "Changes saved successfully!", type: "success" });
            setIsManageModalOpen(false);
        } catch (err) {
            setToast({ show: true, message: "Failed to save changes.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            name: file.name
        }));
        setPropertyImages([...propertyImages, ...newImages]);
        setToast({ show: true, message: "Images uploaded!", type: "success" });
    };

    const removePropertyImage = (imgId) => {
        setPropertyImages(propertyImages.filter(img => img.id !== imgId));
    };

    const handleSendBulkComm = () => {
        setIsBulkCommModalOpen(false);
        setToast({ show: true, message: `Message sent to ${selectedRecipients.length} recipients!`, type: "success" });
        setSelectedRecipients([]);
        setBulkMessage({ subject: "", body: "" });
    };

    const handleAddChecklistItem = () => {
        const newItem = {
            id: Date.now(),
            item: newChecklistItem.item,
            responsible: newChecklistItem.responsible,
            dueDate: new Date(newChecklistItem.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: "Open",
            uploadStatus: "pending"
        };
        const updatedOverview = {
            ...settlementOverviewData,
            checklist: [...settlementOverviewData.checklist, newItem]
        };
        setSettlementOverviewData(updatedOverview);
        persistSettlement(updatedOverview);
        
        setIsAddChecklistItemModalOpen(false);
        setNewChecklistItem({
            item: "",
            responsible: "Borrower",
            dueDate: new Date().toISOString().split('T')[0]
        });
        setToast({ show: true, message: "Item added to checklist!", type: "success" });
    };

    const handleSendMessage = () => {
        const hasText = settlementMessage.trim();
        const hasFile = pendingAttachment;
        if (!hasText && !hasFile) return;

        const messageText = hasText
            ? (hasFile ? `${settlementMessage.trim()}\n📎 Attachment: ${hasFile.name} (${(hasFile.size / 1024).toFixed(1)} KB)` : settlementMessage.trim())
            : `📎 Attachment: ${hasFile.name} (${(hasFile.size / 1024).toFixed(1)} KB)`;

        const newMessage = {
            id: Date.now(),
            user: "You",
            role: "Lender",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            message: messageText,
            initials: "Y",
            color: "bg-blue-900",
            isAttachment: !!hasFile,
        };
        const updatedOverview = {
            ...settlementOverviewData,
            thread: [...settlementOverviewData.thread, newMessage]
        };
        setSettlementOverviewData(updatedOverview);
        persistSettlement(updatedOverview);
        setSettlementMessage("");
        setPendingAttachment(null);
    };

    const handleSendGeneralMessage = async () => {
        if (!newMessageText.trim()) return;
        const newMessage = {
            id: Date.now(),
            user: "Lender Admin",
            role: "Lender",
            time: "Just now",
            message: newMessageText,
            initials: "LA",
            avatarColor: "bg-blue-900 text-white",
            isMe: true
        };
        setCaseMessages(prev => [...prev, newMessage]);
        // Note: General case messages are usually ephemeral or stored in a different module
        setNewMessageText("");
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !id) return;

        const newUploads = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            status: 'uploading'
        }));
        setUploadingFiles(prev => [...prev, ...newUploads]);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const uploadId = newUploads[i].id;
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('case_id', id);
                formData.append('document_type', 'Lender Document');
                
                const res = await documentService.uploadDocument(id, formData);
                
                if (res.success) {
                    const newDoc = {
                        id: res.data?.id || Date.now(),
                        name: file.name,
                        type: 'Lender Document',
                        uploadedBy: 'Lender',
                        date: new Date().toLocaleDateString('en-AU'),
                        status: 'UPLOADED',
                        file_url: res.data?.file_url
                    };
                    
                    setCaseData(prev => ({
                        ...prev,
                        documents: [...(prev.documents || []), newDoc]
                    }));
                    
                    setUploadingFiles(prev => prev.map(f => 
                        f.id === uploadId ? { ...f, status: 'complete' } : f
                    ));
                } else {
                    setUploadingFiles(prev => prev.map(f => 
                        f.id === uploadId ? { ...f, status: 'error' } : f
                    ));
                    setToast({ show: true, message: `Failed to upload ${file.name}: ${res.error}`, type: "error" });
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            setToast({ show: true, message: "An error occurred during upload.", type: "error" });
        } finally {
            setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
        }
    };

    const removeUploadingFile = (id) => {
        setUploadingFiles(uploadingFiles.filter(f => f.id !== id));
    };

    const handleViewDocumentLocal = (name) => {
        setToast({ show: true, message: `Opening ${name} in institutional viewer...`, type: "info" });
    };

    const _fetchDocBlob = async (docId) => {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
        const res = await fetch(`/api/v1/documents/${docId}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            // Backend returned a JSON envelope with a download_url (S3 presigned URL)
            const json = await res.json();
            const downloadUrl = json.download_url;
            if (!downloadUrl) throw new Error('No download URL in response');
            const fileRes = await fetch(downloadUrl);
            if (!fileRes.ok) throw new Error(`File fetch returned ${fileRes.status}`);
            return await fileRes.blob();
        }

        return await res.blob();
    };

    const handleDownloadDocument = async (doc) => {
        try {
            setToast({ show: true, message: `Downloading ${doc.name}...`, type: "info" });
            const blob = await _fetchDocBlob(doc.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = doc.name || 'document';
            a.download = filename.includes('.') ? filename : filename + '.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setToast({ show: true, message: `${doc.name} downloaded.`, type: "success" });
        } catch (err) {
            setToast({ show: true, message: "Failed to download document.", type: "error" });
        }
    };

    const handleViewDocument = async (doc) => {
        try {
            const fileUrl = doc.file_url;
            // Local static files served directly — no auth needed
            if (fileUrl && (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('http'))) {
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
                return;
            }
            // API download endpoint (S3-format keys or fallback)
            const downloadUrl = fileUrl && fileUrl.startsWith('/api/') ? fileUrl : `/api/v1/documents/${doc.id}/download`;
            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
            const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const json = await res.json();
                const url = json.download_url || json.url;
                if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            setToast({ show: true, message: "Failed to open document. " + (err.message || ""), type: "error" });
        }
    };

    const handleGenerateDoc = async (type) => {
        setIsGeneratingDoc({ active: true, type });
        setToast({ show: true, message: `Generating ${type}...`, type: "info" });
        try {
            await generateInvestmentMemorandumPDF({
                title: caseData?.title || caseData?.property || type,
                location: caseData?.location || caseData?.suburb || '',
                image: caseData?.image || null,
                propertyValue: caseData?.propertyValue || caseData?.property_value,
                outstandingDebt: caseData?.outstandingDebt,
                lvr: caseData?.lvr,
                returnRate: caseData?.returnRate,
                interestRate: caseData?.interestRate,
                type: caseData?.type || 'Residential',
                status: caseData?.status,
                propertyDetails: { bedrooms: caseData?.bedrooms, bathrooms: caseData?.bathrooms, parking: caseData?.parking },
            });
            setToast({ show: true, message: `${type} PDF downloaded successfully!`, type: "success" });
        } catch {
            setToast({ show: true, message: `Failed to generate ${type}.`, type: "error" });
        } finally {
            setIsGeneratingDoc({ active: false, type: null });
            setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
        }
    };



    const handleSaveNewTask = async () => {
        // Mock save
        setToast({ show: true, message: "Task created!", type: "success" });
        setIsAddTaskModalOpen(false);
    };

    const caseDisplayId = caseData.case_number || (caseData.id ? caseData.id.substring(0, 8).toUpperCase() : "—");
    const addrParts = (caseData.address || "").split(',');
    const addrStreet = addrParts[0] || caseData.address || "—";
    const addrRest = addrParts.slice(1).join(',').trim() || "";

    return (
        <div className="space-y-3 pb-10 max-w-[1280px] mx-auto text-slate-900 px-4">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <button onClick={() => navigate('/lender/dashboard')} className="hover:text-slate-600"><Home size={12} /></button>
                        <ChevronRight size={10} />
                        <button onClick={() => navigate('/lender/my-cases')} className="hover:text-slate-600">My Cases</button>
                        <ChevronRight size={10} />
                        <span className="text-slate-600 font-medium">{caseDisplayId}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-base font-semibold text-slate-900">{caseDisplayId}</h1>
                        <span className="px-2 py-0.5 bg-[#1B3A6B] text-white rounded text-[10px] font-semibold uppercase">{caseData.status}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-semibold uppercase">{caseData.riskLevel}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={11} />{caseData.address}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => generateBrandedPDF({
                            title: `Recovery Pack — ${caseDisplayId}`,
                            subtitle: caseData.address,
                            sections: [
                                { heading: "Borrower", body: caseData.borrower },
                                { heading: "Lead Institution", body: caseData.lender },
                                { heading: "Outstanding Debt", body: `$${caseData.outstandingDebt.toLocaleString()}` },
                                { heading: "Property Valuation", body: `$${caseData.propertyValuation.toLocaleString()}` },
                                { heading: "LVR", body: `${caseData.lvr}%` },
                                { heading: "Status", body: caseData.status },
                            ],
                        })}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Export Pack
                    </button>
                    <button
                        onClick={() => { setFormData({ ...caseData }); setIsManageModalOpen(true); }}
                        className="px-3 py-1.5 bg-[#1B3A6B] text-white rounded-lg text-xs font-medium hover:bg-[#142d55] transition-colors"
                    >
                        Manage Case
                    </button>
                </div>
            </div>

            {/* Case Summary Strip */}
            <div className="bg-white rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
                {[
                    { label: "Borrower", value: caseData.borrower },
                    { label: "Institution", value: caseData.lender },
                    { label: "Outstanding Debt", value: `$${caseData.outstandingDebt.toLocaleString()}` },
                    { label: "Property Valuation", value: `$${caseData.propertyValuation.toLocaleString()}` },
                ].map((item, i) => (
                    <div key={i} className="px-4 py-3">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label)}
                        title={tab.label}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.label
                                ? "bg-white text-[#1B3A6B] shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                    >
                        <tab.icon size={12} />
                        <span>{tab.short}</span>
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="min-h-[500px]">
                {activeTab === "Dashboard" && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Compact banner */}
                        <div className="bg-[#1B3A6B] rounded-xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-white">Case Intelligence Dashboard</p>
                                <p className="text-[10px] text-blue-200/70 mt-0.5">Active monitoring — LVR {caseData.lvr}% · {caseData.status}</p>
                            </div>
                            <button onClick={handleRefreshIntelligence}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-xs font-medium hover:bg-white/20 transition-colors">
                                <RefreshCw size={12} /> Refresh
                            </button>
                        </div>

                        {/* KPI cards row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: "Outstanding Debt",     value: `$${(caseData.outstandingDebt/1000).toFixed(0)}k`,  color: "text-rose-600" },
                                { label: "Property Valuation",   value: `$${(caseData.propertyValuation/1000).toFixed(0)}k`, color: "text-slate-900" },
                                { label: "LVR",                  value: `${caseData.lvr}%`,                                  color: "text-amber-600" },
                                { label: "Net Equity",           value: `$${(caseData.equity/1000).toFixed(0)}k`,            color: "text-emerald-600" },
                            ].map((k, i) => (
                                <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">{k.label}</p>
                                    <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Gauges Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Risk Assessment */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center relative">
                                <div className="w-full flex items-center gap-2 mb-4">
                                    <ShieldCheck size={18} className="text-slate-900" />
                                    <p className="text-sm font-semibold text-slate-900">Risk Assessment</p>
                                </div>

                                <div className="relative w-32 h-16 mb-3">
                                    <svg viewBox="0 0 100 50" className="w-full">
                                        <path
                                            d="M 10 45 A 35 35 0 0 1 90 45"
                                            fill="none"
                                            stroke="#f1f5f9"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 10 45 A 35 35 0 0 1 90 45"
                                            fill="none"
                                            stroke="#F59E0B"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="125.6"
                                            strokeDashoffset={125.6 - (caseData.riskScore / 100) * 125.6}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-end justify-center pb-1">
                                        <span className="text-xs font-semibold text-slate-900 uppercase">MEDIUM</span>
                                    </div>
                                </div>
                                <div className="mt-auto w-full flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Risk Score</p>
                                        <p className="text-sm font-semibold text-slate-900">{caseData.riskScore}/100</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-500">Missed Payments</p>
                                        <p className="text-sm font-semibold text-rose-600">{caseData.arrears.missedPayments}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Loan to Value Ratio */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center relative group hover:shadow-sm transition-all">
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-inner">
                                        <TrendingUp size={14} />
                                    </div>
                                </div>
                                <div className="w-full mb-4">
                                    <p className="text-xs font-medium text-gray-500  mb-1">Risk Parameter</p>
                                    <h4 className="text-sm font-semibold text-slate-900">Loan to Value Ratio</h4>
                                </div>

                                <div className="relative w-36 h-18 mb-3">
                                    <svg viewBox="0 0 100 50" className="w-full">
                                        <defs>
                                            <linearGradient id="lvrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#10B981" />
                                                <stop offset="60%" stopColor="#F59E0B" />
                                                <stop offset="100%" stopColor="#EF4444" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M 10 45 A 35 35 0 0 1 90 45"
                                            fill="none"
                                            stroke="#f1f5f9"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M 10 45 A 35 35 0 0 1 90 45"
                                            fill="none"
                                            stroke="url(#lvrGradient)"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="125.6"
                                            strokeDashoffset={125.6 - (caseData.lvr / 100) * 125.6}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-end justify-center pb-1">
                                        <div className="text-center">
                                            <span className="text-sm font-semibold text-slate-900">{caseData.lvr}%</span>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase">Current LVR</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto w-full grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Total Debt</p>
                                        <p className="text-xs font-semibold text-slate-900">${(caseData.outstandingDebt / 1000).toLocaleString()}k</p>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                        <p className="text-[10px] font-semibold text-emerald-700/50 uppercase mb-0.5">Net Equity</p>
                                        <p className="text-xs font-semibold text-emerald-600">${(caseData.equity / 1000).toLocaleString()}k</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center relative group hover:shadow-sm transition-all">
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
                                        <DollarSign size={14} />
                                    </div>
                                </div>
                                <div className="w-full mb-4">
                                    <p className="text-xs font-medium text-gray-500  mb-1">Exposure Analysis</p>
                                    <h4 className="text-sm font-semibold text-slate-900">Capital Structure</h4>
                                </div>

                                <div className="relative w-20 h-20 mb-3">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="4" />
                                        <circle
                                            cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="4"
                                            strokeDasharray={`${caseData.lvr} ${100 - caseData.lvr}`}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-slate-900">72.8%</span>
                                    </div>
                                </div>

                                <div className="mt-auto w-full space-y-1.5">
                                    <div className="flex items-center justify-between p-2 bg-rose-50 rounded-xl border border-rose-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-[10px] font-semibold text-slate-600 uppercase">Institutional Debt</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-900">{caseData.lvr}%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-semibold text-slate-600 uppercase">Equity Buffer</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-900">{(100 - caseData.lvr).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row - Completion & Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Document Collection */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText size={18} className="text-slate-900" />
                                    <p className="text-sm font-semibold text-slate-900">Document Collection</p>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-medium text-gray-500">Completion</p>
                                    <p className="text-sm font-semibold text-slate-900">{caseData.documentCollection.current}/{caseData.documentCollection.total}</p>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-blue-900 transition-all duration-500" style={{ width: '100%' }}></div>
                                </div>
                                <div className="space-y-3">
                                    {["Title Search", "Identity Verified", "Loan Agreement"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                            <CheckCircle2 size={14} /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Verification Status */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck size={18} className="text-slate-900" />
                                    <p className="text-sm font-semibold text-slate-900">Verification Status</p>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-medium text-gray-500">Completion</p>
                                    <p className="text-sm font-semibold text-slate-900">{caseData.verificationStatus.current}/{caseData.verificationStatus.total}</p>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-blue-900 transition-all duration-500" style={{ width: '100%' }}></div>
                                </div>
                                <div className="space-y-3">
                                    {["InfoTrack Checks", "KYC Verified", "Payment Verified"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                            <CheckCircle2 size={14} /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Parties & Representatives */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users size={18} className="text-slate-900" />
                                    <p className="text-sm font-semibold text-slate-900">Parties & Representatives</p>
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-xs font-medium text-gray-500">Total Parties</p>
                                    <p className="text-sm font-semibold text-slate-900">{caseData.totalParties}</p>
                                </div>
                                <div className="space-y-3">
                                    {["Borrower's Lawyer", "Lender's Lawyer", "Real Estate Agent", "Valuer"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                            <CheckCircle2 size={14} /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Arrears Analysis Bar Chart */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle size={18} className="text-orange-500" />
                                <h4 className="text-sm font-semibold text-slate-900">Arrears Analysis</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 flex items-end gap-6 min-h-[220px] pb-6 border-b border-l border-slate-100 px-6">
                                    <div className="flex-1 flex flex-col items-center gap-4">
                                        <div className="w-full bg-orange-500 rounded-t-xl" style={{ height: "180px" }}></div>
                                        <p className="text-xs font-medium text-gray-500">Outstanding</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center gap-4">
                                        <div className="w-full bg-orange-500 rounded-t-xl" style={{ height: "15px" }}></div>
                                        <p className="text-xs font-medium text-gray-500">Arrears</p>
                                    </div>
                                    {/* Y Axis Labels Mockup */}
                                    <div className="absolute left-0 bottom-0 top-0 w-px bg-slate-100 flex flex-col justify-between text-xs font-semibold text-slate-300 py-10 -ml-16">
                                        <span>1000k</span>
                                        <span>750k</span>
                                        <span>500k</span>
                                        <span>250k</span>
                                        <span>0</span>
                                    </div>
                                </div>

                                <div className="lg:col-span-5">
                                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle size={20} className="text-orange-600" />
                                            <div>
                                                <p className="text-lg font-semibold text-orange-900">Active Arrears</p>
                                                <p className="text-xs font-semibold text-orange-700/60 uppercase">{caseData.arrears.missedPayments} missed payments</p>
                                            </div>
                                        </div>
                                        <p className="text-3xl font-semibold text-orange-900">${caseData.arrears.total.toLocaleString()}</p>
                                        <div className="h-px bg-orange-200/50"></div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium text-orange-600 mb-1.5 opacity-60">Default Date</p>
                                                <p className="text-sm font-semibold text-orange-900">{caseData.arrears.defaultDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-orange-600 mb-1.5 opacity-60">Reason</p>
                                                <p className="text-sm font-bold text-orange-900 leading-relaxed">{caseData.arrears.reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NCCP Alert */}
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-6 flex items-start gap-4">
                            <AlertTriangle className="text-orange-600 shrink-0 mt-1" size={24} />
                            <div>
                                <h5 className="text-sm font-semibold text-orange-900">NCCP Regulated Credit</h5>
                                <p className="text-sm font-bold text-orange-700/80 leading-relaxed mt-1">
                                    This case is subject to the National Consumer Credit Protection Act 2009. All responsible lending obligations and hardship provisions apply.
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-orange-900">
                                    Borrower Status: <span className="text-orange-600">Cooperative</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900  mb-4">Recent Activity Timeline</h3>
                            <div className="space-y-4">
                                {caseData.recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex gap-6 relative">
                                        {idx !== caseData.recentActivity.length - 1 && (
                                            <div className="absolute left-1.5 top-6 bottom-[-32px] w-0.5 bg-slate-50"></div>
                                        )}
                                        <div className="w-3 h-3 rounded-full bg-blue-600 mt-1.5 shrink-0 z-10 shadow-[0_0_0_4px_white]"></div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-semibold text-slate-900">{activity.title}</h4>
                                            <p className="text-sm font-bold text-slate-500">{activity.desc}</p>
                                            <p className="text-xs font-medium text-gray-500">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Full Details" && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5 animate-fade-in">
                        {/* Security Details */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Shield size={14} className="text-blue-600" />
                                <h4 className="text-sm font-semibold text-slate-900">Security & Title Information</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
                                {[
                                    { label: "Case ID",           value: caseDisplayId },
                                    { label: "Property Type",     value: caseData.propertyType || "—" },
                                    { label: "Suburb",            value: caseData.suburb || "—" },
                                    { label: "Postcode",          value: caseData.postcode || "—" },
                                    { label: "State",             value: caseData.state || "—" },
                                    { label: "Property Address",  value: caseData.address || "—" },
                                    { label: "Interest Rate",     value: caseData.interestRate ? `${caseData.interestRate}%` : "—" },
                                    { label: "Default Rate",      value: caseData.defaultRate != null ? `${caseData.defaultRate}%` : "—" },
                                    { label: "Days in Default",   value: caseData.daysInDefault != null ? caseData.daysInDefault : "—" },
                                ].map((f, i) => (
                                    <div key={i}>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                                        <p className="text-xs font-semibold text-slate-800">{f.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Financial Summary */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign size={14} className="text-purple-600" />
                                <h4 className="text-sm font-semibold text-slate-900">Financial Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Outstanding Debt",    value: `$${caseData.outstandingDebt.toLocaleString()}`,   color: "text-rose-600" },
                                    { label: "Property Valuation",  value: `$${caseData.propertyValuation.toLocaleString()}`, color: "text-slate-900" },
                                    { label: "Net Equity",          value: `$${caseData.equity.toLocaleString()}`,            color: "text-emerald-600" },
                                    { label: "LVR",                 value: `${caseData.lvr}%`,                               color: "text-amber-600" },
                                ].map((f, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">{f.label}</p>
                                        <p className={`text-sm font-bold ${f.color}`}>{f.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Lawyer Review" && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
                            <Info size={14} className="text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-700 font-medium">This section is managed by the assigned lawyer. Progress is saved in real time as they complete each verification item.</p>
                        </div>
                        <LawyerReviewPanel caseItem={caseData} />
                    </div>
                )}

                {activeTab === "Property" && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Features */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900  mb-4">Property Assessment</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Asset Type</p>
                                        <p className="text-sm font-bold text-slate-700">{caseData.propertyType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Bedrooms</p>
                                        <p className="text-sm font-bold text-slate-700">{caseData.bedrooms} BHK</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Bathrooms</p>
                                        <p className="text-sm font-bold text-slate-700">{caseData.bathrooms} Units</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Parking</p>
                                        <p className="text-sm font-bold text-slate-700">{caseData.parking} Spaces</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Land Size</p>
                                        <p className="text-sm font-bold text-slate-700">{caseData.landSize}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Image Placeholder */}
                            <div className="relative group overflow-hidden rounded-xl border border-gray-100 shadow-xl min-h-[200px]">
                                {caseData?.image ? (
                                    <>
                                        <img
                                            src={caseData.image}
                                            alt="Property"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex'); }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                                            <button
                                                onClick={() => window.open(caseData.image, '_blank')}
                                                className="h-12 w-full bg-white text-slate-900 rounded-xl font-semibold text-xs uppercase shadow-2xl flex items-center justify-center gap-2"
                                            >
                                                <Eye size={16} /> View Image Gallery
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-[#1d2375] to-[#2d3a9a] flex items-center justify-center rounded-xl">
                                        <p className="text-white/40 text-sm font-semibold uppercase">No property image uploaded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-50"></div>

                        {/* Recent Valuation */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900  mb-4">Professional Valuation History</h3>
                            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1.5">Market Valuation</p>
                                    <p className="text-base font-semibold text-slate-900">${caseData.propertyValuation ? caseData.propertyValuation.toLocaleString() : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1.5">Valuation Date</p>
                                    <p className="text-base font-semibold text-slate-900">{caseData.valuationDate || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1.5">Valuer</p>
                                    <p className="text-base font-semibold text-slate-900">{caseData.valuerName || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Documents" && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 ">Case Document Repository</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">Verified documents and audit trail history</p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="h-12 px-8 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl text-xs font-semibold uppercase hover:bg-blue-100 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <Upload size={16} /> Add Documents
                            </button>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                        </div>

                        {/* Uploading Progress */}
                        {uploadingFiles.length > 0 && (
                            <div className="mb-4 space-y-4 animate-scale-in">
                                {uploadingFiles.map(file => (
                                    <div key={file.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                                                <p className="text-xs font-bold text-gray-400 uppercase">{file.size}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {file.status === 'uploading' ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 w-1/2 animate-pulse"></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-blue-600">Uploading</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={12} /> Complete</span>
                                            )}
                                            <button onClick={() => removeUploadingFile(file.id)} className="text-gray-400 hover:text-rose-500 transition-colors"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-xs font-medium text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Document Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Security Level</th>
                                        <th className="px-6 py-4">Last Modified</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {caseData.documents.map((doc, i) => (
                                        <tr key={doc.id || i} className="hover:bg-gray-50/20 transition-all group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-slate-400 shadow-sm transition-colors group-hover:text-blue-600">
                                                        {doc.type === 'Property Image' ? <Home size={18} /> : <FileText size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                                                        <p className="text-xs font-bold text-gray-400 uppercase">{doc.type} • {doc.uploadedBy || 'Borrower'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold uppercase  border ${
                                                    doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {doc.status || 'Verified'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-blue-600/60">
                                                    <Lock size={12} />
                                                    <span className="text-xs font-semibold uppercase ">Institutional</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-400">{doc.date || doc.created_at}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDocument(doc)}
                                                        className="p-2 transition-all rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                        title="View document"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadDocument(doc)}
                                                        className="p-2 transition-all rounded-lg text-gray-400 hover:text-slate-900 hover:bg-gray-100"
                                                        title="Download document"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "Bids" && (() => {
                    const isOwnCase = !!(authUser?.id && caseData?.lender_id && String(caseData.lender_id) === String(authUser.id));
                    return (
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 uppercase">Live Auction Bids</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">
                                    {isOwnCase ? 'Bid monitoring — you cannot bid on your own case' : 'Real-time bid monitoring — lenders can also place bids'}
                                </p>
                            </div>
                            {isOwnCase && (
                                <div className="mb-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                                    <p className="text-xs text-amber-800 font-medium">You are the original lender on this case and cannot place a bid on your own case.</p>
                                </div>
                            )}
                            <CaseBidPanel
                                caseId={id}
                                canBid={!isOwnCase}
                                canClose={false}
                                currentUser={{ name: authUser?.name, role: 'Lender' }}
                            />
                        </div>
                    );
                })()}

                {activeTab === "Messages" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <CaseChat caseId={id} currentUser={{ name: authUser?.name, role: 'Lender' }} />
                    </div>
                )}

                {activeTab === "Activity" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <CaseActivityLog caseId={id} />
                    </div>
                )}

                {activeTab === "Investment Memorandum" && (
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in space-y-5">
                        {/* Header Controls */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-semibold text-slate-900  uppercase">Investment Memorandum</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Professional institutional-grade offering circular</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setToast({ show: true, message: "Term modification request submitted. Compliance team will review and update the memorandum within 24 hours.", type: "info" })}
                                    className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Edit3 size={16} className="text-slate-400" /> Modify Terms
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-gray-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Printer size={16} className="text-slate-400" /> Print IM
                                </button>
                                <button
                                    onClick={() => handleGenerateDoc('IM')}
                                    disabled={isGeneratingDoc.active}
                                    className="h-12 px-8 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-2 active:scale-95 disabled:bg-slate-400"
                                >
                                    {isGeneratingDoc.active && isGeneratingDoc.type === 'IM' ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {isGeneratingDoc.active && isGeneratingDoc.type === 'IM' ? 'Generating...' : 'Regenerate Document'}
                                </button>
                            </div>
                        </div>

                        {/* IM Document Body */}
                        <div className="max-w-[1000px] mx-auto bg-white border border-gray-100 shadow-2xl overflow-hidden rounded-[48px]">
                            {/* Hero Section */}
                            <div className="relative h-[480px]">
                                {caseData.image ? (
                                    <img
                                        src={caseData.image}
                                        alt="Property"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : null}
                                <div className="w-full h-full bg-gradient-to-br from-[#1d2375] to-[#2d3a9a]" style={caseData.image ? { display: 'none' } : {}} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
                                <div className="absolute top-6 left-10">
                                    <div className="px-5 py-2 bg-rose-600 text-white text-xs font-semibold uppercase tracking-[0.3em] rounded-xl shadow-2xl">Institutional Opportunity</div>
                                </div>
                                <div className="absolute bottom-12 left-12 right-12">
                                    <div className="space-y-4">
                                        <h2 className="text-5xl font-semibold text-white leading-none ">{caseData.address.split(',')[0]}</h2>
                                        <div className="flex items-center gap-3 text-white/80">
                                            <MapPin size={20} className="text-blue-400" />
                                            <span className="text-xl font-bold ">{caseData.address.split(',').slice(1).join(',').trim()}</span>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            {[
                                                { icon: <BedDouble size={16} />, label: `${caseData.bedrooms} BHK` },
                                                { icon: <Bath size={16} />, label: `${caseData.bathrooms} Units` },
                                                { icon: <Car size={16} />, label: `${caseData.parking} Spaces` }
                                            ].map((feature, i) => (
                                                <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                                                    <span className="text-blue-400">{feature.icon}</span>
                                                    <span className="text-white text-sm font-semibold">{feature.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Stats Bar */}
                            <div className="px-12 -mt-12 relative z-10">
                                <div className="bg-white rounded-xl shadow-2xl border border-slate-100 flex divide-x divide-slate-100 p-2">
                                    <div className="flex-1 px-8 py-6">
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Asset Valuation</p>
                                        <p className="text-3xl font-semibold text-slate-900 ">${(caseData.propertyValuation / 1000).toLocaleString()}k</p>
                                    </div>
                                    <div className="flex-1 px-8 py-6">
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Lender Exposure</p>
                                        <p className="text-3xl font-semibold text-blue-600 ">${(caseData.outstandingDebt / 1000).toLocaleString()}k</p>
                                    </div>
                                    <div className="flex-1 px-8 py-6">
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Expected IRR</p>
                                        <p className="text-3xl font-semibold text-emerald-500 ">12.5%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                    <div className="lg:col-span-3 space-y-6">
                                        <h3 className="text-2xl font-semibold text-slate-900  uppercase">Executive Summary</h3>
                                        <p className="text-sm text-slate-600 font-bold leading-relaxed">
                                            This Investment Memorandum presents a secured secondary lending opportunity backed by a premium residential asset in {(caseData.address.split(',')[1] || caseData.address.split(',')[0] || caseData.address).trim()}. The property is currently in mortgage default, presenting a unique institutional entry point at a significant margin to the appraised market value.
                                        </p>
                                        <p className="text-sm text-slate-600 font-bold leading-relaxed">
                                            The investment is secured by a first-registered mortgage with an extremely conservative LVR of {caseData.lvr}%, providing a substantial equity buffer of ${caseData.equity.toLocaleString()} against potential market volatility during the enforcement period.
                                        </p>
                                    </div>
                                    <div className="lg:col-span-2 space-y-4">
                                        {[
                                            { title: "First Mortgage Position", desc: "Clean title; no secondary liens", color: "emerald" },
                                            { title: "Institutional Custody", desc: "Managed via Brickbanq Trust", color: "blue" },
                                            { title: "Verified Compliance", desc: "Full NCCP & AML/CTF clearance", color: "purple" }
                                        ].map((item, i) => (
                                            <div key={i} className={`p-5 rounded-lg border border-gray-100 bg-white flex items-center gap-4 hover:shadow-lg transition-all`}>
                                                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 shadow-inner`}>
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Investment Highlights */}
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-semibold text-slate-900  uppercase">High-Yield Highlights</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { title: "Accelerated IRR", desc: "Target returns exceeding 12.5% through institutional default rate premium.", icon: <TrendingUp />, bg: "bg-emerald-50", color: "text-emerald-600" },
                                            { title: "Strategic Security", desc: "Collateralized by a prime asset in a high-growth urban corridor.", icon: <Shield />, bg: "bg-blue-50", color: "text-blue-600" },
                                            { title: "Verified Liquidity", desc: "Underlying asset demonstrates strong secondary market demand.", icon: <Target />, bg: "bg-purple-50", color: "text-purple-600" },
                                            { title: "Protocol Enforcement", desc: "Automated legal workflow initiated; estimated 5-month recovery cycle.", icon: <Scale />, bg: "bg-rose-50", color: "text-rose-600" }
                                        ].map((hl, i) => (
                                            <div key={i} className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl flex gap-6 hover:bg-white hover:shadow-xl transition-all">
                                                <div className={`w-14 h-14 rounded-2xl ${hl.bg} ${hl.color} flex items-center justify-center shadow-inner shrink-0`}>
                                                    {hl.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-semibold text-slate-900 mb-2">{hl.title}</h4>
                                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">{hl.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Risk Matrix */}
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-semibold text-slate-900  uppercase">Lender Risk Profile</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden">
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold uppercase  text-blue-300">Collateral Grade</h4>
                                                    <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/20">Institutional Grade A+</span>
                                                </div>
                                                <div className="space-y-6">
                                                    {[
                                                        { label: "Equity Coverage", pct: 90, color: "bg-emerald-400" },
                                                        { label: "Liquidity Index", pct: 75, color: "bg-blue-400" },
                                                        { label: "Enforcement Readiness", pct: 85, color: "bg-amber-400" }
                                                    ].map((row, i) => (
                                                        <div key={i} className="space-y-3">
                                                            <div className="flex justify-between text-xs font-semibold uppercase">
                                                                <span className="text-white/60">{row.label}</span>
                                                                <span>{row.pct}%</span>
                                                            </div>
                                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                <div className={`h-full ${row.color} rounded-full transition-all duration-1000`} style={{ width: `${row.pct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
                                        </div>

                                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
                                            <div className="flex items-center gap-3 text-rose-600 mb-4">
                                                <AlertTriangle size={24} />
                                                <h4 className="text-sm font-semibold uppercase ">Institutional Safeguards</h4>
                                            </div>
                                            <div className="space-y-6">
                                                {[
                                                    "Title insurance fully active and updated",
                                                    "Institutional LMI coverage for primary exposure",
                                                    "Pre-legal enforcement verification complete",
                                                    "Arrears management strategy protocols active"
                                                ].map((sg, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <CheckCircle2 size={18} className="text-rose-300 shrink-0 mt-0.5" />
                                                        <p className="text-sm font-bold text-rose-800/80 leading-snug">{sg}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="bg-slate-900 p-5 text-white text-center border-t border-white/5">
                                <h4 className="text-3xl font-semibold mb-4 ">Brickbanq Institutional Trust</h4>
                                <p className="text-white/40 font-bold text-xs uppercase tracking-[0.4em] mb-5">Confidential Assignment Repository</p>
                                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-xs font-semibold uppercase text-blue-400">Case Reference</p>
                                        <p className="text-sm font-semibold">{caseData.case_number || caseData.id}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-xs font-semibold uppercase text-blue-400">Protocol Date</p>
                                        <p className="text-sm font-semibold">March 2026</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-xs font-semibold uppercase text-blue-400">Registry ID</p>
                                        <p className="text-sm font-semibold">BB-MIP-P01</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "Settlement" && (
                    <div className="space-y-4 animate-fade-in pb-6">
                        {/* Premium Sub-navigation */}
                        <div className="bg-white p-1 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-1">
                                {[
                                    { id: "AI Checklist Manager", icon: <ClipboardCheck size={16} /> },
                                    { id: "Settlement Overview", icon: <FileText size={16} /> },
                                    { id: "PEXA Settlement", icon: <Building size={16} /> }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSettlementSubTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${settlementSubTab === tab.id
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {settlementSubTab === "AI Checklist Manager" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Protocol Status</p>
                                        <div className="text-xl font-semibold text-slate-900 leading-none mb-2">{caseSettlementData.summary.completed}/{caseSettlementData.summary.total}</div>
                                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${(caseSettlementData.summary.completed / caseSettlementData.summary.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    {[
                                        { label: "In Active Workflow", value: caseSettlementData.summary.inProgress, color: "text-blue-600", icon: <Clock size={16} />, bg: "bg-blue-50" },
                                        { label: "Overdue Actions", value: caseSettlementData.summary.overdue, color: "text-rose-600", icon: <AlertTriangle size={16} />, bg: "bg-rose-50" },
                                        { label: "Blocked Protocol", value: caseSettlementData.summary.blocked, color: "text-amber-500", icon: <Pause size={16} />, bg: "bg-amber-50" },
                                        { label: "Est. Distribution", value: caseSettlementData.summary.estCompletion, color: "text-slate-900", icon: <Calendar size={16} />, bg: "bg-slate-50" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                            <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center shrink-0`}>{stat.icon}</div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-500">{stat.label}</p>
                                                <div className="text-sm font-semibold text-slate-900">{stat.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Intelligence Bar */}
                                <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-blue-400 border border-white/10">
                                            <Sparkles size={20} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold">AI Settlement Intelligence</h4>
                                            <p className="text-blue-100/60 text-xs mt-0.5">Autonomous Protocol Orchestration • Real-time Compliance</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <button
                                            onClick={() => setToast({ show: true, message: "AI is analysing settlement protocol for optimisation opportunities. Results will appear in the checklist.", type: "info" })}
                                            className="px-3 py-2 bg-white/5 rounded-lg text-xs font-semibold hover:bg-white/10 transition-all border border-white/10"
                                        >
                                            Optimize Protocol
                                        </button>
                                        <button
                                            onClick={() => setToast({ show: true, message: "Auto-settle protocol deployed. System will execute settlement triggers automatically when all conditions are met.", type: "success" })}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
                                        >
                                            <Scale size={14} /> Deploy Auto-Settle
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                                </div>

                                {/* Checklist Architecture */}
                                <div className="space-y-3">
                                    {caseSettlementData.categories.map((cat) => (
                                        <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                            <button
                                                onClick={() => setExpandedCategory(expandedCategory === cat.title ? null : cat.title)}
                                                className="w-full p-4 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${cat.bg} rounded-lg flex items-center justify-center text-blue-600`}>
                                                        {cat.icon}
                                                    </div>
                                                    <div className="text-left">
                                                        <h5 className="text-sm font-semibold text-slate-800">{cat.title}</h5>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-slate-400">{cat.completed}/{cat.total} phases</span>
                                                            <span className="text-xs font-semibold text-blue-600">{cat.progress}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="hidden sm:block w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-900 rounded-full transition-all duration-1000" style={{ width: `${cat.progress}%` }}></div>
                                                    </div>
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border border-slate-100 transition-all ${expandedCategory === cat.title ? 'bg-blue-900 text-white border-blue-900 rotate-90' : 'bg-white text-slate-400'}`}>
                                                        <ChevronRight size={14} />
                                                    </div>
                                                </div>
                                            </button>

                                            {expandedCategory === cat.title && (
                                                <div className="px-4 pb-4 space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    {cat.tasks.filter(t => !t.archived).map((task) => (
                                                        <div key={task.id} className="group p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex gap-3">
                                                                    <div className="pt-0.5">
                                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                                                                            {task.completed && <Check size={12} className="text-white" />}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <div>
                                                                            <h6 className={`text-sm font-semibold ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</h6>
                                                                            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-0.5">{task.desc}</p>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>{task.status}</div>
                                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${task.priority === "CRITICAL" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-white text-slate-500 border-slate-100"}`}>{task.priority}</div>
                                                                            <span className="text-xs text-slate-500">{task.assignee}</span>
                                                                            <span className="text-xs text-slate-400">{task.date}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button
                                                                            onClick={() => setToast({ show: true, message: `Protocol details for "${task.title}": ${task.desc}. Assignee: ${task.assignee}. Due: ${task.date}.`, type: "info" })}
                                                                            className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-semibold text-blue-900 hover:bg-blue-50 transition-all"
                                                                        >Details</button>
                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setOpenTaskMenuId(openTaskMenuId === task.id ? null : task.id)}
                                                                                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                                                            >
                                                                                <MoreHorizontal size={14} />
                                                                            </button>
                                                                            {openTaskMenuId === task.id && (
                                                                                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden">
                                                                                    {[
                                                                                        { label: "Edit Task", icon: Edit3, type: "edit" },
                                                                                        { label: "Reassign", icon: Users, type: "reassign" },
                                                                                        { label: "Set Priority", icon: AlertTriangle, type: "priority" },
                                                                                        { label: "Archive", icon: FileText, type: "archive" },
                                                                                        { label: "Escalate to Compliance", icon: ShieldCheck, type: "escalate" }
                                                                                    ].map((action) => (
                                                                                        <button
                                                                                            key={action.label}
                                                                                            onClick={() => openTaskAction(action.type, task)}
                                                                                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                                                        >
                                                                                            <action.icon size={14} className="text-slate-400" />
                                                                                            {action.label}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {settlementSubTab === "Settlement Overview" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {/* Property Hub Banner */}
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="w-32 h-24 rounded-xl overflow-hidden border border-slate-100 shadow-inner shrink-0 relative group">
                                            {(caseData?.image || settlementOverviewData.property.image) ? (
                                                <img src={caseData?.image || settlementOverviewData.property.image} alt="Property" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#1d2375] to-[#2d3a9a]" />
                                            )}
                                        </div>
                                        <div className="text-center sm:text-left space-y-2">
                                            <div>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold uppercase rounded-full mb-1.5 inline-block">Verified Institutional Asset</span>
                                                <h3 className="text-base font-semibold text-slate-900 leading-tight">{settlementOverviewData.property.title}</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">{settlementOverviewData.property.location}</p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <Clock size={12} className="text-blue-600" />
                                                    {settlementOverviewData.property.settlementDate}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <Target size={12} className="text-emerald-500" />
                                                    {settlementOverviewData.property.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 min-w-[240px] bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-full space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-medium text-gray-500">Protocol Preparedness</p>
                                                <span className="text-lg font-semibold text-blue-600 tabular-nums">{settlementOverviewData.property.readiness}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${settlementOverviewData.property.readiness}%` }}></div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setToast({ show: true, message: "Disbursement authorization initiated. Awaiting dual-approval from compliance and finance team. You will be notified when approved.", type: "success" })}
                                            className="w-full py-2 bg-blue-900 text-white rounded-lg font-semibold text-xs uppercase hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={14} /> Authorize Final Disbursement
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                    {/* Critical Protocol Alerts */}
                                    <div className="lg:col-span-5 bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-800">Protocol Exceptions</h4>
                                            <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
                                                <AlertTriangle size={14} className="animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {settlementOverviewData.outstanding.map(item => (
                                                <div key={item.id} className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-white hover:border-slate-200 transition-all">
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-slate-800">{item.title}</h5>
                                                        <p className="text-[10px] text-gray-500">{item.responsible} Priority</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase ${item.status === 'overdue' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                        {item.days}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full py-2 border border-dashed border-slate-200 rounded-lg text-xs font-semibold uppercase text-slate-400 hover:border-blue-900 hover:text-blue-900 hover:bg-blue-50/50 transition-all">
                                            Request Protocol Waiver
                                        </button>
                                    </div>

                                    {/* Encrypted Protocol Thread */}
                                    <div className="lg:col-span-7 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm h-[420px]">
                                        <div className="p-4 border-b border-slate-50 bg-white">
                                            <h4 className="text-sm font-semibold text-slate-800">Institutional Protocol Ledger</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase">End-to-end encrypted settlement communication</p>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                                            {settlementOverviewData.thread.map((msg) => (
                                                <div key={msg.id} className="flex gap-3">
                                                    <div className={`w-9 h-9 rounded-lg ${msg.color} text-white flex items-center justify-center font-semibold text-sm shrink-0`}>
                                                        {msg.initials}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-slate-900">{msg.user}</span>
                                                                <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-semibold text-slate-400 uppercase">{msg.role}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-300 tabular-nums">{msg.time}</span>
                                                        </div>
                                                        <div className="bg-slate-50/50 border border-transparent p-3 rounded-lg">
                                                            <p className="text-xs text-slate-600 leading-relaxed">{msg.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                                            {/* Pending attachment preview */}
                                            {pendingAttachment && (
                                                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <Paperclip size={12} className="text-blue-600 shrink-0" />
                                                    <span className="text-[11px] text-blue-800 font-medium flex-1 truncate">
                                                        {pendingAttachment.name} ({(pendingAttachment.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                    <button
                                                        onClick={() => { setPendingAttachment(null); if (settlementFileInputRef.current) settlementFileInputRef.current.value = ''; }}
                                                        className="text-blue-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <input ref={settlementFileInputRef} type="file" className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setPendingAttachment({ name: file.name, size: file.size });
                                                    }
                                                }} />
                                                <button
                                                    onClick={() => settlementFileInputRef.current?.click()}
                                                    className={`h-9 w-9 border rounded-lg flex items-center justify-center transition-all ${pendingAttachment ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}`}
                                                >
                                                    <Paperclip size={14} />
                                                </button>
                                                <input
                                                    type="text"
                                                    value={settlementMessage}
                                                    onChange={(e) => setSettlementMessage(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                                    placeholder="Enter formal protocol communication..."
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 h-9"
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={!settlementMessage.trim() && !pendingAttachment}
                                                    className="h-9 w-9 bg-blue-900 text-white rounded-lg flex items-center justify-center hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {settlementSubTab === "PEXA Settlement" && (
                            <div className="bg-white p-10 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center animate-fade-in relative overflow-hidden">
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-4 border border-blue-100">
                                        <Building size={28} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 uppercase mb-2">PEXA Exchange Interface</h3>
                                    <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                                        The electronic settlement workspace is configured for institutional funds clearance.
                                        Lender legal representation has finalized protocol workspace BB-2026-X01.
                                    </p>
                                    <div className="flex gap-3">
                                        <button className="px-5 py-2.5 bg-blue-900 text-white rounded-lg font-semibold text-xs uppercase hover:bg-blue-800 transition-all flex items-center gap-2">
                                            <Handshake size={14} /> Sync PEXA Workspace
                                        </button>
                                        <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs uppercase hover:bg-slate-50 transition-all">
                                            Audit Trails
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* ── Task Action Modals ──────────────────────────────────────── */}
            {taskActionModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTaskActionModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {taskActionModal.type === 'edit' && 'Edit Task'}
                                    {taskActionModal.type === 'reassign' && 'Reassign Task'}
                                    {taskActionModal.type === 'priority' && 'Set Priority'}
                                    {taskActionModal.type === 'archive' && 'Archive Task'}
                                    {taskActionModal.type === 'escalate' && 'Escalate to Compliance'}
                                </h3>
                                <p className="text-xs font-medium text-slate-400 mt-0.5 truncate max-w-[280px]">{taskActionModal.task.title}</p>
                            </div>
                            <button onClick={() => setTaskActionModal(null)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><X size={18} /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {taskActionModal.type === 'edit' && (
                                <>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Task Title</label>
                                        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" value={taskActionForm.title || ''} onChange={e => setTaskActionForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Description</label>
                                        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" value={taskActionForm.desc || ''} onChange={e => setTaskActionForm(f => ({ ...f, desc: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Assignee</label>
                                            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" value={taskActionForm.assignee || ''} onChange={e => setTaskActionForm(f => ({ ...f, assignee: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Due Date</label>
                                            <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" value={taskActionForm.date ? new Date(taskActionForm.date).toISOString().split('T')[0] : ''} onChange={e => setTaskActionForm(f => ({ ...f, date: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Priority</label>
                                        <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" value={taskActionForm.priority || 'HIGH'} onChange={e => setTaskActionForm(f => ({ ...f, priority: e.target.value }))}>
                                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            {taskActionModal.type === 'reassign' && (
                                <>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Assign To</label>
                                        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" placeholder="e.g. John Smith" value={taskActionForm.assignee || ''} onChange={e => setTaskActionForm(f => ({ ...f, assignee: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Email (optional)</label>
                                        <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" placeholder="assignee@email.com" value={taskActionForm.email || ''} onChange={e => setTaskActionForm(f => ({ ...f, email: e.target.value }))} />
                                    </div>
                                </>
                            )}
                            {taskActionModal.type === 'priority' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                                        <button key={p} onClick={() => setTaskActionForm(f => ({ ...f, priority: p }))}
                                            className={`py-3 rounded-xl text-sm font-semibold border transition-all ${taskActionForm.priority === p ?
                                                p === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600' :
                                                p === 'HIGH' ? 'bg-amber-500 text-white border-amber-500' :
                                                p === 'MEDIUM' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-600 text-white border-slate-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {taskActionModal.type === 'archive' && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-amber-900">This task will be archived and hidden from the active checklist. You can restore it later if needed.</p>
                                </div>
                            )}
                            {taskActionModal.type === 'escalate' && (
                                <>
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                                        <ShieldCheck size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium text-rose-900">This task will be flagged as CRITICAL and escalated to the compliance team for urgent review.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Escalation Reason</label>
                                        <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" placeholder="Describe why this needs compliance attention..." value={taskActionForm.reason || ''} onChange={e => setTaskActionForm(f => ({ ...f, reason: e.target.value }))} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button onClick={() => setTaskActionModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                            <button
                                onClick={handleTaskActionSave}
                                disabled={taskActionSaving}
                                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-60 ${
                                    taskActionModal.type === 'archive' ? 'bg-amber-600 hover:bg-amber-700' :
                                    taskActionModal.type === 'escalate' ? 'bg-rose-600 hover:bg-rose-700' :
                                    'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {taskActionSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {taskActionModal.type === 'edit' && 'Save Changes'}
                                {taskActionModal.type === 'reassign' && 'Reassign Task'}
                                {taskActionModal.type === 'priority' && 'Set Priority'}
                                {taskActionModal.type === 'archive' && 'Archive Task'}
                                {taskActionModal.type === 'escalate' && 'Escalate Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-right-4 duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-blue-900 text-white' :
                        toast.type === 'error' ? 'bg-rose-600 text-white' :
                            'bg-slate-900 text-white'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        <p className="text-sm font-semibold ">{toast.message}</p>
                        <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Manage Case Modal */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)}></div>
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 uppercase ">Case Management Console</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">Update institutional parameters for {caseData.case_number || caseData.id}</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-1 rounded-2xl bg-gray-50 border border-gray-200/50 mx-8 mt-6 flex overflow-x-auto scrollbar-hide">
                            {["Case Details", "Financials", "Compliance", "Media"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setManageModalTab(t)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase transition-all whitespace-nowrap ${manageModalTab === t ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pt-6 space-y-4">
                            {manageModalTab === "Case Details" && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Case Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        >
                                            <option>In Auction</option>
                                            <option>Lawyer Review</option>
                                            <option>Settlement</option>
                                            <option>Defaulted</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Risk Profile</label>
                                        <select
                                            value={formData.riskLevel}
                                            onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        >
                                            <option>Low Risk</option>
                                            <option>Medium Risk</option>
                                            <option>High Risk</option>
                                            <option>Critical Risk</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Property Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {manageModalTab === "Financials" && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Outstanding Debt ($)</label>
                                        <input
                                            type="number"
                                            value={formData.outstandingDebt}
                                            onChange={(e) => setFormData({ ...formData, outstandingDebt: Number(e.target.value) })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Market Valuation ($)</label>
                                        <input
                                            type="number"
                                            value={formData.propertyValuation}
                                            onChange={(e) => setFormData({ ...formData, propertyValuation: Number(e.target.value) })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Lender Interest Rate (%)</label>
                                        <input
                                            type="number"
                                            value={formData.interestRate}
                                            onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-500 ml-1">Default Penalty Rate (%)</label>
                                        <input
                                            type="number"
                                            value={formData.defaultRate}
                                            onChange={(e) => setFormData({ ...formData, defaultRate: Number(e.target.value) })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {manageModalTab === "Compliance" && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-900">Institutional Protocol Lock</h4>
                                            <p className="text-xs font-bold text-blue-700/60 uppercase">Manual overrides require senior signatory authority</p>
                                        </div>
                                        <div className="w-12 h-6 bg-blue-200 rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-blue-600 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            "Bypass NCCP Hardship Verification",
                                            "Override LVR Cap Warnings",
                                            "Manual Priority Registration",
                                            "Force Settlement Status"
                                        ].map((opt, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50">
                                                <span className="text-sm font-bold text-slate-700 uppercase ">{opt}</span>
                                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {manageModalTab === "Media" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-4 gap-4">
                                        {propertyImages.map((img) => (
                                            <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                                <img src={img.url} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removePropertyImage(img.id)}
                                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                                            <Upload className="text-gray-400 mb-2" />
                                            <span className="text-xs font-medium text-gray-500">Add Media</span>
                                            <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between sticky bottom-0 z-10">
                            <button onClick={() => setIsManageModalOpen(false)} className="px-8 py-3 text-xs font-semibold text-slate-500 uppercase hover:text-slate-700">Cancel Changes</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-14 px-12 bg-blue-900 text-white rounded-2xl font-semibold text-sm uppercase hover:bg-black transition-all shadow-xl shadow-blue-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                {isSaving ? "Synchronizing..." : "Serialize Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Communication Modal */}
            {isBulkCommModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsBulkCommModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 uppercase ">Institutional Broadcast</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">Secure broadcast to verified stake-holders</p>
                            </div>
                            <button onClick={() => setIsBulkCommModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-5 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 ml-1">Message Subject</label>
                                <input
                                    type="text"
                                    value={bulkMessage.subject}
                                    onChange={(e) => setBulkMessage({ ...bulkMessage, subject: e.target.value })}
                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all"
                                    placeholder="Institutional Protocol Update..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-500 ml-1">Message Body</label>
                                <textarea
                                    value={bulkMessage.body}
                                    onChange={(e) => setBulkMessage({ ...bulkMessage, body: e.target.value })}
                                    className="w-full min-h-[160px] bg-gray-50 border border-gray-100 rounded-3xl p-6 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all resize-none shadow-inner"
                                    placeholder="Enter directive or protocol information..."
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleSendBulkComm}
                                className="h-14 px-12 bg-blue-900 text-white rounded-2xl font-semibold text-sm uppercase hover:bg-blue-800 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                            >
                                <Send size={18} /> Broadcast Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
