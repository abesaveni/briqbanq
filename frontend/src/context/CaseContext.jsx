// src/context/CaseContext.jsx
import { createContext, useState, useContext, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { casesService, auctionService, documentService, settlementService } from '../api/dataService'

const CaseContext = createContext()

function resolveImageUrl(url) {
    if (!url) return null
    return url
}

function mapBid(b, index) {
    return {
        id: b.id,
        bidder: b.investor_name || b.bidder_name || b.user_name || `Investor ${String(b.investor_id || b.id || '').slice(0, 6)}`,
        amount: parseFloat(b.amount) || 0,
        timestamp: b.created_at || b.placed_at || new Date().toISOString(),
        status: index === 0 ? 'winning' : 'outbid',
    }
}

function mapDocument(d) {
    return {
        id: d.id,
        name: d.document_name || d.file_name || d.filename || d.original_filename || d.name || 'Document',
        type: d.document_type || d.type || 'Document',
        uploadedBy: d.uploaded_by_name || d.uploader_name || (d.uploaded_by && d.uploaded_by.length < 40 ? d.uploaded_by : 'Borrower'),
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-AU') : '',
        file: d.file_url || null,
        status: d.status || 'UPLOADED'
    }
}

function mapSettlement(s) {
    if (!s) return { estimatedProgress: 0, checklist: [], timeline: [] }
    const checklist = Array.isArray(s.checklist_items || s.items || s.checklist)
        ? (s.checklist_items || s.items || s.checklist).map((item, i) => ({
            id: item.id || i,
            item: item.name || item.description || item.item || 'Settlement Item',
            responsible: item.responsible_party || item.assigned_to || item.responsible || 'Admin',
            status: item.status === 'COMPLETED' || item.is_complete ? 'Approved' : 'Pending',
        }))
        : []
    const estimatedProgress = s.progress_percentage ?? s.completion_percentage ??
        (checklist.length > 0 ? Math.round((checklist.filter(i => i.status === 'Approved').length / checklist.length) * 100) : 0)
    const timeline = Array.isArray(s.timeline || s.milestones)
        ? (s.timeline || s.milestones).map(t => ({
            step: t.step || t.name || t.milestone || 'Step',
            date: t.date || t.scheduled_date || '',
            status: t.status === 'COMPLETED' ? 'completed' : t.status === 'IN_PROGRESS' ? 'in-progress' : 'upcoming',
        }))
        : []
    return { estimatedProgress, checklist, timeline }
}

// Map flat backend CaseResponse to the nested shape expected by CaseDetailsLayout
function mapApiCase(apiCase) {
    const meta = apiCase.metadata_json || {}
    const outstandingDebt = parseFloat(apiCase.outstanding_debt) || 0
    const estimatedValue = parseFloat(apiCase.estimated_value) || 0
    const ltv = estimatedValue > 0 ? Math.round((outstandingDebt / estimatedValue) * 100) : 0
    const riskLevel = apiCase.risk_level || 'Medium'
    
    // Robust images parsing
    let property_images = apiCase.property_images
    if (typeof property_images === 'string') {
        try { property_images = JSON.parse(property_images) } catch (e) { property_images = [] }
    }
    if (!Array.isArray(property_images)) {
        property_images = meta.property_images || []
    }

    const images = property_images.map(url => ({ url: resolveImageUrl(url) }))

    // Use property_images first; fall back to documents only for real (non-local://) URLs
    const firstDocImage = (apiCase.documents || []).find(d =>
        (d.document_type === 'Property Image' || d.type === 'Property Image') &&
        d.file_url && !d.file_url.startsWith('local://')
    )?.file_url;

    const resolvedImage = (property_images[0] || null) || firstDocImage || null;

    return {
        image: resolveImageUrl(resolvedImage),
        id: apiCase.case_number || String(apiCase.id),
        _id: apiCase.id,
        status: apiCase.status,
        risk: `${riskLevel} Risk`,
        address: apiCase.property_address || '',
        borrower: {
            name: apiCase.borrower_name || 'Unknown Borrower',
            contact: '',
        },
        lender: {
            name: apiCase.lender_name || 'Unassigned',
            contact: '',
        },
        loan: {
            outstandingDebt,
            interestRate: parseFloat(apiCase.interest_rate) || 0,
            defaultRate: parseFloat(meta.default_rate) || 0,
            daysInDefault: parseInt(meta.days_in_default) || 0,
            ltv,
        },
        property: {
            address: apiCase.property_address || '',
            suburb: meta.suburb || apiCase.suburb || '',
            postcode: meta.postcode || apiCase.postcode || '',
            state: apiCase.state || '',
            type: apiCase.property_type || '',
            bedrooms: meta.bedrooms ?? apiCase.bedrooms ?? 0,
            bathrooms: meta.bathrooms ?? apiCase.bathrooms ?? 0,
            kitchens: meta.kitchens ?? 0,
            parking: meta.parking ?? apiCase.parking ?? 0,
            landSize: apiCase.land_size || null,
        },
        valuation: {
            amount: estimatedValue,
            date: apiCase.updated_at,
            valuer: meta.valuer_name || apiCase.valuer_name || '',
        },
        financial: {
            propertyValuation: estimatedValue,
            outstandingDebt,
            equityAvailable: estimatedValue - outstandingDebt,
            minimumBid: outstandingDebt,
            currentHighestBid: null,
        },
        timeline: {
            caseCreated: apiCase.created_at,
            lastUpdated: apiCase.updated_at,
        },
        images,
        bids: [],
        documents: Array.isArray(apiCase.documents) ? apiCase.documents.map(mapDocument) : [],
        messages: [],
        activity: [],
        settlement: { estimatedProgress: 0, checklist: [], timeline: [] },
        // preserve raw fields for tabs that may need them
        _raw: apiCase,
        // pass through fields needed by shared components
        metadata_json: apiCase.metadata_json || {},
        case_number: apiCase.case_number,
        assigned_lawyer_id: apiCase.assigned_lawyer_id,
        lawyer_name: apiCase.lawyer_name,
        rejection_reason: apiCase.rejection_reason,
    }
}

export function CaseProvider({ children }) {
    const { id: caseId } = useParams()
    const [caseData, setCaseData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!caseId) return
        setLoading(true)
        casesService.getCaseById(caseId)
            .then(async res => {
                if (res.success && res.data) {
                    const mapped = mapApiCase(res.data)
                    setCaseData(mapped)

                    // Fetch supplementary data in parallel (non-blocking)
                    const [bidsRes, docsRes, settlementRes, auctionRes] = await Promise.allSettled([
                        auctionService.getBidsByCase(caseId),
                        documentService.getDocuments(caseId),
                        settlementService.getSettlement(caseId),
                        auctionService.getAuctionsByCase(caseId),
                    ])

                    setCaseData(prev => {
                        if (!prev) return prev
                        const rawBids = bidsRes.status === 'fulfilled' && bidsRes.value.success
                            ? (Array.isArray(bidsRes.value.data) ? bidsRes.value.data : (bidsRes.value.data?.items || []))
                            : []
                        const sortedBids = [...rawBids].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                        const mappedBids = sortedBids.map(mapBid)

                        const rawDocs = docsRes.status === 'fulfilled' && docsRes.value.success
                            ? (Array.isArray(docsRes.value.data) ? docsRes.value.data : (docsRes.value.data?.items || []))
                            : []
                        // Use fetched docs if available, otherwise keep the inline docs from the case response
                        const mappedDocs = rawDocs.length > 0 ? rawDocs.map(mapDocument) : prev.documents

                        const settlementData = settlementRes.status === 'fulfilled' && settlementRes.value.success
                            ? mapSettlement(settlementRes.value.data)
                            : prev.settlement

                        const highestBid = mappedBids.length > 0 ? mappedBids[0].amount : null

                        const auctionList = auctionRes.status === 'fulfilled' && auctionRes.value.success
                            ? (Array.isArray(auctionRes.value.data) ? auctionRes.value.data : [])
                            : []
                        const latestAuction = auctionList[0] || null
                        const auctionStart = latestAuction?.actual_start || latestAuction?.scheduled_start || null
                        const auctionEnd = latestAuction?.scheduled_end || null

                        return {
                            ...prev,
                            bids: mappedBids,
                            documents: mappedDocs,
                            settlement: settlementData,
                            financial: { ...prev.financial, currentHighestBid: highestBid },
                            auctionStart,
                            auctionEnd,
                            auctionStatus: latestAuction?.status || null,
                        }
                    })
                } else {
                    setCaseData(null)
                }
            })
            .catch(() => setCaseData(null))
            .finally(() => setLoading(false))
    }, [caseId])

    const updateCase = (updates) => {
        setCaseData(prev => ({ ...prev, ...updates }))
    }

    return (
        <CaseContext.Provider value={{ caseData, loading, setLoading, updateCase }}>
            {children}
        </CaseContext.Provider>
    )
}

export const useCaseContext = () => {
    const context = useContext(CaseContext)
    if (!context) {
        throw new Error('useCaseContext must be used within a CaseProvider')
    }
    return context
}
