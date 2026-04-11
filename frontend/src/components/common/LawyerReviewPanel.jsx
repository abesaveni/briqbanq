/**
 * LawyerReviewPanel — read-only view of the lawyer's compliance checklist.
 * Reads from caseItem.metadata_json.lawyer_review (saved by the lawyer).
 * Used by borrower, lender, investor, and admin case detail views.
 */

import { CheckCircle, XCircle, Clock, Shield, ClipboardList, User, Calendar } from 'lucide-react'

const COMPLIANCE_ITEMS = [
  { id: 'title_search',       category: 'Title & Ownership',    label: 'Title Search & Ownership Verification' },
  { id: 'certificate_of_title', category: 'Title & Ownership', label: 'Certificate of Title — Encumbrances Check' },
  { id: 'mortgage_registration', category: 'Title & Ownership', label: 'Mortgage Registration & Priority' },
  { id: 'ppsr',               category: 'Regulatory Searches',  label: 'PPSR Search (Personal Property Securities Register)' },
  { id: 'council_rates',      category: 'Government Searches',  label: 'Council Rates Search' },
  { id: 'water_rates',        category: 'Government Searches',  label: 'Water & Drainage Search' },
  { id: 'land_tax',           category: 'Government Searches',  label: 'Land Tax Search' },
  { id: 'strata_report',      category: 'Property Condition',   label: 'Strata / Owners Corporation Search' },
  { id: 'building_pest',      category: 'Property Condition',   label: 'Building & Pest Inspection Report' },
  { id: 'zoning',             category: 'Planning & Zoning',    label: 'Zoning & Planning Certificate (s10.7 or equivalent)' },
  { id: 'aml_kyc',            category: 'Compliance & AML',     label: 'AML/KYC Compliance Verification' },
  { id: 'firb',               category: 'Compliance & AML',     label: 'FIRB Compliance (Foreign Investment Review Board)' },
  { id: 'default_notices',    category: 'Enforcement',          label: 'Default Notices — s57/s88 Verification' },
  { id: 'loan_agreement',     category: 'Documentation',        label: 'Loan Agreement & Security Documents Review' },
  { id: 'insurance',          category: 'Documentation',        label: 'Building Insurance Verification' },
]

const CATEGORIES = [...new Set(COMPLIANCE_ITEMS.map(i => i.category))]

export default function LawyerReviewPanel({ caseItem }) {
  const review = caseItem?.metadata_json?.lawyer_review

  if (!review) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ClipboardList size={22} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">No Legal Review Yet</p>
        <p className="text-xs text-slate-400 mt-1">
          The assigned lawyer has not started the compliance review for this case.
        </p>
      </div>
    )
  }

  const { checklist = {}, notes, checked_count = 0, total_count = 0, completed, lawyer_name, last_saved_at } = review
  const progress = total_count > 0 ? Math.round((checked_count / total_count) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className={`rounded-xl p-4 border ${completed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${completed ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {completed
                ? <CheckCircle size={18} className="text-emerald-600" />
                : <Clock size={18} className="text-amber-600" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${completed ? 'text-emerald-800' : 'text-amber-800'}`}>
                {completed ? 'Legal Review Complete' : 'Legal Review In Progress'}
              </p>
              <p className={`text-xs mt-0.5 ${completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {checked_count} of {total_count} compliance items verified
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${completed ? 'text-emerald-700' : 'text-amber-700'}`}>{progress}%</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${completed ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Reviewer meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        {lawyer_name && (
          <span className="flex items-center gap-1.5">
            <User size={12} className="text-slate-400" />
            Reviewed by <span className="font-semibold text-slate-700">{lawyer_name}</span>
          </span>
        )}
        {last_saved_at && (
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            Last updated {new Date(last_saved_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Checklist by category */}
      {CATEGORIES.map(category => (
        <div key={category}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Shield size={10} className="text-[#1B3A6B]" />
            {category}
          </p>
          <div className="space-y-1.5">
            {COMPLIANCE_ITEMS.filter(i => i.category === category).map(item => {
              const done = !!checklist[item.id]
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs ${
                    done
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}
                >
                  {done
                    ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    : <XCircle size={14} className="text-slate-300 shrink-0" />}
                  <span className={done ? 'font-medium' : ''}>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Notes */}
      {notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Lawyer Notes</p>
          <p className="text-xs text-blue-800 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}
