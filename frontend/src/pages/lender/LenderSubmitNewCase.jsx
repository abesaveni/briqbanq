import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesService, activityService } from '../../api/dataService';
import { useNotifications } from '../../context/NotificationContext';
import { toast } from 'react-toastify';
import {
    Shield, ChevronLeft, ChevronRight, Check, Info,
    Search, MapPin, Lock, FileCheck, DollarSign, Clock,
    CheckCircle, AlertTriangle, Activity, User, Building2,
    Users, Mail, Phone, Calendar, Briefcase, Plus, Zap, CreditCard, Trash2,
    Upload, ArrowUpRight, FileText, Box, ChevronDown, ChevronUp, ExternalLink, Flag, Download, RefreshCw
} from "lucide-react";

export default function LenderSubmitNewCase() {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [uploadedDocs, setUploadedDocs] = useState(new Set());

    // Unified Form State for all steps
    const [formData, setFormData] = useState({
        // Top Level Flow & Compliance
        securityType: 'Registered Mortgage (Real Property)',
        entityType: 'Personal',
        creditConsent: false,
        paymentAuthorized: false,
        mortgageRegistered: false,
        ppsaCompliance: false,
        nccpSubject: false,

        // Property Step
        propertyAddress: '',
        suburb: '',
        state: 'NSW',
        postcode: '',
        propertyType: 'House',
        intendedLoanAmount: '',
        securityType: 'Registered Mortgage (Real Property)',
        mortgageRegistered: false,
        ppsaCompliance: false,

        // Entity Step dynamic lists
        directors: [],
        shareholders: [],
        trustees: [],
        guarantors: [],
        companyName: '',
        acn: '',
        abn: '',
        companyType: '',
        trustName: '',
        trustType: '',
        trustAbn: '',
        trustDate: '',
        firstName: '',
        lastName: '',
        dob: '',
        personalPhone: '',
        personalEmail: '',
        residentialAddress: '',
        postalAddress: '',
        occupation: '',
        employer: '',
        employmentStatus: '',
        annualIncome: '',
        tfn: '',

        // Lender Step
        lenderName: '',
        primaryContact: '',
        lenderEmail: '',
        lenderPhone: '',
        loanAccountNumber: '',

        // Loan Step
        outstandingDebt: '',
        originalLoanAmount: '',
        loanStartDate: '',
        interestRate: '5.5',
        repaymentType: 'Principal & Interest',
        missedPayments: '',
        totalArrears: '',
        defaultNoticeDate: '',
        valuationAmount: '',
        valuationDate: '',
        valuationProvider: '',
        nccpSubject: false,

        // Features
        yearBuilt: '',
        floorArea: '',
        condition: 'Good',

        // Review/Compliance
        defaultReason: '',
        hardshipCircumstances: '',
        borrowerCooperation: 'Yes - Fully Cooperative',
        possessionStatus: 'Owner Occupied',
        urgency: 'Medium - Priority processing (14-30 days)',
        additionalNotes: '',

        // Disclosure Step
        licenceType: 'ACL Holder (Australian Credit Licence)',
        disclosureAgreement: {
            "Credit Guide (NCCP s126) *": false,
            "Quote / Fee Disclosure (NCCP s17) *": false,
            "Credit Proposal Disclosure (if broker involved)": false,
            "Credit Contract with Full Terms (NCCP s17) *": false,
            "Key Facts Sheet (for home loans) *": false,
            "All Fees, Interest & Comparison Rate Disclosed *": false
        },
        disclosedInterestRate: '6.50',
        disclosedComparisonRate: '6.75',
    });

    const updateFormData = (e) => {
        let { name, value, type, checked } = e.target;

        // Numeric-only (integers)
        const intFields = ['missedPayments', 'numberOfStoreys', 'loanAccountNumber'];
        if (intFields.includes(name)) value = value.replace(/[^0-9]/g, '');

        // Numeric-only (currency amounts — allow decimals)
        const currencyFields = ['outstandingDebt', 'originalLoanAmount', 'totalArrears',
            'valuationAmount', 'annualIncome', 'floorArea', 'bankAccountNumber'];
        if (currencyFields.includes(name)) value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

        // Decimal rate fields
        const rateFields = ['interestRate', 'comparisonRate', 'disclosedInterestRate', 'disclosedComparisonRate'];
        if (rateFields.includes(name)) value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

        // Intended loan amount (decimal allowed)
        if (name === 'intendedLoanAmount') value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

        // Postcode — digits only, max 4
        if (name === 'postcode' || name === 'billingPostcode') {
            value = value.replace(/[^0-9]/g, '').slice(0, 4);
        }

        // Year built — digits only, max 4
        if (name === 'yearBuilt') value = value.replace(/[^0-9]/g, '').slice(0, 4);

        // Phone fields — digits, spaces, +, -, (, ) only; max 15 chars
        const phoneFields = ['personalPhone', 'lenderPhone', 'borrowersLawyerPhone',
            'lendersLawyerPhone', 'realEstateAgentPhone', 'valuatorPhone'];
        if (phoneFields.includes(name)) value = value.replace(/[^0-9\s+\-()/]/g, '').slice(0, 15);

        // Name-only fields (letters, spaces, hyphens, apostrophes)
        const nameFields = ['borrowersLawyerName', 'lendersLawyerName', 'realEstateAgentName'];
        if (nameFields.includes(name)) value = value.replace(/[^a-zA-Z\s\-']/g, '');

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Helper for updating nested/array data
    const setFormValue = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Total 11 steps as per screenshot
    const steps = [
        { id: 1, label: 'Property' },
        { id: 2, label: 'Entity' },
        { id: 3, label: 'Payment' },
        { id: 4, label: 'Lender' },
        { id: 5, label: 'Loan' },
        { id: 6, label: 'Features' },
        { id: 7, label: 'Parties' },
        { id: 8, label: 'NCCP*', sub: 'NCCP does not apply' },
        { id: 9, label: 'Disclosure' },
        { id: 10, label: 'Review' },
        { id: 11, label: 'Submit' }
    ];

    const canContinue = () => {
        // Step 1: Property
        if (currentStep === 1) {
            const hasBasicInfo = formData.propertyAddress && formData.suburb && formData.postcode && formData.intendedLoanAmount;
            if (!hasBasicInfo) return false;
            if (formData.securityType === 'Registered Mortgage (Real Property)' && !formData.mortgageRegistered) return false;
            if (!formData.ppsaCompliance) return false;
        }

        // Step 2: Entity
        if (currentStep === 2) {
            if (!formData.creditConsent) return false;
            if (formData.entityType === 'Personal') {
                return !!(formData.firstName && formData.lastName && formData.dob && formData.personalPhone && formData.personalEmail && formData.residentialAddress);
            }
            if (formData.entityType === 'Company') {
                return !!(formData.companyName && formData.acn && (formData.directors || []).length > 0);
            }
            if (formData.entityType === 'Trust') {
                return !!(formData.trustName && (formData.trustees || []).length > 0);
            }
        }

        // Step 3: Payment
        if (currentStep === 3) {
            if (!formData.paymentAuthorized || !formData.paymentMethod) return false;
            if (formData.paymentMethod === 'Credit Card') {
                return !!(formData.cardholderName && formData.cardNumber && formData.expiryDate && formData.cvv);
            }
            if (formData.paymentMethod === 'Bank Transfer (Osko)') {
                return !!(formData.bankAccountName && formData.bankBsb && formData.bankAccountNumber);
            }
            return false;
        }

        // Step 9: Disclosure
        if (currentStep === 9) {
            return Object.entries(formData.disclosureAgreement || {}).filter(([k, v]) => k.includes('*')).every(([k, v]) => v);
        }

        // Step 10: Review
        if (currentStep === 10 && (formData.defaultReason || '').trim().length === 0) return false;

        return true;
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <PropertyDetailsStep
                        formData={formData}
                        updateFormData={updateFormData}
                        setFormValue={setFormValue}
                    />
                );
            case 2:
                return <EntityStep formData={formData} updateFormData={updateFormData} setFormValue={setFormValue} />;
            case 3:
                return <PaymentStep formData={formData} updateFormData={updateFormData} setFormValue={setFormValue} />;
            case 4:
                return <LenderDetailsStep formData={formData} updateFormData={updateFormData} />;
            case 5:
                return <LoanDetailsStep formData={formData} updateFormData={updateFormData} setFormValue={setFormValue} />;
            case 6:
                return <PropertyFeaturesStep formData={formData} updateFormData={updateFormData} />;
            case 7:
                return <PartiesStep formData={formData} updateFormData={updateFormData} />;
            case 8:
                return (
                    <div className="py-32 text-center bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <Zap size={40} className="text-blue-500" />
                        </div>
                        <div className="space-y-2 max-w-md mx-auto">
                            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">Step Skipped</h3>
                            <p className="text-[14px] font-medium text-slate-400 leading-relaxed">NCCP Assessment is not required as you indicated this loan is not subject to NCCP regulation in Step 5.</p>
                        </div>
                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(9)}
                                className="h-14 px-10 bg-blue-600 text-white rounded-2xl font-semibold text-[14px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                            >
                                Continue to Disclosure
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                );
            case 9:
                return <DisclosureStep formData={formData} updateFormData={updateFormData} />;
            case 10:
                return <ReviewStep formData={formData} updateFormData={updateFormData} />;
            case 11:
                return <SubmitStep formData={formData} setCurrentStep={setCurrentStep} />;
            default:
                return (
                    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-blue-600" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-800">Step {currentStep}: {steps[currentStep - 1].label}</h3>
                        <p className="text-slate-500 mt-2">Content for this step will be implemented based on requirements.</p>
                    </div>
                );
        }
    };

    const handleNext = async (e) => {
        e.preventDefault(); // Prevent normal form submission

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Final submit
            setIsSubmitting(true);
            try {
                const payload = {
                    // Core case fields (mapped to backend schema)
                    title: `${formData.propertyAddress?.split(',')[0] || 'MIP Case'} – ${formData.suburb || ''} ${formData.state || ''}`.trim(),
                    property_address: formData.propertyAddress,
                    suburb: formData.suburb,
                    state: formData.state,
                    postcode: formData.postcode,
                    property_type: formData.propertyType,
                    intended_loan_amount: parseFloat(formData.intendedLoanAmount) || 0,
                    outstanding_debt: parseFloat(formData.outstandingDebt) || 0,
                    original_loan_amount: parseFloat(formData.originalLoanAmount) || 0,
                    estimated_value: parseFloat(formData.valuationAmount) || 0,
                    interest_rate: parseFloat(formData.interestRate) || 0,
                    missed_payments: parseInt(formData.missedPayments) || 0,
                    total_arrears: parseFloat(formData.totalArrears) || 0,
                    loan_start_date: formData.loanStartDate || null,
                    default_notice_date: formData.defaultNoticeDate || null,
                    valuation_date: formData.valuationDate || null,
                    valuation_provider: formData.valuationProvider || null,
                    repayment_type: formData.repaymentType,
                    lender_name: formData.lenderName,
                    lender_phone: formData.lenderPhone,
                    lender_email: formData.lenderEmail,
                    loan_account_number: formData.loanAccountNumber,
                    // Entity
                    entity_type: formData.entityType,
                    borrower_name: formData.entityType === 'Personal'
                        ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
                        : (formData.companyName || formData.trustName || ''),
                    borrower_email: formData.personalEmail || '',
                    borrower_phone: formData.personalPhone || '',
                    // Review
                    default_reason: formData.defaultReason,
                    hardship_circumstances: formData.hardshipCircumstances,
                    borrower_cooperation: formData.borrowerCooperation,
                    possession_status: formData.possessionStatus,
                    urgency: formData.urgency,
                    additional_notes: formData.additionalNotes,
                    // Metadata (extras stored as JSON)
                    metadata_json: {
                        year_built: formData.yearBuilt,
                        floor_area: formData.floorArea,
                        condition: formData.condition,
                        renovation_notes: formData.renovations,
                        special_features: formData.specialFeatures,
                        bedrooms: formData.numberOfBedrooms,
                        bathrooms: formData.numberOfBathrooms,
                        parking: formData.numberOfParking,
                        storeys: formData.numberOfStoreys,
                        construction_type: formData.constructionType,
                        roof_type: formData.roofType,
                        nccp_subject: formData.nccpSubject,
                        licence_type: formData.licenceType,
                        borrowers_lawyer: {
                            name: formData.borrowersLawyerName,
                            firm: formData.borrowersLawyerFirm,
                            email: formData.borrowersLawyerEmail,
                            phone: formData.borrowersLawyerPhone,
                            license: formData.borrowersLawyerLicense,
                        },
                        lenders_lawyer: {
                            name: formData.lendersLawyerName,
                            firm: formData.lendersLawyerFirm,
                            email: formData.lendersLawyerEmail,
                            phone: formData.lendersLawyerPhone,
                        },
                    },
                    case_id_prefix: 'MIP',
                };
                const res = await casesService.createCase(payload);

                if (res.success) {
                    const caseId = res.data?.case_number || res.data?.id || res.caseId || 'NEW';

                    // Log activity
                    await activityService.logActivity({
                        title: `New MIP Case Created: ${caseId}`,
                        details: `${formData.propertyAddress}, ${formData.suburb}`,
                        type: "status"
                    });

                    // Add Notification
                    addNotification({
                        type: 'contract',
                        title: 'New Case Created',
                        message: `Success! Case ${caseId} for ${formData.propertyAddress} has been created and is now pending review.`,
                    });

                    navigate('/lender'); // go back to dash
                } else {
                    addNotification({ type: 'error', title: 'Submission Failed', message: res.error || 'Failed to submit case. Please check your details and try again.' });
                }
            } catch (err) {
                console.error("Failed to submit case", err);
                addNotification({ type: 'error', title: 'Submission Failed', message: 'Failed to submit new case. Please check your details and try again.' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in pt-6">
            {/* Page Header */}
            <div className="mb-6 px-1">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Submit New Case</h1>
                <p className="text-slate-500 text-[11px] font-medium uppercase tracking-[0.2em]">Manage defaulted loans and auctions</p>
            </div>

            {/* Development Mode Active Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm shadow-blue-50">
                <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-sm shrink-0">
                    <Shield size={22} className="text-blue-600" />
                </div>
                <div>
                    <h4 className="text-[12px] font-semibold text-blue-900 uppercase tracking-widest">Development/Demo Mode Active</h4>
                    <p className="text-[11px] font-medium text-blue-700/70 mt-1 leading-relaxed max-w-4xl">
                        Professional liability declarations are pre-accepted in this demo environment to allow testing and exploration. In production, users must complete the full Professional Declarations page before creating cases.
                    </p>
                </div>
            </div>

            {/* Main Form Title & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-1">
                <div className="space-y-1">
                    <h2 className="text-3xl font-semibold text-slate-900 tracking-tighter">Submit New MIP Case</h2>
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Activity size={14} strokeWidth={3} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-90">Powered by InfoTrack - Complete property & identity verification</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/lender/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                >
                    <ChevronLeft size={14} strokeWidth={3} />
                    Back to Cases
                </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mb-12 overflow-x-auto no-scrollbar pb-4 px-2">
                <div className="flex items-start justify-between min-w-[1000px] relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-10 mx-10" />
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-3 flex-1 relative">
                            {/* Step Connector Line (Blue if complete) */}
                            {step.id < currentStep && (
                                <div className="absolute top-4 left-[50%] w-full h-0.5 bg-indigo-600 -z-10" />
                            )}

                            {/* Circle */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs transition-all duration-300 border-2 shadow-sm ${currentStep === step.id
                                ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100 scale-110'
                                : currentStep > step.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-400'
                                }`}>
                                {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
                            </div>

                            {/* Label */}
                            <div className="text-center">
                                <p className={`text-[10px] font-semibold uppercase tracking-widest ${currentStep === step.id ? 'text-slate-900' : 'text-gray-400'
                                    }`}>{step.label}</p>
                                {step.id === 8 && (
                                    <p className="text-[9px] font-medium text-gray-400 mt-1">* Step skipped (NCCP does not apply to this loan)</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleNext}>
                {/* Step Content */}
                <div className="mb-10">
                    {renderStepContent()}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8 p-4 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                        disabled={currentStep === 1 || isSubmitting}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95 ${currentStep === 1
                            ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50 shadow-sm'
                            }`}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Step {currentStep} of {steps.length}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !canContinue()}
                        className="flex items-center gap-2 px-8 py-2.5 bg-blue-900 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-800 transition-all shadow-md shadow-blue-900/10 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : currentStep === steps.length ? 'Submit Case' : 'Next'}
                        {!isSubmitting && currentStep !== steps.length && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </form>
        </div>
    );
}

function EntityStep({ formData, updateFormData, setFormValue }) {
    const handleEntityTypeChange = (type) => {
        setFormValue('entityType', type);
    };

    const addItem = (listName, defaultObj) => {
        const list = formData[listName] || [];
        setFormValue(listName, [...list, { ...defaultObj, id: Date.now() }]);
    };

    const removeItem = (listName, id) => {
        const list = formData[listName] || [];
        setFormValue(listName, list.filter(item => item.id !== id));
    };

    const updateItem = (listName, id, field, value) => {
        const list = formData[listName] || [];
        setFormValue(listName, list.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Borrower Details & Entity Structure</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Define the borrowing entity and all related parties</p>
                </div>
            </div>

            {/* Borrowing Entity Type Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="bg-blue-50/50 border-b border-gray-100 px-10 py-5 flex items-center gap-3">
                    <Building2 size={20} className="text-blue-600" />
                    <h4 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Borrowing Entity Type</h4>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-[13px] font-medium text-gray-400">Select the type of entity borrowing the funds</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { id: 'Personal', label: 'Personal', sub: 'Individual borrower', icon: <User size={24} />, color: 'blue' },
                            { id: 'Company', label: 'Company', sub: 'Corporate entity', icon: <Building2 size={24} />, color: 'purple' },
                            { id: 'Trust', label: 'Trust', sub: 'Trust structure', icon: <Shield size={24} />, color: 'orange' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => handleEntityTypeChange(type.id)}
                                className={`p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group ${formData.entityType === type.id
                                    ? type.color === 'blue' ? 'bg-blue-50/50 border-blue-600 shadow-lg shadow-blue-100' :
                                        type.color === 'purple' ? 'bg-purple-50/50 border-purple-600 shadow-lg shadow-purple-100' :
                                            'bg-orange-50/50 border-orange-400 shadow-lg shadow-orange-100'
                                    : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50/50'
                                    }`}
                            >
                                <div className={`transition-transform duration-300 group-hover:scale-110 ${formData.entityType === type.id
                                    ? type.color === 'blue' ? 'text-blue-600' : type.color === 'purple' ? 'text-purple-600' : 'text-orange-500'
                                    : 'text-gray-400'}`}>
                                    {type.icon}
                                </div>
                                <div className="text-center">
                                    <p className={`text-[15px] font-semibold ${formData.entityType === type.id ? 'text-slate-900' : 'text-gray-600'}`}>{type.label}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-tight">{type.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {formData.entityType === 'Personal' ? (
                /* Personal Details Section */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden animate-scale-in">
                    <div className="bg-blue-50/50 border-b border-gray-100 px-10 py-5 flex items-center gap-3">
                        <User size={20} className="text-blue-600" />
                        <h4 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Personal Details</h4>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName || ''} onChange={updateFormData} placeholder="John" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName || ''} onChange={updateFormData} placeholder="Smith" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Date of Birth *</label>
                                <input required type="date" name="dob" value={formData.dob || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone Number *</label>
                                <input required type="text" name="personalPhone" value={formData.personalPhone || ''} onChange={updateFormData} placeholder="0400 000 000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email Address *</label>
                                <input required type="email" name="personalEmail" value={formData.personalEmail || ''} onChange={updateFormData} placeholder="john.smith@example.com" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Residential Address *</label>
                                <input required type="text" name="residentialAddress" value={formData.residentialAddress || ''} onChange={updateFormData} placeholder="456 Residential Street, Sydney NSW 2000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Postal Address (if different)</label>
                                <input required type="text" name="postalAddress" value={formData.postalAddress || ''} onChange={updateFormData} placeholder="PO Box 123, Sydney NSW 2000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Occupation *</label>
                                <input required type="text" name="occupation" value={formData.occupation || ''} onChange={updateFormData} placeholder="Software Engineer" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Employer</label>
                                <input required type="text" name="employer" value={formData.employer || ''} onChange={updateFormData} placeholder="ABC Company" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Employment Status</label>
                                <select required name="employmentStatus" value={formData.employmentStatus || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all appearance-none cursor-pointer">
                                    <option value="">Select status</option>
                                    <option>Full Time</option>
                                    <option>Part Time</option>
                                    <option>Contract</option>
                                    <option>Self Employed</option>
                                    <option>Casual</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Annual Income (A$)</label>
                                <input required type="text" name="annualIncome" value={formData.annualIncome || ''} onChange={updateFormData} placeholder="75000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : formData.entityType === 'Company' ? (
                /* Company Specific Flow */
                <div className="space-y-5 animate-scale-in">
                    {/* Company Details Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <div className="bg-violet-50/50 border-b border-gray-100 px-10 py-5 flex items-center gap-3">
                            <Building2 size={20} className="text-purple-600" />
                            <h4 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Company Details</h4>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Company Name *</label>
                                    <input required type="text" name="companyName" value={formData.companyName || ''} onChange={updateFormData} placeholder="ABC Pty Ltd" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">ACN *</label>
                                    <input required type="text" name="acn" value={formData.acn || ''} onChange={updateFormData} placeholder="123 456 789" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">ABN</label>
                                    <input required type="text" name="abn" value={formData.abn || ''} onChange={updateFormData} placeholder="12 345 678 901" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Company Type</label>
                                    <select required name="companyType" value={formData.companyType || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all appearance-none cursor-pointer">
                                        <option value="">Select type</option>
                                        <option>Proprietary (Pty Ltd)</option>
                                        <option>Public Company</option>
                                        <option>Foreign Company</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Registration Date</label>
                                    <input required type="date" name="registrationDate" value={formData.registrationDate || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Directors Section */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-blue-100">
                                    <User size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">Directors ({formData.directors?.length || 0})</h4>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">All directors must be verified</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => addItem('directors', { name: '', position: 'Director', dob: '', email: '', phone: '' })}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
                            >
                                <Plus size={16} />
                                Add Director
                            </button>
                        </div>

                        {formData.directors?.length > 0 ? (
                            <div className="space-y-4">
                                {formData.directors.map((item) => (
                                    <div key={item.id} className="bg-white border border-blue-100 rounded-3xl p-8 shadow-sm relative group animate-scale-in">
                                        <button type="button" onClick={() => removeItem('directors', item.id)} className="absolute top-6 right-6 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Full Name *</label>
                                                <input required type="text" value={item.name} onChange={(e) => updateItem('directors', item.id, 'name', e.target.value)} placeholder="Full legal name" className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date of Birth *</label>
                                                <input required type="date" value={item.dob} onChange={(e) => updateItem('directors', item.id, 'dob', e.target.value)} className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/50 border border-blue-50 rounded-2xl py-10 text-center">
                                <p className="text-[12px] font-medium text-gray-400">No directors added yet. Click "Add Director" to begin.</p>
                            </div>
                        )}
                    </div>
                    {/* Shareholders Section */}
                    <div className="bg-teal-50 border border-emerald-100 rounded-[2rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-emerald-100">
                                    <Users size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="text-[17px] font-bold text-slate-900 tracking-tight">Shareholders ({formData.shareholders?.length || 0})</h4>
                                    <p className="text-[12px] font-medium text-gray-500 mt-0.5">AML/CTF Beneficial Ownership (25%+ holds)</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => addItem('shareholders', { name: '', ownership: '' })}
                                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-[13px] hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-95"
                            >
                                <Plus size={18} /> Add Shareholder
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.shareholders?.length > 0 ? (
                                formData.shareholders.map((item) => (
                                    <div key={item.id} className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm relative group animate-scale-in">
                                        <button type="button" onClick={() => removeItem('shareholders', item.id)} className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Name / Entity *</label>
                                                <input required type="text" value={item.name} onChange={(e) => updateItem('shareholders', item.id, 'name', e.target.value)} placeholder="Full name or Corporate name" className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ownership % *</label>
                                                <input required type="text" value={item.ownership} onChange={(e) => updateItem('shareholders', item.id, 'ownership', e.target.value)} placeholder="e.g. 50" className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white/50 border border-emerald-50 rounded-2xl py-10 text-center">
                                    <p className="text-[12px] font-medium text-gray-400">No shareholders added yet. Click "Add Shareholder" to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : formData.entityType === 'Trust' ? (
                /* Trust Specific Flow */
                <div className="space-y-5 animate-scale-in">
                    {/* Trust Details Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <div className="bg-amber-50/50 border-b border-gray-100 px-10 py-5 flex items-center gap-3">
                            <Shield size={20} className="text-orange-500" />
                            <h4 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Trust Details</h4>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Trust Name *</label>
                                    <input required type="text" name="trustName" value={formData.trustName || ''} onChange={updateFormData} placeholder="Smith Family Trust" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Trust Type</label>
                                    <select required name="trustType" value={formData.trustType || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer">
                                        <option value="">Select type</option>
                                        <option>Family Trust</option>
                                        <option>Unit Trust</option>
                                        <option>Discretionary Trust</option>
                                        <option>SMSF Trust</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">ABN (if registered)</label>
                                    <input required type="text" name="trustAbn" value={formData.trustAbn || ''} onChange={updateFormData} placeholder="12 345 678 901" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Establishment Date</label>
                                    <input required type="date" name="trustDate" value={formData.trustDate || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trustees Section */}
                    <div className="bg-violet-50 border border-purple-100 rounded-2xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-purple-100">
                                    <Shield size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">Trustees (0)</h4>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">All trustees must be verified (can be individuals or companies)</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => addItem('trustees', { name: '', type: 'Individual Trustee' })}
                                className="bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-widest hover:bg-violet-600 transition-all flex items-center gap-2 shadow-lg shadow-purple-900/10 active:scale-95"
                            >
                                <Plus size={16} /> Add Trustee
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.trustees?.length > 0 ? (
                                formData.trustees.map((item) => (
                                    <div key={item.id} className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm relative group animate-scale-in">
                                        <button type="button" onClick={() => removeItem('trustees', item.id)} className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trustee Type</label>
                                                <select value={item.type} onChange={(e) => updateItem('trustees', item.id, 'type', e.target.value)} className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-purple-50 transition-all cursor-pointer">
                                                    <option>Individual Trustee</option>
                                                    <option>Corporate Trustee</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Full Name / Entity *</label>
                                                <input required type="text" value={item.name} onChange={(e) => updateItem('trustees', item.id, 'name', e.target.value)} placeholder="Full name or Corporate name" className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white/50 border border-purple-50 rounded-2xl py-10 text-center">
                                    <p className="text-[12px] font-medium text-gray-400">No trustees added yet. Click "Add Trustee" to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Guarantors Section - Common for all types */}
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-teal-100">
                            <Users size={20} className="text-teal-600" />
                        </div>
                        <div>
                            <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">Guarantors (0)</h4>
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">Add any guarantors (optional - can be individuals or companies)</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => addItem('guarantors', { name: '', type: 'Individual' })}
                        className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-95"
                    >
                        <Plus size={16} /> Add Guarantor
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.guarantors?.length > 0 ? (
                        formData.guarantors.map((item) => (
                            <div key={item.id} className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm relative group animate-scale-in">
                                <button type="button" onClick={() => removeItem('guarantors', item.id)} className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={18} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</label>
                                        <select value={item.type} onChange={(e) => updateItem('guarantors', item.id, 'type', e.target.value)} className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-teal-100 transition-all cursor-pointer">
                                            <option>Individual</option>
                                            <option>Company</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Name *</label>
                                        <input required type="text" value={item.name} onChange={(e) => updateItem('guarantors', item.id, 'name', e.target.value)} placeholder="Full legal name" className="w-full h-12 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/50 border border-teal-50 rounded-2xl py-10 text-center">
                            <p className="text-[12px] font-medium text-gray-400">No guarantors added. Click "Add Guarantor" if required.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Credit Check Requirements Section */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-rose-100">
                        <Shield size={24} className="text-rose-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Credit Check Requirements (NCCP & Privacy Act)</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">National Consumer Credit Protection Act 2009 & Privacy Act 1988 - Obtain explicit consent before accessing credit information</p>
                    </div>
                </div>

                {/* Red Mandatory Warning */}
                <div className="bg-white border-l-4 border-rose-500 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-rose-50 rounded-lg shrink-0">
                        <AlertTriangle size={20} className="text-rose-600" />
                    </div>
                    <div>
                        <h5 className="text-[11px] font-semibold text-rose-900 uppercase tracking-tight">MANDATORY PRIVACY ACT COMPLIANCE</h5>
                        <p className="text-[12px] font-medium text-rose-800/80 mt-1 leading-relaxed">
                            Under the Privacy Act 1988 (Australian Privacy Principles) and Credit Reporting Code, you MUST obtain explicit written consent from the borrower before accessing their credit report from any credit reporting body (CRB). Failure to obtain consent is a breach of the Privacy Act and may result in penalties.
                        </p>
                        {(formData.entityType === 'Company' || formData.entityType === 'Trust') && (
                            <p className="text-[12px] font-semibold text-rose-600 mt-2 italic">
                                Credit checks cannot be run until all consents below are confirmed.
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <label className={`flex items-start gap-5 p-8 rounded-3xl border-2 transition-all cursor-pointer ${formData.creditConsent ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-50' : 'bg-white border-rose-200 shadow-sm'}`}>
                        <div className="mt-1 relative">
                            <input required
                                type="checkbox"
                                name="creditConsent"
                                checked={formData.creditConsent || false}
                                onChange={(e) => updateFormData({ target: { name: 'creditConsent', value: e.target.checked } })}
                                className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                            />
                            <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${formData.creditConsent ? 'bg-emerald-600 border-emerald-600' : 'border-rose-300'}`}>
                                <Check size={16} className={`text-white transition-opacity ${formData.creditConsent ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[13px] font-semibold text-slate-900 uppercase tracking-wider">Credit Check Consent Obtained from Borrower *</p>
                            <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                                I confirm that I have obtained explicit, informed, written consent from the borrower to:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    'Access their credit report from a credit reporting body (CRB)',
                                    'Use credit information for the purpose of assessing this credit application',
                                    'Disclose credit information to credit providers and other permitted parties',
                                    'Understand that the credit check will be recorded on their credit file'
                                ].map((bullet, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-rose-700/80">
                                        <div className="w-1 h-1 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[10px] font-semibold text-rose-600/60 uppercase italic tracking-widest pt-2">
                                Privacy Act 1988 s21 & Australian Privacy Principles (APP) 3.3 & 6.1
                            </p>
                        </div>
                    </label>

                    {!formData.creditConsent && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center space-y-3 animate-pulse shadow-sm">
                            <AlertTriangle size={32} className="text-amber-500 mx-auto" />
                            <h5 className="text-[13px] font-semibold text-amber-900 uppercase tracking-widest">Credit Check Consent Required</h5>
                            <p className="text-[11px] font-medium text-amber-700">You must tick the consent checkbox above and complete all required fields before credit checks can be initiated in Step 11.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

function PaymentStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Payment & Automated Verification</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Complete payment - all searches will run automatically</p>
                </div>
            </div>

            {/* Automated Verification Package */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="bg-indigo-600 px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={20} className="text-white fill-white" />
                            <h4 className="text-xl font-semibold tracking-tight">Automated Verification Package</h4>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium opacity-90">Complete property valuation, InfoTrack checks & KYC screening</p>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-widest mb-1">Total Cost</p>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-4xl font-semibold">$186.00</span>
                        </div>
                        <p className="text-indigo-200 text-[10px] font-medium">inc. GST</p>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h5 className="text-[14px] font-semibold text-slate-900 mb-4">Package Includes:</h5>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { name: 'RP Data AVM Valuation', price: '$45.00', icon: <MapPin size={18} /> },
                                { name: 'InfoTrack Title Search', price: '$28.50', icon: <FileCheck size={18} /> },
                                { name: 'InfoTrack Ownership Verification', price: '$22.00', icon: <Shield size={18} /> },
                                { name: 'InfoTrack Encumbrances Check', price: '$25.00', icon: <Search size={18} /> },
                                { name: 'InfoTrack Zoning Certificate', price: '$35.00', icon: <Building2 size={18} /> },
                                { name: 'GreenID Identity Verification', price: '$12.50', icon: <User size={18} /> },
                                { name: 'AUSTRAC Sanctions Screening', price: '$8.00', icon: <Shield size={18} /> },
                                { name: 'PEP & RCA Screening', price: '$10.00', icon: <Shield size={18} /> }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-2xl transition-all group cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <span className="text-[13px] font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] font-semibold text-slate-900">{item.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lavendar Processing Box */}
                    <div className="bg-violet-50 rounded-3xl p-8 space-y-5 border border-purple-100">
                        <div className="flex items-center gap-2">
                            <Zap size={18} className="text-purple-600 fill-purple-600" />
                            <h6 className="text-[13px] font-semibold text-indigo-950 uppercase tracking-widest">Instant Automated Processing:</h6>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                            {[
                                'Complete property AVM valuation from RP Data',
                                'Full title search and ownership verification',
                                'Encumbrances, caveats & zoning checks',
                                'Electronic identity verification (GreenID)',
                                'AUSTRAC sanctions & PEP screening',
                                'All results available in 30-60 seconds',
                                'Automatically attached to Credit Pack'
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-[12px] font-medium text-slate-600">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <button 
                            type="button" 
                            onClick={() => {
                                toast.success("All credit and property checks have been initiated successfully!");
                                setFormValue('checksStatus', 'In Progress');
                            }}
                            className="w-full h-16 bg-indigo-600 text-white rounded-[24px] font-semibold text-[15px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
                        >
                            <Zap size={20} className="fill-white" />
                            Run All Checks Now - $186.00
                        </button>

                        <p className="text-center text-[11px] font-medium text-gray-400 max-w-[500px] mx-auto leading-relaxed">
                            By proceeding, you authorize Brickbanq to charge $186.00 (inc. GST) to your account for automated verification services.
                        </p>
                    </div>

                    {/* Pricing Disclaimer */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                            <Activity size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-tight mb-1">Transparent Pricing:</p>
                            <p className="text-[11px] font-medium text-amber-800/80 leading-relaxed">
                                All costs are billed at actual provider rates with no markup. RP Data AVM is $45, InfoTrack searches $110.5, and KYC checks $30.5.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onboarding & Verification Summary Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/5">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                            <Briefcase size={24} />
                        </div>
                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Onboarding & Verification Costs</h4>
                    </div>

                    <div className="space-y-5">
                        {[
                            { name: 'InfoTrack Property Search', sub: 'Title, ownership, encumbrances, zoning', price: 'A$85.00' },
                            { name: 'InfoTrack KYC/GreenID Verification', sub: 'Identity, sanctions & PEP screening', price: 'A$45.00' },
                            { name: 'Platform Onboarding Fee', sub: 'Case setup and processing', price: 'A$120.00' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between pb-8 border-b border-blue-50 last:border-0 last:pb-0">
                                <div>
                                    <p className="text-[15px] font-semibold text-slate-800">{item.name}</p>
                                    <p className="text-[12px] font-medium text-slate-400 mt-1">{item.sub}</p>
                                </div>
                                <span className="text-[17px] font-semibold text-slate-900">{item.price}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100/50 rounded-2xl p-8 flex items-center justify-between shadow-inner">
                        <span className="text-sm font-semibold text-blue-900 uppercase tracking-[0.2em]">Total Due Today</span>
                        <span className="text-3xl font-semibold text-blue-900">A$250.00</span>
                    </div>
                </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                        <CreditCard size={20} />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Payment Method</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Select Payment Method *</label>
                        <select required name="paymentMethod" value={formData.paymentMethod || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer">
                            <option value="">Select Method</option>
                            <option>Credit Card</option>
                            <option>Bank Transfer (Osko)</option>
                        </select>
                    </div>

                    {formData.paymentMethod === 'Credit Card' && (<>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Cardholder Name *</label>
                        <input type="text" name="cardholderName" value={formData.cardholderName || ''} onChange={updateFormData} placeholder="John Smith" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Card Number *</label>
                        <input type="text" name="cardNumber" value={formData.cardNumber || ''} onChange={updateFormData} placeholder="1234 5678 9012 3456" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Expiry Date (MM/YY) *</label>
                        <input type="text" name="expiryDate" value={formData.expiryDate || ''} onChange={updateFormData} placeholder="12/26" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">CVV *</label>
                        <input type="text" name="cvv" value={formData.cvv || ''} onChange={updateFormData} placeholder="123" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>
                    </>)}

                    {formData.paymentMethod === 'Bank Transfer (Osko)' && (<>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Account Name *</label>
                        <input type="text" name="bankAccountName" value={formData.bankAccountName || ''} onChange={updateFormData} placeholder="John Smith" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">BSB *</label>
                        <input type="text" name="bankBsb" value={formData.bankBsb || ''} onChange={updateFormData} placeholder="000-000" maxLength={7} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Account Number *</label>
                        <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={updateFormData} placeholder="123456789" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Bank Name *</label>
                        <input type="text" name="bankName" value={formData.bankName || ''} onChange={updateFormData} placeholder="e.g. Commonwealth Bank" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>
                    </>)}

                    <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Billing Address</label>
                        <input type="text" name="billingAddress" value={formData.billingAddress || ''} onChange={updateFormData} placeholder="Same as residential address" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Billing Postcode</label>
                        <input type="text" name="billingPostcode" value={formData.billingPostcode || ''} onChange={updateFormData} placeholder="2000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" />
                    </div>
                </div>

                {/* Authorization Checkbox */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
                    <label className="flex items-start gap-5 cursor-pointer group">
                        <div className="mt-1 relative">
                            <input required
                                type="checkbox"
                                name="paymentAuthorized"
                                checked={formData.paymentAuthorized || false}
                                onChange={(e) => updateFormData({ target: { name: 'paymentAuthorized', value: e.target.checked } })}
                                className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                            />
                            <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${formData.paymentAuthorized ? 'bg-indigo-950 border-indigo-950' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                                <Check size={14} className={`text-white transition-opacity ${formData.paymentAuthorized ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[14px] font-semibold text-slate-900 tracking-tight">I authorize the charges outlined above *</p>
                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                I understand that these fees cover InfoTrack verification services and platform onboarding. The charges are non-refundable once the checks have been initiated.
                            </p>
                        </div>
                    </label>
                </div>

                {/* Secure Payment Alert */}
                <div className="bg-green-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <Lock size={18} />
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-emerald-900 tracking-tight uppercase tracking-widest">Secure Payment</p>
                        <p className="text-[11px] font-medium text-emerald-700/70 mt-1 leading-relaxed">All payment information is encrypted and processed securely. We never store your full card details.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReviewStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Title Section */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Review & Submit</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Final details and case review</p>
                </div>
            </div>

            {/* Final Details Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Reason for Default *</label>
                    <textarea
                        required
                        name="defaultReason"
                        value={formData.defaultReason}
                        onChange={updateFormData}
                        placeholder="Provide details about why the borrower has defaulted on loan payments..."
                        className="w-full min-h-[140px] bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all resize-none"
                    ></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Hardship Circumstances</label>
                    <textarea
                        required
                        name="hardshipCircumstances"
                        value={formData.hardshipCircumstances}
                        onChange={updateFormData}
                        placeholder="Job loss, illness, divorce, business failure, etc."
                        className="w-full min-h-[100px] bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all resize-none"
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Borrower Cooperation</label>
                        <select
                            required
                            name="borrowerCooperation"
                            value={formData.borrowerCooperation}
                            onChange={updateFormData}
                            className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
                        >
                            <option>Yes - Fully Cooperative</option>
                            <option>Partial Cooperation</option>
                            <option>No Cooperation / Adverse</option>
                            <option>Unknown</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Current Possession Status</label>
                        <select
                            required
                            name="possessionStatus"
                            value={formData.possessionStatus}
                            onChange={updateFormData}
                            className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
                        >
                            <option>Owner Occupied</option>
                            <option>Investment (Tenanted)</option>
                            <option>Vacant</option>
                            <option>Abandoned</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Additional Notes</label>
                    <textarea
                        required
                        name="additionalNotes"
                        value={formData.additionalNotes}
                        onChange={updateFormData}
                        placeholder="Any additional information that might be relevant..."
                        className="w-full min-h-[100px] bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all resize-none"
                    ></textarea>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Case Urgency</label>
                    <select
                        required
                        name="urgency"
                        value={formData.urgency}
                        onChange={updateFormData}
                        className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-orange-100 transition-all appearance-none cursor-pointer"
                    >
                        <option>Medium - Priority processing (14-30 days)</option>
                        <option>High - Urgent action required (7 days)</option>
                        <option>Critical - Immediate attention required (24-48 hours)</option>
                        <option>Standard - No immediate deadline</option>
                    </select>
                </div>
            </div>

            {/* Assembly Part Moved Here */}
            <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-2xl shadow-purple-900/5 p-6 space-y-5 mt-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Complete Credit Pack Assembly</h3>
                            <p className="text-[14px] font-medium text-purple-600/60 mt-1">All InfoTrack documents and third-party documents assembled with data redaction as per Privacy Act 1988</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-purple-50 rounded-xl flex items-center gap-2 border border-purple-100">
                        <FileText size={16} className="text-purple-600" />
                        <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-widest">Comprehensive</span>
                    </div>
                </div>

                {/* Privacy Warning */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <Shield size={20} />
                        </div>
                        <h4 className="text-[15px] font-semibold text-amber-900 tracking-tight">🔒 Data Redaction & Privacy Compliance</h4>
                    </div>
                    <p className="text-[12px] font-medium text-amber-800/60 leading-relaxed max-w-2xl px-2">
                        All documents in this credit pack will be automatically redacted to comply with:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/80 p-5 rounded-[20px] border border-amber-50">
                            <p className="text-[12px] font-medium text-amber-900">Privacy Act 1988</p>
                            <p className="text-[10px] text-amber-700/60 font-semibold mt-1">Australian Privacy Principles (APPs) - minimum necessary disclosure</p>
                        </div>
                        <div className="bg-white/80 p-5 rounded-[20px] border border-amber-50">
                            <p className="text-[12px] font-medium text-amber-900">OAIC Guidelines</p>
                            <p className="text-[10px] text-amber-700/60 font-semibold mt-1">Office of Australian Information Commissioner data handling standards</p>
                        </div>
                        <div className="bg-white/80 p-5 rounded-[20px] border border-amber-50">
                            <p className="text-[12px] font-medium text-amber-900">AML/CTF Act</p>
                            <p className="text-[10px] text-amber-700/60 font-semibold mt-1">Record keeping obligations with appropriate redaction</p>
                        </div>
                    </div>
                </div>

                {/* Document List: InfoTrack Generated */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Zap size={20} className="text-purple-600" />
                        <h4 className="text-[15px] font-semibold text-slate-800 uppercase tracking-wider">InfoTrack Generated Documents (Auto-Attached)</h4>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: "Title Search Report", desc: "Complete title particulars, lot/plan, registered proprietor", redaction: "None required" },
                            { name: "Ownership Verification Report", desc: "Registered owner details, ownership type, tenure", redaction: "None required" },
                            { name: "Encumbrances & Caveats Report", desc: "Mortgages, caveats, easements, covenants", redaction: "Third-party personal details" },
                            { name: "Zoning & Planning Certificate", desc: "Zoning classification, planning controls, overlays", redaction: "None required" },
                            { name: "Environmental Risk Assessment", desc: "Flood risk, bushfire risk, contamination status", redaction: "None required" },
                            { name: "RP Data AVM Valuation Report", desc: "Automated valuation: Pending (Low: N/A, High: N/A)", redaction: "None required" },
                            { name: "Identity Verification Report (GreenID)", desc: "Electronic identity verification results", redaction: "ID numbers, DOB partially masked" },
                            { name: "Sanctions Screening Report", desc: "DFAT, UN, OFAC sanctions list screening", redaction: "None (results only)" },
                            { name: "PEP & RCA Screening Report", desc: "Politically Exposed Persons & relatives check", redaction: "None (results only)" },
                            { name: "AML/CTF Compliance Summary", desc: "AUSTRAC compliance verification summary", redaction: "Source of funds details" }
                        ].map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-purple-600 shadow-sm transition-colors">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-700">{doc.name}</p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">{doc.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg">
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Pending</span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                        <Lock size={12} className="text-amber-500" />
                                        <span className="text-[10px] font-medium text-purple-600/60 uppercase tracking-widest">{doc.redaction}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Generation Summary */}
                <div className="bg-violet-50 border-2 border-purple-100 rounded-2xl p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                            <Box size={24} />
                        </div>
                        <h4 className="text-[16px] font-semibold text-purple-900 tracking-tight">📦 Complete Credit Pack Ready for Generation</h4>
                    </div>
                    <div className="bg-white border border-purple-100 rounded-2xl p-6">
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                            <span className="font-semibold text-purple-700">Compliance Note:</span> This credit pack meets all requirements under the Privacy Act 1988 while maintaining audit trail integrity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubmitStep({ formData, setCurrentStep }) {
    const propertyType = formData.propertyType || 'House';
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Dashboard Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20 p-8 flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Shield size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Comprehensive Verification Results Dashboard</h3>
                    <p className="text-[14px] font-medium text-slate-400 mt-1">All automated checks complete - Review results for all parties</p>
                </div>
            </div>

            {/* Borrowing Entity Structure Visual */}
            <div className="bg-blue-600 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 flex items-center gap-4 text-white">
                    <Users size={24} />
                    <h4 className="text-[18px] font-semibold tracking-tight">Complete Borrowing Entity Structure</h4>
                </div>
                <div className="bg-blue-50 p-12 relative flex flex-col items-center">
                    <p className="absolute top-4 left-8 text-[12px] font-semibold text-blue-600 uppercase tracking-widest">Visual representation of all parties requiring verification</p>

                    {/* Visual Tree */}
                    <div className="flex flex-col items-center space-y-12 mt-8">
                        {/* Parent: Entity */}
                        <div className="flex flex-col items-center space-y-4">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">BORROWING ENTITY</span>
                            <div className="w-[320px] bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-[24px] shadow-xl relative group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-medium text-white/70 uppercase">{propertyType}</p>
                                            <p className="text-[20px] font-semibold text-white">
                                                {propertyType === 'House' ? 'Individual Borrower' :
                                                    propertyType === 'Company' ? 'Corporate Entity' : 'Property Asset'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
                                        <CheckCircle size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connector */}
                        {propertyType !== 'House' && (
                            <>
                                <div className="w-0.5 h-12 bg-gray-200"></div>

                                {/* Middle: Trustees/Directors */}
                                <div className="flex flex-col items-center space-y-4">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                                        {propertyType === 'Company' ? 'DIRECTORS' : 'TRUSTEES'}
                                    </span>
                                    <div className="w-[480px] bg-amber-50 border-2 border-dashed border-amber-300 rounded-[28px] p-8 flex flex-col items-center text-center space-y-4">
                                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                            <Info size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[16px] font-semibold text-amber-900">
                                                {propertyType === 'Company' ? 'ASIC Search Required' : 'Trust Structure Required'}
                                            </p>
                                            <p className="text-[11px] font-medium text-amber-700/60 max-w-[300px] mt-1">
                                                {propertyType === 'Company' ? 'Please verify directors from ASIC Current Extract' : 'Please add at least one trustee to complete the trust structure'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Connector */}
                        <div className="w-0.5 h-12 bg-gray-200"></div>

                        {/* Bottom: Guarantors */}
                        <div className="flex flex-col items-center space-y-4">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">GUARANTORS</span>
                            <div className="w-[460px] bg-white border-2 border-dashed border-gray-100 rounded-[28px] p-8 flex flex-col items-center text-center space-y-3 group cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-500 transition-all">
                                    <Plus size={24} />
                                </div>
                                <p className="text-[15px] font-semibold text-slate-400 group-hover:text-blue-600 transition-all">No Guarantors Added</p>
                                <p className="text-[11px] font-medium text-gray-300">Add guarantors if required for this borrowing entity</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verifications Banner */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">LEGEND</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'Verified', icon: <CheckCircle className="text-emerald-500" size={16} /> },
                            { label: 'Individual', icon: <User className="text-slate-400" size={16} /> },
                            { label: 'Company', icon: <Building2 className="text-slate-400" size={16} /> },
                            { label: 'Trust', icon: <Shield className="text-slate-400" size={16} /> },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {item.icon}
                                <span className="text-[12px] font-medium text-slate-600">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-green-50 border-2 border-emerald-100 rounded-[28px] p-8 flex items-center gap-8">
                    <div className="w-16 h-16 bg-white border-4 border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                        <CheckCircle size={32} />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500 px-2 py-1 rounded-md">
                                <Check size={14} className="text-white" />
                            </div>
                            <h4 className="text-[18px] font-semibold text-emerald-900 tracking-tight">All Verifications Passed</h4>
                        </div>
                        <p className="text-[13px] font-medium text-emerald-800/60">All third-party verification checks have been completed successfully for all parties. No adverse findings or red flags identified.</p>

                        <div className="flex items-center gap-4">
                            {['Property', 'Title', 'Identity', 'AML/CTF'].map((check) => (
                                <div key={check} className="bg-white border border-emerald-100 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[13px] font-semibold text-slate-700">{check}</span>
                                    <Check size={14} className="text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Verification Cards Stack */}
                <div className="space-y-6">
                    {/* 1. Property Valuation */}
                    <div className="bg-slate-50 border border-blue-100 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-blue-50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                    <MapPin size={22} />
                                </div>
                                <h4 className="text-[17px] font-semibold text-slate-800">1. Property Valuation (RP Data AVM)</h4>
                                <p className="text-[11px] font-medium text-slate-400">CoreLogic RP Data Automated Valuation Model</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-green-50 text-green-800 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    HIGH CONFIDENCE
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Property Address</p>
                                <p className="text-[18px] font-semibold text-slate-900">{formData.propertyAddress || '123 Main Street'}</p>
                                <p className="text-[13px] font-medium text-slate-400">{formData.suburb || 'Bondi'}, {formData.state || 'NSW'} {formData.postcode || '2026'}</p>
                            </div>
                            <div className="bg-white border border-blue-50 rounded-[28px] p-8 flex flex-col items-center justify-center shadow-sm">
                                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-[0.2em] mb-2">AVM Estimated Value</p>
                                <p className="text-[42px] font-semibold text-blue-800 leading-none">A${formData.valuationAmount || '850,000'}</p>
                                <p className="text-[12px] font-medium text-slate-400 mt-2">Range: $765,000 - $935,000</p>
                            </div>
                        </div>
                        <div className="px-10 pb-10 grid grid-cols-4 gap-6">
                            {[
                                { label: 'CONFIDENCE LEVEL', value: 'HIGH', color: 'text-emerald-500' },
                                { label: 'COMPARABLE SALES', value: '15 properties' },
                                { label: 'MARKET TREND', value: 'Stable' },
                                { label: 'VALUATION DATE', value: '02/03/2026' },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                    <p className={`text-[14px] font-semibold ${item.color || 'text-slate-800'}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="px-10 pb-10 flex gap-4">
                            <button type="button" className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all">
                                <Upload size={16} className="rotate-180" />
                                Download AVM Report
                            </button>
                            <button type="button" className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all">
                                <ExternalLink size={16} />
                                View Full Details
                            </button>
                        </div>
                    </div>

                    {/* 2. Title Search */}
                    <div className="bg-violet-50 border border-purple-100 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-purple-50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                    <FileText size={22} />
                                </div>
                                <h4 className="text-[17px] font-semibold text-slate-800">2. Title Search (InfoTrack)</h4>
                                <p className="text-[11px] font-medium text-slate-400">NSW Land Registry Services - Full Title Search</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-green-50 text-green-800 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    CLEAR
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="bg-white border border-purple-50 rounded-[28px] p-8 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Title Reference</p>
                                    <p className="text-[15px] font-semibold text-slate-800">LOT 123 DP 456789</p>
                                    <p className="text-[12px] font-medium text-slate-400">Vol/Folio: 12345/678</p>
                                </div>
                            </div>
                            <div className="bg-white border border-purple-50 rounded-[28px] p-8 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Registered Owner</p>
                                    <p className="text-[15px] font-semibold text-slate-800">
                                        {formData.borrowingEntity === 'Individual'
                                            ? `${formData.individualFirstName || 'John'} ${formData.individualLastName || 'Smith'}`
                                            : (formData.companyName || 'John Smith')}
                                    </p>
                                    <p className="text-[12px] font-medium text-slate-400">Ownership: Sole Owner (Torrens Title)</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-10 pb-6 mx-10 bg-green-50 border border-emerald-100 rounded-[28px] p-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} />
                                </div>
                                <h5 className="text-[14px] font-semibold text-emerald-900 uppercase tracking-widest">Clear Title</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3">
                                {[
                                    'No adverse encumbrances detected',
                                    'No caveats registered',
                                    '1 existing mortgage registered (to be discharged)',
                                    'Standard easements for services only',
                                    'No planning restrictions or overlays'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <span className="text-[12px] font-medium text-emerald-800/80">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-10 py-8 grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Zoning</p>
                                <p className="text-[14px] font-semibold text-slate-800">R2 Low Density Residential</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Local Government Area</p>
                                <p className="text-[14px] font-semibold text-slate-800">Waverley Council</p>
                            </div>
                        </div>
                        <div className="px-10 pb-8 flex gap-4">
                            <button 
                                type="button" 
                                onClick={() => toast.info("Downloading Title Search Certificate...")}
                                className="h-12 px-6 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all"
                            >
                                <Upload size={16} className="rotate-180" />
                                Download Title Search Certificate
                            </button>
                        </div>
                    </div>

                    {/* 3. Identity Verification */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-blue-50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                    <User size={22} />
                                </div>
                                <h4 className="text-[17px] font-semibold text-slate-800">3. Borrower - Identity Verification (InfoTrack GreenID)</h4>
                                <p className="text-[11px] font-medium text-slate-400">John Smith • 1985-03-15</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-green-50 text-green-800 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    VERIFIED
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="bg-white border border-blue-50 rounded-[28px] p-8 space-y-4">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Personal Details</p>
                                <div className="space-y-1">
                                    <p className="text-[16px] font-semibold text-slate-800">John Smith</p>
                                    <p className="text-[12px] font-medium text-slate-400">DOB: 15/03/1985</p>
                                    <p className="text-[12px] font-medium text-slate-400">Email: john.smith@email.com</p>
                                    <p className="text-[12px] font-medium text-slate-400">Phone: 0412 345 678</p>
                                </div>
                            </div>
                            <div className="bg-white border border-blue-50 rounded-[28px] p-8 space-y-4">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Verified Documents</p>
                                <div className="space-y-2">
                                    {[
                                        'Driver\'s License NSW - Verified',
                                        'Medicare Card - Verified',
                                        'Bank Account (100 point check) - Verified'
                                    ].map((doc, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check size={14} className="text-emerald-500" />
                                            <span className="text-[12px] font-medium text-slate-700">{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-10 pb-10 mx-10 bg-green-50 border border-emerald-100 rounded-[28px] p-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={14} />
                                </div>
                                <h5 className="text-[14px] font-semibold text-emerald-900 uppercase tracking-widest">Identity Verified - 100 Points Passed</h5>
                            </div>
                            <div className="grid grid-cols-1 gap-y-2">
                                {[
                                    'GreenID score: 100/100 (Strong Match)',
                                    'Government database cross-verification complete',
                                    'Address verification: CONFIRMED',
                                    'Document authenticity: GENUINE',
                                    'Biometric checks: PASSED'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <span className="text-[12px] font-medium text-emerald-800/80">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-10 pb-6 mx-10">
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-sm">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Residential Address (Verified)</p>
                                <p className="text-[14px] font-semibold text-slate-800">456 Residential Street, Sydney NSW 2000</p>
                            </div>
                        </div>
                        <div className="px-10 pb-10 flex justify-center">
                            <button 
                                type="button" 
                                onClick={() => toast.info("Downloading GreenID Verification Report...")}
                                className="h-12 px-8 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Upload size={16} className="rotate-180" />
                                Download GreenID Verification Report
                            </button>
                        </div>
                    </div>

                    {/* 4. Borrower - AML/CTF Screening */}
                    <div className="bg-red-50/30 border border-red-100 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-red-50 flex items-center justify-between bg-white/50">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-50">
                                    <Shield size={22} />
                                </div>
                                <h4 className="text-[17px] font-semibold text-slate-800">4. Borrower - AML/CTF Screening (AUSTRAC Compliance)</h4>
                                <p className="text-[11px] font-medium text-slate-400">Sanctions, PEP, Adverse Media & Watchlist Screening</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    CLEAR
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white border-2 border-emerald-50 rounded-[28px] p-8 space-y-4 shadow-sm">
                                    <h5 className="text-[12px] font-semibold text-emerald-900 uppercase tracking-widest">SANCTIONS SCREENING</h5>
                                    <div className="space-y-2">
                                        {['No matches on DFAT Sanctions List', 'No matches on UN Consolidated List', 'No matches on OFAC SDN List', 'No EU Sanctions matches'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Check size={14} className="text-emerald-500" />
                                                <p className="text-[12px] font-medium text-slate-600">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white border-2 border-emerald-50 rounded-[28px] p-8 space-y-4 shadow-sm">
                                    <h5 className="text-[12px] font-semibold text-emerald-900 uppercase tracking-widest">PEP SCREENING</h5>
                                    <div className="space-y-2">
                                        {['Not identified as PEP', 'No close associates flagged', 'No family members flagged', 'Clear political exposure'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Check size={14} className="text-emerald-500" />
                                                <p className="text-[12px] font-medium text-slate-600">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border-2 border-emerald-100 rounded-[28px] p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                        <Check size={14} />
                                    </div>
                                    <h5 className="text-[14px] font-semibold text-emerald-900 uppercase tracking-widest">AML/CTF Screening Complete - NO ADVERSE FINDINGS</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3 px-2">
                                    {[
                                        { label: 'Sanctions', val: 'CLEAR (0 matches)' },
                                        { label: 'PEP (Politically Exposed Person)', val: 'CLEAR' },
                                        { label: 'Adverse Media', val: 'CLEAR (0 articles)' },
                                        { label: 'Watchlist Screening', val: 'CLEAR' },
                                        { label: 'Law Enforcement Databases', val: 'CLEAR' },
                                        { label: 'Financial Crime Databases', val: 'CLEAR' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check size={14} className="text-emerald-500" />
                                            <span className="text-[12px] font-medium text-emerald-800/80">{item.label}: <span className="text-emerald-900 font-semibold">{item.val}</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-100 rounded-[24px] p-6 space-y-1 shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Source of Funds</p>
                                    <p className="text-[15px] font-semibold text-slate-800">Employment Income - Verified</p>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[24px] p-6 space-y-1 shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Source of Wealth</p>
                                    <p className="text-[15px] font-semibold text-slate-800">Career Earnings - Documented</p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[24px] p-6 space-y-1 shadow-sm">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Risk Assessment</p>
                                <p className="text-[15px] font-semibold text-emerald-600 uppercase">LOW RISK</p>
                                <p className="text-[11px] font-medium text-slate-400">No enhanced due diligence required</p>
                            </div>

                            <div className="flex justify-center">
                                <button type="button" className="h-12 px-8 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm">
                                    <Upload size={16} className="rotate-180" />
                                    Download AML/CTF Screening Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 5. Borrower - Credit Assessment */}
                    <div className="bg-orange-50/20 border border-orange-100 rounded-2xl overflow-hidden">
                        <div className="p-8 border-b border-orange-50 flex items-center justify-between bg-white/50">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-50">
                                    <CreditCard size={22} />
                                </div>
                                <h4 className="text-[17px] font-semibold text-slate-800">5. Borrower - Credit Assessment (Equifax)</h4>
                                <p className="text-[11px] font-medium text-slate-400">Credit Bureau Report & Comprehensive Credit Reporting (CCR)</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    GOOD
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-white border border-blue-100 rounded-[28px] p-6 flex flex-col items-center justify-center shadow-md relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                    <div className="relative z-10 text-center space-y-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Credit Score</p>
                                        <p className="text-[44px] font-semibold text-blue-600 leading-none">742</p>
                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-semibold uppercase">
                                            Very Good (661-734)
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[28px] p-6 flex flex-col items-center justify-center shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payment History</p>
                                    <p className="text-[20px] font-semibold text-emerald-500 mt-1">100% On-Time</p>
                                    <p className="text-[11px] font-medium text-slate-400">No late payments</p>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[28px] p-6 flex flex-col items-center justify-center shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Credit Utilization</p>
                                    <p className="text-[20px] font-semibold text-blue-500 mt-1">28%</p>
                                    <p className="text-[11px] font-medium text-slate-400">Well below threshold</p>
                                </div>
                            </div>

                            <div className="bg-green-50 border-2 border-emerald-100 rounded-[28px] p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                        <Check size={20} />
                                    </div>
                                    <h5 className="text-[16px] font-semibold text-emerald-900 tracking-tight">Strong Credit Profile</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10">
                                    {[
                                        'No defaults or judgements recorded',
                                        'No bankruptcy or Part IX/X agreements',
                                        'No adverse credit events in past 7 years',
                                        'Credit enquiries: 2 in last 12 months (normal)',
                                        'Established credit history: 12+ years'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                                <Check size={12} />
                                            </div>
                                            <p className="text-[13px] font-medium text-emerald-800/80 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white border border-gray-100 rounded-[24px] p-8 space-y-1 shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Credit Accounts</p>
                                    <p className="text-[18px] font-semibold text-slate-800">5 accounts</p>
                                    <p className="text-[11px] font-medium text-slate-400">3 active, 2 closed</p>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[24px] p-8 space-y-1 shadow-sm">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Credit Limit</p>
                                    <p className="text-[18px] font-semibold text-slate-800">$85,000</p>
                                    <p className="text-[11px] font-medium text-slate-400">Across all facilities</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button type="button" className="h-12 px-8 bg-white border border-gray-200 rounded-xl text-[12px] font-semibold text-slate-700 flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm">
                                    <Upload size={16} className="rotate-180" />
                                    Download Credit Bureau Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 6. Guarantor - Identity Verification */}
                    <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-emerald-100 flex items-center justify-between bg-white/80">
                            <div className="flex items-center gap-5">
                                <div className="text-emerald-500">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[17px] font-semibold text-slate-800">6. Guarantor - Identity Verification (InfoTrack GreenID)</h4>
                                    <p className="text-[11px] font-medium text-slate-400">Sarah Johnson • 1982-07-22</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    VERIFIED
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white border border-emerald-50 rounded-[28px] p-8 space-y-4 shadow-sm">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Personal Details</p>
                                    <div className="space-y-1">
                                        <p className="text-[16px] font-semibold text-slate-800">Sarah Johnson</p>
                                        <p className="text-[12px] font-medium text-slate-400">DOB: 22/07/1982</p>
                                        <p className="text-[12px] font-medium text-slate-400">Email: sarah.johnson@email.com</p>
                                        <p className="text-[12px] font-medium text-slate-400">Phone: 0423 456 789</p>
                                    </div>
                                </div>
                                <div className="bg-white border border-emerald-50 rounded-[28px] p-8 space-y-4 shadow-sm">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Verified Documents</p>
                                    <div className="space-y-3">
                                        {[
                                            'Passport - Verified',
                                            "Driver's License VIC - Verified",
                                            'Utility Bill (Address proof) - Verified'
                                        ].map((doc, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <CheckCircle size={16} className="text-emerald-500" />
                                                <span className="text-[12px] font-medium text-slate-700">{doc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Identity Summary Banner */}
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[28px] p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h5 className="text-[16px] font-semibold text-emerald-900 tracking-tight">Identity Verified - 100 Points Passed</h5>
                                </div>
                                <div className="space-y-2 px-2">
                                    {[
                                        'GreenID score: 100/100 (Strong Match)',
                                        'Government database cross-verification complete',
                                        'Address verification: CONFIRMED',
                                        'Document authenticity: GENUINE'
                                    ].map((check, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-[12px] font-medium text-slate-600/80 leading-relaxed">{check}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Residential Address Box */}
                            <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-6 space-y-1">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Residential Address (Verified)</p>
                                <p className="text-[16px] font-semibold text-slate-800">789 Guarantee Lane, Melbourne VIC 3000</p>
                            </div>

                            <button type="button" className="w-full h-14 bg-white border border-emerald-100 rounded-2xl text-[13px] font-semibold text-slate-800 flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-sm">
                                <Download size={18} />
                                Download GreenID Verification Report (Guarantor)
                            </button>
                        </div>
                    </div>

                    {/* 7. Guarantor - AML/CTF Screening */}
                    <div className="bg-red-50 border-2 border-red-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-red-50 flex items-center justify-between bg-white/80">
                            <div className="flex items-center gap-5">
                                <div className="text-red-500">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[17px] font-semibold text-slate-800">7. Guarantor - AML/CTF Screening</h4>
                                    <p className="text-[11px] font-medium text-slate-400">Sanctions, PEP, Adverse Media & Watchlist Screening</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    CLEAR
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[28px] p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h5 className="text-[16px] font-semibold text-emerald-900 tracking-tight tracking-tight">AML/CTF Screening Complete - NO ADVERSE FINDINGS</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                                    {[
                                        'Sanctions: CLEAR (0 matches)',
                                        'PEP (Politically Exposed Person): CLEAR',
                                        'Adverse Media: CLEAR (0 articles)',
                                        'Watchlist Screening: CLEAR',
                                        'Law Enforcement Databases: CLEAR'
                                    ].map((check, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-[12px] font-medium text-slate-600/80 leading-relaxed">{check}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-6 space-y-1">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Risk Assessment</p>
                                <p className="text-[16px] font-semibold text-emerald-600 uppercase tracking-tight">LOW RISK</p>
                                <p className="text-[12px] font-medium text-slate-400 mt-1">No enhanced due diligence required</p>
                            </div>

                            <button type="button" className="w-full h-14 bg-white border border-red-100 rounded-2xl text-[13px] font-semibold text-slate-800 flex items-center justify-center gap-3 hover:bg-red-50 transition-all shadow-sm">
                                <Download size={18} />
                                Download AML/CTF Report (Guarantor)
                            </button>
                        </div>
                    </div>

                    {/* 8. Guarantor - Credit Assessment */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-amber-100 flex items-center justify-between bg-white/80">
                            <div className="flex items-center gap-5">
                                <div className="text-amber-500">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[17px] font-semibold text-slate-800">8. Guarantor - Credit Assessment (Equifax)</h4>
                                    <p className="text-[11px] font-medium text-slate-400">Credit Bureau Report & Serviceability Assessment</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-emerald-100">
                                    EXCELLENT
                                </div>
                                <ChevronDown size={20} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border-2 border-blue-500 rounded-[20px] p-6 flex flex-col items-center justify-center shadow-sm text-center space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Credit Score</p>
                                    <p className="text-[36px] font-semibold text-blue-600 leading-none">823</p>
                                    <p className="text-[12px] font-medium text-blue-400">Excellent (833-1200)</p>
                                </div>
                                <div className="bg-white border border-emerald-50 rounded-[20px] p-6 flex flex-col items-center justify-center shadow-sm text-center space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Payment History</p>
                                    <p className="text-[16px] font-semibold text-emerald-600 uppercase">100% On-Time</p>
                                    <p className="text-[11px] font-medium text-slate-400">Never missed payment</p>
                                </div>
                                <div className="bg-white border border-emerald-50 rounded-[20px] p-6 flex flex-col items-center justify-center shadow-sm text-center space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Credit Utilization</p>
                                    <p className="text-[16px] font-semibold text-emerald-600 uppercase">15%</p>
                                    <p className="text-[11px] font-medium text-slate-400">Excellent management</p>
                                </div>
                            </div>

                            {/* Credit Summary Banner */}
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[28px] p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h5 className="text-[16px] font-semibold text-emerald-900 tracking-tight">Excellent Credit Profile</h5>
                                </div>
                                <div className="space-y-2 px-2">
                                    {[
                                        'No adverse credit events',
                                        'Strong credit history: 18+ years',
                                        'Excellent payment track record',
                                        'High financial capacity confirmed'
                                    ].map((check, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-[12px] font-medium text-slate-600/80 leading-relaxed">{check}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="button" className="w-full h-14 bg-white border border-amber-200 rounded-2xl text-[13px] font-semibold text-slate-800 flex items-center justify-center gap-3 hover:bg-amber-50 transition-all shadow-sm">
                                <Download size={18} />
                                Download Credit Report (Guarantor)
                            </button>
                        </div>
                    </div>

                    {/* 9. Compliance Summary & Regulatory Sign-Off */}
                    <div className="bg-emerald-50/30 border-2 border-emerald-400 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-emerald-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-5">
                                <div className="text-emerald-500">
                                    <Flag size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[18px] font-semibold text-slate-800 tracking-tight">9. Compliance Summary & Regulatory Sign-Off</h4>
                                    <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest mt-1">AUSTRAC AML/CTF, NCCP, Privacy Act, ASIC Compliance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="bg-emerald-50 text-emerald-600 px-5 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-widest border border-emerald-200">
                                    COMPLIANT
                                </div>
                                <ChevronUp size={24} className="text-slate-800" />
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    {
                                        title: 'AML/CTF Act 2006',
                                        checks: ['Customer Due Diligence (CDD) complete', 'Enhanced Due Diligence (EDD) not required', 'Ongoing Customer Due Diligence (OCDD) scheduled', 'Transaction Monitoring: Active', 'Record keeping: Compliant (7 years)']
                                    },
                                    {
                                        title: 'NCCP Act 2009',
                                        checks: ['Consumer credit verification: Complete', 'Responsible lending obligations: Met', 'Assessment of unsuitability: Pending Step 9', 'Disclosure requirements: Pending Step 10', 'Credit licence verification: Required']
                                    },
                                    {
                                        title: 'Privacy Act 1988',
                                        checks: ['Consent obtained for all checks', 'Credit reporting privacy compliant', 'Data handling: Encrypted & secure', 'Notifiable Data Breach scheme: Compliant']
                                    },
                                    {
                                        title: 'ASIC Guidelines',
                                        checks: ['RG 209: Credit licensing obligations met', 'Consumer protection standards: Applied', 'Best interests duty: Framework in place', 'Disclosure obligations: In progress']
                                    }
                                ].map((box, i) => (
                                    <div key={i} className="bg-white border border-emerald-100 rounded-[24px] p-8 space-y-6 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 text-emerald-600">
                                                <CheckCircle size={20} />
                                            </div>
                                            <h5 className="text-[15px] font-semibold text-slate-800 tracking-tight">{box.title}</h5>
                                        </div>
                                        <div className="space-y-3">
                                            {box.checks.map((check, j) => (
                                                <div key={j} className="flex items-start gap-3">
                                                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                    <p className="text-[12px] font-medium text-slate-600/80 leading-relaxed">{check}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Banner */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-[28px] p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <h5 className="text-[16px] font-semibold text-emerald-900 tracking-tight uppercase">ALL VERIFICATION CHECKS COMPLETE & COMPLIANT</h5>
                                        <p className="text-[13px] font-medium text-emerald-700/80 mt-1">
                                            All third-party verifications have been completed successfully for borrower, guarantor, and property. No red flags or compliance concerns identified. Case ready to proceed to responsible lending assessment (Step 9).
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 px-2">
                                    <div className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <p className="text-[12px] font-medium text-emerald-800/80">Total Parties Verified: 2 (Borrower + Guarantor)</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <p className="text-[12px] font-medium text-emerald-800/80">Total Checks Completed: 8</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <p className="text-[12px] font-medium text-emerald-800/80">Risk Rating: <span className="text-emerald-600 font-semibold">LOW</span></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Check size={14} className="text-emerald-500" />
                                        <p className="text-[12px] font-medium text-emerald-800/80">Compliance Status: <span className="text-emerald-600 font-semibold">FULLY COMPLIANT</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <button type="button" className="h-14 bg-white border border-emerald-100 rounded-2xl text-[13px] font-semibold text-slate-800 flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-sm">
                                    <Download size={18} />
                                    Download Complete Verification Pack
                                </button>
                                <button type="button" className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200">
                                    <CheckCircle size={18} />
                                    Approve & Continue to Submit
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* 10. Final Case Finalization */}
                    <div className="border-[3px] border-emerald-500 rounded-2xl overflow-hidden shadow-2xl bg-white mt-8">
                        <div className="bg-emerald-500 p-8 flex items-center gap-4 text-white">
                            <CheckCircle size={28} />
                            <h4 className="text-[22px] font-semibold tracking-tight">Ready to Finalize Case</h4>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="text-[16px] font-medium text-emerald-900">
                                All verifications complete. Review the results above and submit to create the case.
                            </p>

                            {/* Pre-Checks Checklist */}
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-200">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h5 className="text-[18px] font-semibold text-emerald-900">All Pre-Checks Passed <span className="font-normal">✓</span></h5>
                                </div>
                                <div className="space-y-4 px-2">
                                    {[
                                        'Property valuation and title search completed',
                                        'All parties identified and verified',
                                        'AML/CTF screening complete for all entities',
                                        'Credit checks and identity verification passed',
                                        'NCCP compliance requirements met',
                                        'All required documents collected'
                                    ].map((check, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Check size={18} className="text-emerald-500 shrink-0" />
                                            <p className="text-[14px] font-medium text-emerald-800/80">{check}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Warning Box */}
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-[24px] p-6 flex items-start gap-4">
                                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 mt-0.5">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h6 className="text-[13px] font-semibold text-amber-900 uppercase tracking-widest">Final Confirmation Required</h6>
                                    <p className="text-[13px] font-medium text-amber-800/70 mt-1 leading-relaxed">
                                        By submitting this case, you confirm that all information provided is accurate and complete. This will create a new Mortgage in Possession case in the system and notify all relevant parties.
                                    </p>
                                </div>
                            </div>

                            {/* Final Buttons */}
                            <div className="flex items-center justify-end gap-6 pt-4">
                                <button type="button" onClick={() => setCurrentStep(10)} className="h-16 px-10 bg-white border-2 border-slate-100 rounded-2xl text-[14px] font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                                    ← Back to Review
                                </button>
                                <button type="button" onClick={() => setCurrentStep(11)} className="h-16 px-12 bg-emerald-600 text-white rounded-2xl text-[16px] font-semibold flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-200">
                                    <CheckCircle size={20} />
                                    Review Final Submission
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DisclosureStep({ formData, updateFormData }) {
    const handleToggle = (title) => {
        const currentAgreements = formData.disclosureAgreement || {};
        updateFormData({
            target: {
                name: 'disclosureAgreement',
                value: {
                    ...currentAgreements,
                    [title]: !currentAgreements[title]
                }
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Title Section */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Disclosure Requirements & Lender Licence</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">NCCP disclosure obligations and Australian Credit Licence verification</p>
                </div>
            </div>

            {/* Step 1: Confirm Lender Licence Status */}
            <div className="bg-violet-50 border border-purple-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Step 1: Confirm Lender Licence Status (NCCP s29)</h4>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 leading-relaxed">For regulated consumer credit, the lender must hold an Australian Credit Licence or be an authorised credit representative</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lender Licence Type *</label>
                    <select
                        required
                        name="licenceType"
                        value={formData.licenceType || ''}
                        onChange={updateFormData}
                        className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-purple-100 transition-all appearance-none cursor-pointer shadow-sm"
                    >
                        <option value="">Select...</option>
                        <option>ACL Holder (Australian Credit Licence)</option>
                        <option>Authorised Credit Representative</option>
                        <option>Exempt Entity</option>
                    </select>
                </div>
            </div>

            {/* Step 5: Disclosure Requirements */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-5 shadow-xl shadow-blue-900/5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Step 5: Disclosure Requirements (NCCP Part 3-2)</h4>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 leading-relaxed">All required disclosures must be provided before the borrower signs the credit contract</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Disclosure Items */}
                    {[
                        { title: "Credit Guide (NCCP s126) *", sub: "Mandatory for ACL holders - must outline services, fees, complaints process", status: 'required' },
                        { title: "Quote / Fee Disclosure (NCCP s17) *", sub: "All fees, charges, and credit costs must be clearly disclosed upfront", status: 'required' },
                        { title: "Credit Proposal Disclosure (if broker involved)", sub: "Required if a credit assistance provider (broker) is involved", status: 'optional' },
                        { title: "Credit Contract with Full Terms (NCCP s17) *", sub: "Complete contract including interest rate, payment schedule, all terms", status: 'required' },
                        { title: "Key Facts Sheet (for home loans) *", sub: "Required for residential mortgages - RG 209 Key Facts Sheet", status: 'required' },
                        { title: "All Fees, Interest & Comparison Rate Disclosed *", sub: "Includes application fee, ongoing fees, comparison rate, early exit fees", status: 'required' }
                    ].map((item, idx) => (
                        <div key={idx}
                            onClick={() => handleToggle(item.title)}
                            className={`p-6 rounded-[24px] flex items-center gap-4 transition-all cursor-pointer ${(formData.disclosureAgreement || {})[item.title] ? 'bg-blue-50 border-blue-200' : item.status === 'required' ? 'bg-red-50/50 border border-red-100/50' : 'bg-white/50 border border-gray-100 opacity-60'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${(formData.disclosureAgreement || {})[item.title] ? 'bg-blue-600 text-white' : item.status === 'required' ? 'bg-white text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                {(formData.disclosureAgreement || {})[item.title] ? <Check size={16} strokeWidth={3} /> : <Clock size={16} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${(formData.disclosureAgreement || {})[item.title] ? 'border-blue-600 bg-blue-600' : item.status === 'required' ? 'border-red-300' : 'border-gray-200'}`}>
                                        {(formData.disclosureAgreement || {})[item.title] && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                                    </div>
                                    <p className={`text-[13px] font-semibold tracking-tight ${(formData.disclosureAgreement || {})[item.title] ? 'text-blue-900' : item.status === 'required' ? 'text-red-900' : 'text-slate-400'}`}>{item.title}</p>
                                </div>
                                <p className={`text-[11px] font-medium mt-1 ${(formData.disclosureAgreement || {})[item.title] ? 'text-blue-700/60' : item.status === 'required' ? 'text-red-700/60' : 'text-slate-400'}`}>{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Disclosed Interest Rate (% p.a.) *</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            name="interestRate"
                            value={formData.interestRate || ''}
                            onChange={updateFormData}
                            placeholder="6.50"
                            className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Comparison Rate (% p.a.) *</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            name="comparisonRate"
                            value={formData.comparisonRate || ''}
                            onChange={updateFormData}
                            placeholder="6.75"
                            className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                        />
                        <p className="text-[10px] font-medium text-slate-400 px-2 mt-1 italic">Must include all fees and charges</p>
                    </div>
                </div>

                {/* Incomplete Disclosures Warning */}
                {Object.entries(formData.disclosureAgreement || {}).filter(([k, v]) => k.includes('*') && v).length < 5 && (
                    <div className="bg-red-50 border border-red-100 rounded-[28px] p-8 flex items-start gap-5 animate-pulse">
                        <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-red-900 tracking-tight flex items-center gap-2">
                                ⚠️ Incomplete Disclosures
                            </p>
                            <p className="text-[12px] font-medium text-red-800/60 leading-relaxed mt-1.5">
                                All required disclosures marked with * must be checked before you can proceed to submission. Failure to provide disclosures may result in ASIC enforcement action.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 8: Hardship & Complaint Handling */}
            <div className="bg-teal-50 border border-emerald-100 rounded-2xl p-6 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Step 8: Hardship & Complaint Handling (NCCP Part 3-2A)</h4>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 leading-relaxed">Lender must have processes in place for hardship and complaints</p>
                    </div>
                </div>

                <div className="space-y-5 px-2">
                    {[
                        { title: "Internal Dispute Resolution (IDR) Process *", sub: "Lender has documented IDR process compliant with RG 165" },
                        { title: "AFCA Membership *", sub: "Lender is a member of Australian Financial Complaints Authority (AFCA)" },
                        { title: "Hardship Variation Rights (NCCP s72)", sub: "Borrower informed of right to request hardship variation if circumstances change" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-5">
                            <div className="w-6 h-6 rounded-lg border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center shadow-md">
                                <Check size={16} className="text-white" strokeWidth={4} />
                            </div>
                            <div>
                                <p className="text-[14px] font-semibold text-slate-900 tracking-tight uppercase tracking-wide">{item.title}</p>
                                <p className="text-[12px] font-medium text-slate-500 mt-1">{item.sub}</p>
                            </div>
                        </div>
                    ))}

                    <div className="bg-teal-50 border border-emerald-100 border-dashed rounded-[24px] p-6 flex items-start gap-4 mt-10 shadow-inner">
                        <span className="text-2xl">📋</span>
                        <p className="text-[12px] font-medium text-emerald-900/70 leading-relaxed italic">
                            <span className="font-semibold text-emerald-900 not-italic uppercase tracking-widest text-[11px] block mb-1">Regulatory Note</span>
                            Under NCCP s72-74, if a borrower experiences financial hardship, they may request a variation to their credit contract. The lender must have a process to consider and respond to hardship requests within 21 days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PartiesStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">All Parties Involved</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Capture contact details for all professionals involved in the MIP transaction</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <Info size={18} className="text-blue-600" />
                </div>
                <div>
                    <p className="text-[14px] font-semibold text-blue-900 tracking-tight">Why capture all parties?</p>
                    <p className="text-[11px] font-medium text-blue-800/60 leading-relaxed mt-1">
                        Having complete contact information for all professionals streamlines communication, ensures compliance, and accelerates the settlement process. Required parties are marked with *.
                    </p>
                </div>
            </div>

            {/* Borrower's Lawyer Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Borrower's Lawyer / Solicitor *</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Legal representation for the borrower (Required)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lawyer Name *</label>
                        <input required type="text" name="borrowersLawyerName" value={formData.borrowersLawyerName || ''} onChange={updateFormData} placeholder="John Smith" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Law Firm *</label>
                        <input required type="text" name="borrowersLawyerFirm" value={formData.borrowersLawyerFirm || ''} onChange={updateFormData} placeholder="Smith & Associates" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="borrowersLawyerEmail" value={formData.borrowersLawyerEmail || ''} onChange={updateFormData} placeholder="john@smithlaw.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="tel" name="borrowersLawyerPhone" value={formData.borrowersLawyerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">License/Registration Number</label>
                        <input required type="text" name="borrowersLawyerLicense" value={formData.borrowersLawyerLicense || ''} onChange={updateFormData} placeholder="NSW 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="borrowersLawyerNotes" value={formData.borrowersLawyerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Lender's Lawyer Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Lender's Lawyer / Solicitor</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Legal representation for the lender (Optional)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lawyer Name</label>
                        <input required type="text" name="lendersLawyerName" value={formData.lendersLawyerName || ''} onChange={updateFormData} placeholder="Jane Doe" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Law Firm</label>
                        <input required type="text" name="lendersLawyerFirm" value={formData.lendersLawyerFirm || ''} onChange={updateFormData} placeholder="Doe Legal Partners" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="lendersLawyerEmail" value={formData.lendersLawyerEmail || ''} onChange={updateFormData} placeholder="jane@doelegal.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="tel" name="lendersLawyerPhone" value={formData.lendersLawyerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">License/Registration Number</label>
                        <input required type="text" name="lendersLawyerLicense" value={formData.lendersLawyerLicense || ''} onChange={updateFormData} placeholder="NSW 67890" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="lendersLawyerNotes" value={formData.lendersLawyerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Receiver / Liquidator Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Receiver / Liquidator</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Only if a receiver or liquidator has been appointed</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Has a Receiver/Liquidator been appointed?</label>
                    <select required name="receiverAppointed" value={formData.receiverAppointed || 'No'} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-rose-100 transition-all appearance-none cursor-pointer">
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
            </div>

            {/* Real Estate Agent Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Real Estate Agent</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Agent managing the property sale</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Agent Name</label>
                        <input required type="text" name="realEstateAgentName" value={formData.realEstateAgentName || ''} onChange={updateFormData} placeholder="Sarah Williams" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Agency Name</label>
                        <input required type="text" name="realEstateAgency" value={formData.realEstateAgency || ''} onChange={updateFormData} placeholder="Williams Real Estate" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="realEstateAgentEmail" value={formData.realEstateAgentEmail || ''} onChange={updateFormData} placeholder="sarah@williamsre.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="tel" name="realEstateAgentPhone" value={formData.realEstateAgentPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Agent License Number</label>
                        <input required type="text" name="realEstateAgentLicense" value={formData.realEstateAgentLicense || ''} onChange={updateFormData} placeholder="RE 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Commission Rate</label>
                        <input required type="text" name="realEstateAgentCommission" value={formData.realEstateAgentCommission || ''} onChange={updateFormData} placeholder="2.5% + GST" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="realEstateAgentNotes" value={formData.realEstateAgentNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Accountant Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Accountant</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Accountant handling financial aspects</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Accountant Name</label>
                        <input required type="text" name="accountantName" value={formData.accountantName || ''} onChange={updateFormData} placeholder="Michael Chen" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Accounting Firm</label>
                        <input required type="text" name="accountantFirm" value={formData.accountantFirm || ''} onChange={updateFormData} placeholder="Chen & Partners Accounting" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="accountantEmail" value={formData.accountantEmail || ''} onChange={updateFormData} placeholder="michael@chenaccounting.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="accountantPhone" value={formData.accountantPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">CPA/CA Registration</label>
                        <input required type="text" name="accountantRegistration" value={formData.accountantRegistration || ''} onChange={updateFormData} placeholder="CPA 123456" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Specialty</label>
                        <input required type="text" name="accountantSpecialty" value={formData.accountantSpecialty || ''} onChange={updateFormData} placeholder="Tax, Forensic Accounting" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="accountantNotes" value={formData.accountantNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-teal-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Valuer / Appraiser Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Valuer / Appraiser</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Professional property valuer</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Valuer Name</label>
                        <input required type="text" name="valuerName" value={formData.valuerName || ''} onChange={updateFormData} placeholder="David Martinez" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Company</label>
                        <input required type="text" name="valuerFirm" value={formData.valuerFirm || ''} onChange={updateFormData} placeholder="Martinez Valuations" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="valuerEmail" value={formData.valuerEmail || ''} onChange={updateFormData} placeholder="david@martinezval.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="valuerPhone" value={formData.valuerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Auctioneer Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Auctioneer</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">If property is being sold via auction</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Auctioneer Name</label>
                        <input required type="text" name="auctioneerName" value={formData.auctioneerName || ''} onChange={updateFormData} placeholder="Tom Anderson" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Company</label>
                        <input required type="text" name="auctioneerFirm" value={formData.auctioneerFirm || ''} onChange={updateFormData} placeholder="Anderson Auctions" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="auctioneerEmail" value={formData.auctioneerEmail || ''} onChange={updateFormData} placeholder="tom@andersonauctions.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="auctioneerPhone" value={formData.auctioneerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Auctioneer License Number</label>
                        <input required type="text" name="auctioneerLicense" value={formData.auctioneerLicense || ''} onChange={updateFormData} placeholder="AUC 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="auctioneerNotes" value={formData.auctioneerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Conveyancer / Settlement Agent Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center shadow-inner">
                        <FileCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Conveyancer / Settlement Agent</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Handling conveyancing and settlement</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Conveyancer Name</label>
                        <input required type="text" name="conveyancerName" value={formData.conveyancerName || ''} onChange={updateFormData} placeholder="Lisa Thompson" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Firm Name</label>
                        <input required type="text" name="conveyancerFirm" value={formData.conveyancerFirm || ''} onChange={updateFormData} placeholder="Thompson Conveyancing" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="conveyancerEmail" value={formData.conveyancerEmail || ''} onChange={updateFormData} placeholder="lisa@thompsonconv.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="conveyancerPhone" value={formData.conveyancerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">License Number</label>
                        <input required type="text" name="conveyancerLicense" value={formData.conveyancerLicense || ''} onChange={updateFormData} placeholder="CONV 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="conveyancerNotes" value={formData.conveyancerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-cyan-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Property Manager Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Property Manager</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">If property is tenanted or under management</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Manager Name</label>
                        <input required type="text" name="propertyManagerName" value={formData.propertyManagerName || ''} onChange={updateFormData} placeholder="Emma Wilson" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Agency Name</label>
                        <input required type="text" name="propertyManagerAgency" value={formData.propertyManagerAgency || ''} onChange={updateFormData} placeholder="Wilson Property Management" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="propertyManagerEmail" value={formData.propertyManagerEmail || ''} onChange={updateFormData} placeholder="emma@wilsonpm.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="propertyManagerPhone" value={formData.propertyManagerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">License Number</label>
                        <input required type="text" name="propertyManagerLicense" value={formData.propertyManagerLicense || ''} onChange={updateFormData} placeholder="PM 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="propertyManagerNotes" value={formData.propertyManagerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Trustee (Bankruptcy) Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Trustee (Bankruptcy)</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Only if borrower is bankrupt and trustee appointed</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Has a Bankruptcy Trustee been appointed?</label>
                    <select required name="bankruptcyTrusteeAppointed" value={formData.bankruptcyTrusteeAppointed || 'No'} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-rose-100 transition-all appearance-none cursor-pointer">
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
            </div>

            {/* Insurance Broker Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Insurance Broker</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Managing property and mortgage insurance</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Broker Name</label>
                        <input required type="text" name="insuranceBrokerName" value={formData.insuranceBrokerName || ''} onChange={updateFormData} placeholder="Chris Taylor" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Brokerage</label>
                        <input required type="text" name="insuranceBrokerage" value={formData.insuranceBrokerage || ''} onChange={updateFormData} placeholder="Taylor Insurance Brokers" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Email</label>
                        <input required type="email" name="insuranceBrokerEmail" value={formData.insuranceBrokerEmail || ''} onChange={updateFormData} placeholder="chris@taylorinsurance.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Phone</label>
                        <input required type="text" name="insuranceBrokerPhone" value={formData.insuranceBrokerPhone || ''} onChange={updateFormData} placeholder="(02) 9000 0000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">License Number</label>
                        <input required type="text" name="insuranceBrokerLicense" value={formData.insuranceBrokerLicense || ''} onChange={updateFormData} placeholder="INS 12345" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Notes</label>
                        <input required type="text" name="insuranceBrokerNotes" value={formData.insuranceBrokerNotes || ''} onChange={updateFormData} placeholder="Additional information" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PropertyFeaturesStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Building2 size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Property Features & Condition</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Detailed property information for lender assessment</p>
                </div>
            </div>

            {/* Building Specifications Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Building Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Year Built</label>
                        <input required type="number" min="0" name="yearBuilt" value={formData.yearBuilt} onChange={updateFormData} placeholder="1995" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Floor Area (sqm)</label>
                        <input required type="number" min="0" name="floorArea" value={formData.floorArea} onChange={updateFormData} placeholder="180" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Number of Storeys</label>
                        <input required type="number" min="0" name="numberOfStoreys" value={formData.numberOfStoreys || ''} onChange={updateFormData} placeholder="2" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Construction Type</label>
                        <select required name="constructionType" value={formData.constructionType || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-emerald-100 transition-all appearance-none cursor-pointer">
                            <option value="">Select type</option>
                            <option>Brick</option>
                            <option>Weatherboard</option>
                            <option>Concrete</option>
                            <option>Cladding</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Roof Type</label>
                        <select required name="roofType" value={formData.roofType || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-emerald-100 transition-all appearance-none cursor-pointer">
                            <option value="">Select type</option>
                            <option>Tile</option>
                            <option>Colorbond</option>
                            <option>Slate</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Property Condition</label>
                        <select required name="condition" value={formData.condition} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-emerald-100 transition-all appearance-none cursor-pointer">
                            <option>Good</option>
                            <option>Excellent</option>
                            <option>Fair</option>
                            <option>Poor (Needs work)</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Recent Renovations/Improvements</label>
                        <textarea required name="renovations" value={formData.renovations || ''} onChange={updateFormData} placeholder="Kitchen renovation 2022, new roof 2021, etc." className="w-full min-h-[100px] bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all resize-none"></textarea>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Special Features</label>
                        <textarea required name="specialFeatures" value={formData.specialFeatures || ''} onChange={updateFormData} placeholder="Swimming pool, tennis court, granny flat, solar panels, etc." className="w-full min-h-[100px] bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all resize-none"></textarea>
                    </div>
                </div>
            </div>

            {/* Rates & Ongoing Charges Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Rates & Ongoing Charges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Council Rates (Annual A$)</label>
                        <input required type="number" min="0" name="councilRates" value={formData.councilRates || ''} onChange={updateFormData} placeholder="2500" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Water Rates (Annual A$)</label>
                        <input required type="number" min="0" name="waterRates" value={formData.waterRates || ''} onChange={updateFormData} placeholder="800" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Strata Fees (Quarterly A$)</label>
                        <input required type="number" min="0" name="strataFees" value={formData.strataFees || ''} onChange={updateFormData} placeholder="1200" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                        <p className="text-[10px] font-medium text-slate-400 italic px-2">If applicable (apartments/townhouses)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Land Tax (Annual A$)</label>
                        <input required type="text" name="landTax" value={formData.landTax || ''} onChange={updateFormData} placeholder="0" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                        <p className="text-[10px] font-medium text-slate-400 italic px-2">If applicable (investment property)</p>
                    </div>
                </div>
            </div>

            {/* Insurance Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Insurance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Insurance Provider</label>
                        <input required type="text" name="insuranceProvider" value={formData.insuranceProvider || ''} onChange={updateFormData} placeholder="NRMA, RACV, etc." className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Sum Insured (A$)</label>
                        <input required type="text" name="sumInsured" value={formData.sumInsured || ''} onChange={updateFormData} placeholder="800000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Insurance Expiry Date</label>
                        <input required type="date" name="insuranceExpiryDate" value={formData.insuranceExpiryDate || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Upload Insurance Policy</label>
                        <label className="w-full h-14 bg-white border border-gray-200 rounded-2xl px-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-slate-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
                            <Upload size={18} className="text-indigo-600" />
                            Upload Policy
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                if (e.target.files?.[0]) toast.success(`Insurance policy uploaded: ${e.target.files[0].name}`);
                            }} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Sales History Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Sales History</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Last Sale Price (A$)</label>
                        <input required type="text" name="lastSalePrice" value={formData.lastSalePrice || ''} onChange={updateFormData} placeholder="850000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Last Sale Date</label>
                        <input required type="date" name="lastSaleDate" value={formData.lastSaleDate || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Prior Sale Price (A$)</label>
                        <input required type="text" name="priorSalePrice" value={formData.priorSalePrice || ''} onChange={updateFormData} placeholder="650000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Prior Sale Date</label>
                        <input required type="date" name="priorSaleDate" value={formData.priorSaleDate || ''} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all" />
                    </div>
                </div>
            </div>

            {/* Supporting Documents Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <h4 className="text-xl font-semibold text-slate-900 tracking-tight">Supporting Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Title Deed/Certificate</label>
                        <label className="w-full h-14 bg-white border border-gray-200 rounded-2xl px-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-slate-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
                            <Upload size={18} className="text-indigo-600" />
                            Upload Title
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                if (e.target.files?.[0]) toast.success(`Title deed uploaded: ${e.target.files[0].name}`);
                            }} />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Rates Certificate</label>
                        <label className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-slate-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
                            <Upload size={18} className="text-indigo-600" />
                            Upload Certificate
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                if (e.target.files?.[0]) toast.success(`Rates certificate uploaded: ${e.target.files[0].name}`);
                            }} />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Building/Pest Inspection</label>
                        <label className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-slate-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
                            <Upload size={18} className="text-indigo-600" />
                            Upload Report
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                if (e.target.files?.[0]) toast.success(`Building inspection uploaded: ${e.target.files[0].name}`);
                            }} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoanDetailsStep({ formData, updateFormData, setFormValue }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Loan Details</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Complete loan and financial information</p>
                </div>
            </div>

            {/* NCCP Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-4">
                <label className="flex items-start gap-5 cursor-pointer group">
                    <div className="mt-1 relative">
                        <input required
                            type="checkbox"
                            checked={formData.nccpSubject || false}
                            onChange={(e) => setFormValue('nccpSubject', e.target.checked)}
                            className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                        />
                        <div className={`w-8 h-8 border-2 rounded-xl flex items-center justify-center transition-all ${formData.nccpSubject ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-300 group-hover:border-blue-400 shadow-sm'}`}>
                            <Check size={18} className={`text-white transition-opacity ${formData.nccpSubject ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[14px] font-semibold text-slate-900 tracking-tight">This loan is subject to NCCP (National Consumer Credit Protection Act 2009)</p>
                        <p className="text-[11px] font-medium text-blue-800/60 leading-relaxed">
                            Check this box if the loan is regulated consumer credit. This will enable comprehensive verification checks (Step 5) and responsible lending assessment (Step 9) in accordance with NCCP requirements. Leave unchecked for commercial/business loans not subject to NCCP.
                        </p>
                    </div>
                </label>
            </div>

            {/* Financial Details Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Outstanding Debt (A$) *</label>
                        <input required type="text" name="outstandingDebt" value={formData.outstandingDebt} onChange={updateFormData} placeholder="450000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Original Loan Amount (A$) *</label>
                        <input required type="text" name="originalLoanAmount" value={formData.originalLoanAmount} onChange={updateFormData} placeholder="500000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Loan Start Date</label>
                        <input required type="date" name="loanStartDate" value={formData.loanStartDate} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Interest Rate (%)</label>
                        <input required type="text" name="interestRate" value={formData.interestRate} onChange={updateFormData} placeholder="5.5" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Repayment Type</label>
                        <select required name="repaymentType" value={formData.repaymentType} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:ring-4 focus:ring-purple-100 transition-all appearance-none cursor-pointer">
                            <option>Principal & Interest</option>
                            <option>Interest Only</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Missed Payments *</label>
                        <input required type="text" name="missedPayments" value={formData.missedPayments} onChange={updateFormData} placeholder="3" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Total Arrears (A$)</label>
                        <input required type="text" name="totalArrears" value={formData.totalArrears} onChange={updateFormData} placeholder="15000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Default Notice Date</label>
                        <input required type="date" name="defaultNoticeDate" value={formData.defaultNoticeDate} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                    </div>
                </div>

                {/* Property Valuation Header */}
                <div className="pt-6 border-t border-gray-100 mt-4">
                    <h4 className="text-xl font-semibold text-slate-900 tracking-tight mb-8">Property Valuation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Current Valuation (A$) *</label>
                            <input required type="text" name="valuationAmount" value={formData.valuationAmount} onChange={updateFormData} placeholder="650000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Valuation Date</label>
                            <input required type="date" name="valuationDate" value={formData.valuationDate} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Valuation Provider</label>
                            <input required type="text" name="valuationProvider" value={formData.valuationProvider} onChange={updateFormData} placeholder="Preston Rowe Paterson" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Upload Valuation Report *</label>
                            <label className="w-full h-14 bg-white border border-gray-200 rounded-2xl px-6 flex items-center justify-center gap-3 text-[13px] font-semibold text-slate-600 hover:bg-gray-50 transition-all shadow-sm active:scale-95 duration-200 cursor-pointer">
                                <Upload size={18} className="text-indigo-600" />
                                Upload Report
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => {
                                    if (e.target.files?.[0]) toast.success(`Valuation report uploaded: ${e.target.files[0].name}`);
                                }} />
                            </label>
                            <p className="text-[10px] font-medium text-slate-400 mt-2 italic px-2">
                                Note: A valuation report will be automatically generated upon payment in Step 3
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LenderDetailsStep({ formData, updateFormData }) {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Building2 size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Lender Details & Documents</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Current lender and loan account information</p>
                </div>
            </div>

            {/* Lender Details Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lender Name *</label>
                        <input required type="text" name="lenderName" value={formData.lenderName} onChange={updateFormData} placeholder="Commonwealth Bank of Australia" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Primary Contact Person</label>
                        <input required type="text" name="primaryContact" value={formData.primaryContact} onChange={updateFormData} placeholder="John Doe - Loan Manager" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lender Email *</label>
                        <input required type="email" name="lenderEmail" value={formData.lenderEmail} onChange={updateFormData} placeholder="lender@bank.com.au" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Lender Phone</label>
                        <input required type="text" name="lenderPhone" value={formData.lenderPhone} onChange={updateFormData} placeholder="1300 000 000" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Loan Account Number</label>
                        <input required type="text" name="loanAccountNumber" value={formData.loanAccountNumber} onChange={updateFormData} placeholder="123456789" className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" />
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm shadow-blue-50">
                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                        <Info size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-blue-900 uppercase tracking-tight mb-1">Lender Coordination</p>
                        <p className="text-[11px] font-medium text-blue-800/80 leading-relaxed">
                            We'll contact the lender to verify the outstanding loan amount and coordinate the settlement process once a buyer is found.
                        </p>
                    </div>
                </div>
            </div>

            {/* Lender Documents Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Lender Documents for Mortgage Reassignment</h4>
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Upload all documents the lender should be holding to facilitate mortgage reassignment and settlement</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { name: 'Original Loan Agreement', req: true, desc: 'Original executed loan contract, terms and conditions, signed agreements' },
                            { name: 'Loan Variations & Amendments', req: false, desc: 'Any variations, amendments, modifications to original loan terms' },
                            { name: 'Bank Statements (Last 6 Months)', req: true, desc: 'Recent bank statements showing loan account activity, payments, arrears' },
                            { name: 'Payout Letter', req: true, desc: 'Current payout figure, discharge costs, settlement instructions' },
                            { name: 'Formal Credit Approvals', req: true, desc: 'Original credit approval, assessment documents, lending criteria' },
                            { name: 'Registered Mortgage Documents', req: true, desc: 'Registered mortgage, dealing numbers, priority notices' },
                            { name: 'Security Documents', req: true, desc: 'General security agreements, guarantees, additional security' },
                            { name: 'Insurance Certificate', req: false, desc: 'Lenders mortgage insurance (LMI), building insurance certificates' },
                            { name: 'Loan Account History', req: true, desc: 'Full transaction history, payment schedule, interest calculations' },
                            { name: 'Arrears Summary', req: true, desc: 'Detailed arrears breakdown, missed payments, default notices issued' },
                            { name: 'Legal Advice Signed', req: true, desc: 'Signed legal advice documents, solicitor letters, legal representation confirmation' },
                            { name: 'Privacy Consent Signed', req: true, desc: 'Signed privacy consent forms, authorization to share information, disclosure agreements' }
                        ].map((doc, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gray-50/50 hover:bg-amber-50/50 border-2 border-transparent hover:border-amber-200 rounded-3xl transition-all group shadow-sm">
                                <div>
                                    <h5 className="text-[14px] font-semibold text-slate-800 tracking-tight">{doc.name} {doc.req && <span className="text-rose-500">*</span>}</h5>
                                    <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{doc.desc}</p>
                                </div>
                                {uploadedDocs.has(idx) ? (
                                    <span className="bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shrink-0">
                                        <CheckCircle size={16} /> Uploaded
                                    </span>
                                ) : (
                                    <label className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-5px_rgba(30,58,138,0.2)] group-hover:bg-blue-600 shrink-0 active:scale-95 duration-300 cursor-pointer">
                                        <Upload size={16} />
                                        Upload
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                toast.success(`${doc.name} uploaded: ${e.target.files[0].name}`);
                                                setUploadedDocs(prev => new Set([...prev, idx]));
                                            }
                                        }} />
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between pt-6 border-t border-gray-100 gap-4">
                        <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">
                            <span className="text-slate-800">{uploadedDocs.size} of 12</span> categories completed
                        </p>
                        <p className="text-[11px] font-medium text-rose-500 uppercase tracking-widest">
                            {Math.max(0, 10 - uploadedDocs.size)} required documents missing
                        </p>
                    </div>
                </div>
            </div>

            {/* Critical Requirements Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-amber-200">
                        <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 tracking-tight">Critical for Mortgage Reassignment</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">These documents are essential for a successful mortgage reassignment. Missing documents may delay or prevent the transaction. The lender must provide:</p>
                    </div>
                </div>

                <ul className="space-y-4 pt-4">
                    {[
                        'All original executed loan documentation',
                        'Current payout figures with settlement instructions',
                        'Registered mortgage documents with dealing numbers',
                        'Complete security package including guarantees',
                        'Full loan account history and arrears breakdown'
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[12px] font-medium text-amber-900/80 leading-relaxed">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function PropertyDetailsStep({
    formData,
    updateFormData,
    setFormValue
}) {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);

    const handleVerifyClick = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setIsVerified(true);
        }, 1500);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Step Subtitle */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <MapPin size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Property Details</h3>
                    <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Enter property address for RP Data validation</p>
                </div>
            </div>

            {/* Property Form Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="bg-blue-50/50 border-b border-gray-100 px-10 py-5">
                    <h4 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Property Details</h4>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Street Address */}
                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                                Street Address * <span className="text-gray-400 lowercase font-medium">(Auto-complete enabled)</span>
                            </label>
                            <input required
                                type="text"
                                name="propertyAddress"
                                value={formData.propertyAddress}
                                onChange={updateFormData}
                                placeholder="45 Victoria Street"
                                className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Suburb *</label>
                            <input required
                                type="text"
                                name="suburb"
                                value={formData.suburb}
                                onChange={updateFormData}
                                placeholder="Potts Point"
                                className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">State *</label>
                            <select required name="state" value={formData.state} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer">
                                <option>NSW</option>
                                <option>VIC</option>
                                <option>QLD</option>
                                <option>WA</option>
                                <option>SA</option>
                                <option>TAS</option>
                                <option>ACT</option>
                                <option>NT</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Postcode *</label>
                            <input required
                                type="text"
                                name="postcode"
                                value={formData.postcode}
                                onChange={updateFormData}
                                placeholder="2011"
                                className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Property Type *</label>
                            <select required name="propertyType" value={formData.propertyType} onChange={updateFormData} className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer">
                                <option>House</option>
                                <option>Unit/Apartment</option>
                                <option>Land</option>
                                <option>Commercial</option>
                                <option>Industrial</option>
                            </select>
                        </div>

                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Intended Loan Amount (A$) *</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                <input required
                                    type="text"
                                    name="intendedLoanAmount"
                                    value={formData.intendedLoanAmount}
                                    onChange={updateFormData}
                                    placeholder="650000"
                                    className="w-full h-14 bg-gray-50/50 border border-gray-100 rounded-2xl pl-10 pr-6 text-[13px] font-medium text-slate-600 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {!isVerified ? (
                        <button
                            type="button"
                            onClick={handleVerifyClick}
                            className={`w-full h-16 rounded-[24px] font-semibold text-[15px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] ${isVerifying ? 'bg-indigo-400 cursor-not-allowed shadow-inner' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 hover:shadow-indigo-200'}`}
                            disabled={isVerifying || !formData.propertyAddress}
                        >
                            {isVerifying ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    Verifying Address...
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    Validate & Pull Property Data
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="mt-8 border border-emerald-100 bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                            <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded shadow-sm border border-emerald-100">
                                        <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-semibold text-slate-900">RP Data Snapshot</h4>
                                        <p className="text-[11px] font-medium text-slate-500">Data Source: RP Data • {new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[12px] font-semibold border border-emerald-100 rounded-full">
                                    85% Confidence
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[12px] font-medium text-slate-500 mb-1">Estimated Value (Midpoint)</p>
                                            <h2 className="text-3xl font-semibold text-slate-900">A$850,000</h2>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-medium text-slate-500 mb-1">Value Range</p>
                                            <h3 className="text-lg font-semibold text-slate-600">A$810,000 – A$890,000</h3>
                                        </div>
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-medium text-slate-500">Confidence Score</span>
                                                <span className="text-[14px] font-semibold text-slate-900">85%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Last Sale Date</p>
                                                <p className="text-[13px] font-semibold text-slate-900">3/15/2022</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Last Sale Price</p>
                                                <p className="text-[13px] font-semibold text-slate-900">A$780,000</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Land Size</p>
                                                <p className="text-[13px] font-semibold text-slate-900">520 sqm</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Dwelling Type</p>
                                                <p className="text-[13px] font-semibold text-slate-900">House</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Bedrooms</p>
                                                <p className="text-[13px] font-semibold text-slate-900">3</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-slate-400">Bathrooms</p>
                                                <p className="text-[13px] font-semibold text-slate-900">2</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-[13px] font-semibold text-slate-900 mb-3">Comparable Sales</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                                    <span className="text-[13px] font-medium text-slate-500">47 Victoria St</span>
                                                    <div className="text-right">
                                                        <span className="block text-[13px] font-semibold text-slate-900">A$865,000</span>
                                                        <span className="block text-[11px] text-slate-400">1/10/2024</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                                    <span className="text-[13px] font-medium text-slate-500">43 Victoria St</span>
                                                    <div className="text-right">
                                                        <span className="block text-[13px] font-semibold text-slate-900">A$835,000</span>
                                                        <span className="block text-[11px] text-slate-400">11/22/2023</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                                    <span className="text-[13px] font-medium text-slate-500">49 Victoria St</span>
                                                    <div className="text-right">
                                                        <span className="block text-[13px] font-semibold text-slate-900">A$820,000</span>
                                                        <span className="block text-[11px] text-slate-400">9/5/2023</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-emerald-100 flex gap-4">
                                {!isAccepted ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setIsAccepted(true)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle size={16} /> Accept RP Data
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 h-12 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2"
                                        >
                                            <AlertTriangle size={16} /> Override Value
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-semibold text-emerald-800 tracking-tight">RP Data Accepted</h4>
                                            <p className="text-[12px] font-medium text-emerald-600/80">Valuation: A$850,000</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PPSA Section */}
            <div className="bg-violet-50 border border-purple-100 rounded-2xl p-6 space-y-5 shadow-sm mt-10">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-purple-100">
                        <Shield size={24} className="text-purple-600" />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight">Security Requirements (PPSA Compliance)</h4>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mt-1">Personal Property Securities Act 2009 - Ensure security interests are properly registered</p>
                    </div>
                </div>

                {/* Orange Alert Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg border border-amber-200 shadow-sm shrink-0">
                        <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h5 className="text-[11px] font-semibold text-amber-900 uppercase tracking-tight">PPSA Compliance Required</h5>
                        <p className="text-[12px] font-medium text-amber-800/80 mt-1 leading-relaxed">
                            Under the Personal Property Securities Act 2009, all security interests in personal property must be registered on the PPSR to be enforceable against third parties. For real property mortgages, registration on title is required.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Type of Security *</label>
                        <select required
                            value={formData.securityType}
                            onChange={(e) => setFormValue('securityType', e.target.value)}
                            className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 focus:ring-4 focus:ring-purple-100 transition-all outline-none appearance-none cursor-pointer shadow-sm"
                        >
                            <option>Registered Mortgage (Real Property)</option>
                            <option>General Security Agreement (GSA)</option>
                            <option>Security over Specific Goods</option>
                            <option>Purchase Money Security Interest (PMSI)</option>
                            <option>Unsecured</option>
                        </select>
                        <p className="text-[10px] font-medium text-gray-400 mt-1">PPSA s12 - Classification of security interest type</p>
                    </div>

                    {formData.securityType === 'Registered Mortgage (Real Property)' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 space-y-6 animate-scale-in">
                            <div className="flex items-center gap-3 mb-2">
                                <FileCheck size={20} className="text-blue-600" />
                                <h5 className="text-[13px] font-semibold text-slate-900 uppercase tracking-widest">Registered Mortgage Requirements</h5>
                            </div>

                            <label className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-blue-50 cursor-pointer group hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                                <div className="mt-1 relative">
                                    <input
                                        required
                                        type="checkbox"
                                        checked={formData.mortgageRegistered || false}
                                        onChange={(e) => setFormValue('mortgageRegistered', e.target.checked)}
                                        className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${formData.mortgageRegistered ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        <Check size={14} className={`text-white transition-opacity ${formData.mortgageRegistered ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[12px] font-semibold text-slate-900">Mortgage Registered on Title *</p>
                                    <p className="text-[10px] font-medium text-gray-400 mt-1 italic">Confirm that the mortgage is registered on the Certificate of Title at the relevant Land Titles Office (Real Property Act)</p>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Mortgage Priority *</label>
                                <select required className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none cursor-pointer shadow-sm">
                                    <option>First Mortgage (Priority)</option>
                                    <option>Second Mortgage (Subordinated)</option>
                                    <option>Subsequent Mortgage</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Security Agreement Date</label>
                            <input required
                                type="date"
                                className="w-full h-14 bg-white border border-gray-100 rounded-2xl px-6 text-[13px] font-medium text-slate-600 focus:ring-4 focus:ring-purple-100 transition-all outline-none shadow-sm cursor-text"
                            />
                            <p className="text-[10px] font-medium text-gray-400 mt-1">Date when security agreement was executed</p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Description of Secured Property</label>
                        <textarea required
                            placeholder="Describe the property or assets that are subject to the security interest..."
                            className="w-full min-h-[120px] bg-white border border-gray-100 rounded-3xl p-6 text-[13px] font-medium text-slate-600 placeholder:text-gray-300 focus:ring-4 focus:ring-purple-100 transition-all outline-none shadow-sm resize-none"
                        ></textarea>
                        <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-widest">PPSA s153 - Clear description of collateral required</p>
                    </div>

                    <label className="flex items-center gap-4 p-6 bg-violet-50 rounded-[24px] border-2 border-purple-200 cursor-pointer group hover:bg-purple-100/50 transition-all shadow-sm mt-8">
                        <div className="relative">
                            <input
                                required
                                type="checkbox"
                                checked={formData.ppsaCompliance || false}
                                onChange={(e) => setFormValue('ppsaCompliance', e.target.checked)}
                                className="peer absolute opacity-0 w-6 h-6 cursor-pointer"
                            />
                            <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${formData.ppsaCompliance ? 'bg-purple-600 border-purple-600' : 'border-purple-300 group-hover:border-purple-400'}`}>
                                <Check size={16} className={`text-white transition-opacity ${formData.ppsaCompliance ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-purple-900 uppercase tracking-wider">I confirm PPSA compliance for this security interest *</p>
                            <p className="text-[10px] font-medium text-purple-700/60 mt-1 leading-relaxed">
                                I confirm that all security interests have been properly perfected according to PPSA requirements, including registration where required, and all necessary searches have been conducted.
                            </p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

