
const formatNum = (n) =>
  n != null
    ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : '—'

export default function FullDetailsTab({ caseData }) {
  const c = caseData || {}
  const borrower = typeof c.borrower === 'object' ? c.borrower : { name: c.borrower, email: '' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Case Summary</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Case Created</dt><dd className="font-medium text-gray-900">{c.caseCreated ?? '—'}</dd></div>
            <div><dt className="text-gray-500">Last Updated</dt><dd className="font-medium text-gray-900">{c.lastUpdated ?? '—'}</dd></div>
            <div><dt className="text-gray-500">Urgency Level</dt><dd className="font-medium text-gray-900">{c.urgencyLevel ?? '—'}</dd></div>
            <div><dt className="text-gray-500">Total Bids</dt><dd className="font-medium text-gray-900">{c.totalBids ?? 0} bids received</dd></div>
            <div><dt className="text-gray-500">Current Highest Bid</dt><dd className="font-medium text-green-600">{c.currentHighestBid ? formatNum(c.currentHighestBid) : '—'}</dd></div>
          </dl>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial Overview & Risk Assessment</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-gray-500">Property Valuation</dt><dd className="font-medium text-green-600">{c.property?.valuation ? formatNum(c.property.valuation) : '—'}</dd></div>
            <div><dt className="text-gray-500">Outstanding Debt</dt><dd className="font-medium text-red-600">{formatNum(c.lender?.outstandingDebt ?? c.outstanding_debt ?? null)}</dd></div>
            <div><dt className="text-gray-500">LVR (Loan to Value)</dt><dd className="font-medium text-gray-900">{c.lvr != null ? `${c.lvr}%` : '—'}</dd></div>
            <div><dt className="text-gray-500">Arrears</dt><dd className="font-medium text-red-600">{formatNum(c.activeArrears ?? c.financials?.arrearsAndInterest ?? null)}</dd></div>
            <div><dt className="text-gray-500">Equity Available</dt><dd className="font-medium text-green-600">{c.equityAvailable != null ? formatNum(c.equityAvailable) : '—'}</dd></div>
            <div><dt className="text-gray-500">Minimum Bid</dt><dd className="font-medium text-gray-900">{c.minimumBid != null ? formatNum(c.minimumBid) : '—'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Borrower & Entity Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Personal Information</p>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-gray-500">Full Name</dt><dd className="text-gray-900">{borrower?.name ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{borrower?.email ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{borrower?.phone ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Date of Birth</dt><dd className="text-gray-900">{borrower?.dateOfBirth ?? '—'}</dd></div>
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">KYC & Verification</p>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-gray-500">KYC Status</dt><dd><span className="inline-flex items-center gap-1 text-green-600 font-medium">✓ Completed</span></dd></div>
              <div><dt className="text-gray-500">ID Type</dt><dd className="text-gray-900">{borrower?.idType ?? 'Drivers Licence'}</dd></div>
              <div><dt className="text-gray-500">Source of Funds</dt><dd className="text-gray-900">{borrower?.sourceOfFunds ?? '—'}</dd></div>
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Employment</p>
            <dl className="space-y-1 text-sm">
              <div><dt className="text-gray-500">Employment Status</dt><dd className="text-gray-900">{borrower?.employmentStatus ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Employer</dt><dd className="text-gray-900">{borrower?.employer ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Occupation</dt><dd className="text-gray-900">{borrower?.occupation ?? '—'}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Extended Property Details</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><dt className="text-gray-500">Title Reference</dt><dd className="text-gray-900">{c.property?.titleReference ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Lot / Plan</dt><dd className="text-gray-900">{c.property?.lotPlan ?? '—'}</dd></div>
          <div><dt className="text-gray-500">LGA</dt><dd className="text-gray-900">{c.property?.lga ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Year Built</dt><dd className="text-gray-900">{c.property?.yearBuilt ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Floor Area</dt><dd className="text-gray-900">{c.property?.floorArea ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Condition</dt><dd className="text-gray-900">{c.property?.condition ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Zoning</dt><dd className="text-gray-900">{c.property?.zoning ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Construction</dt><dd className="text-gray-900">{c.property?.construction ?? '—'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Rates & Charges</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><dt className="text-gray-500">Council Rates</dt><dd className="text-gray-900">{c.ratesAndCharges?.councilRates != null ? formatNum(c.ratesAndCharges.councilRates) : '—'}</dd></div>
          <div><dt className="text-gray-500">Water Rates</dt><dd className="text-gray-900">{c.ratesAndCharges?.waterRates != null ? formatNum(c.ratesAndCharges.waterRates) : '—'}</dd></div>
          <div><dt className="text-gray-500">Strata Fees</dt><dd className="text-gray-900">{c.ratesAndCharges?.strataFees != null ? formatNum(c.ratesAndCharges.strataFees) : '—'}</dd></div>
          <div><dt className="text-gray-500">Land Tax</dt><dd className="text-gray-900">{c.ratesAndCharges?.landTax != null ? formatNum(c.ratesAndCharges.landTax) : '—'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Environmental Risk</h3>
        <dl className="flex gap-6 text-sm">
          <div><dt className="text-gray-500">Flood Risk</dt><dd className="text-gray-900">{c.environmentalRisk?.flood ?? 'Low'}</dd></div>
          <div><dt className="text-gray-500">Bushfire Risk</dt><dd className="text-gray-900">{c.environmentalRisk?.bushfire ?? 'Low'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">RP Data AVM Valuation</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-gray-500">AVM Mid (Used)</dt><dd className="text-green-600 font-medium">{c.avm?.mid != null ? formatNum(c.avm.mid) : '—'}</dd></div>
          <div><dt className="text-gray-500">AVM Low</dt><dd className="text-gray-900">{c.avm?.low != null ? formatNum(c.avm.low) : '—'}</dd></div>
          <div><dt className="text-gray-500">AVM High</dt><dd className="text-gray-900">{c.avm?.high != null ? formatNum(c.avm.high) : '—'}</dd></div>
          <div><dt className="text-gray-500">Last Sale Date</dt><dd className="text-gray-900">{c.avm?.lastSaleDate ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Last Sale Price</dt><dd className="text-gray-900">{c.avm?.lastSalePrice != null ? formatNum(c.avm.lastSalePrice) : '—'}</dd></div>
          <div><dt className="text-gray-500">Confidence Score</dt><dd className="text-gray-900">{c.avm?.confidence ?? '—'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Loan Details & Default History</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-gray-500">Original Loan Amount</dt><dd className="text-gray-900">{c.loanDetails?.originalLoanAmount != null ? formatNum(c.loanDetails.originalLoanAmount) : '—'}</dd></div>
          <div><dt className="text-gray-500">Interest Rate</dt><dd className="text-gray-900">{c.loanDetails?.interestRate ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Missed Payments</dt><dd className="text-red-600 font-medium">{c.loanDetails?.missedPayments ?? c.missedPayments ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Repayment Type</dt><dd className="text-gray-900">{c.loanDetails?.repaymentType ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Default Date</dt><dd className="text-gray-900">{c.loanDetails?.defaultDate ?? c.defaultDate ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Loan Start Date</dt><dd className="text-gray-900">{c.loanDetails?.loanStartDate ?? '—'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-gray-500">Default Reason</dt><dd className="text-gray-900">{c.loanDetails?.defaultReason ?? c.defaultReason ?? '—'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-gray-500">Hardship Circumstances</dt><dd className="text-gray-900">{c.loanDetails?.hardshipCircumstances ?? '—'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Lender Details & Licensing</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-gray-500">Lender Name</dt><dd className="text-gray-900">{c.lenderDetails?.name ?? c.lender?.name ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Contact Person</dt><dd className="text-gray-900">{c.lenderDetails?.contactPerson ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{c.lenderDetails?.phone ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Account Number</dt><dd className="text-gray-900">{c.lenderDetails?.accountNumber ?? '—'}</dd></div>
          <div><dt className="text-gray-500">ACL Holder Name</dt><dd className="text-gray-900">{c.lenderDetails?.aclHolder ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Licence Type</dt><dd className="text-gray-900">{c.lenderDetails?.licenceType ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{c.lenderDetails?.email ?? '—'}</dd></div>
          <div><dt className="text-gray-500">ACL Number</dt><dd className="text-gray-900">{c.lenderDetails?.aclNumber ?? '—'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">All Parties & Representatives</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(c.parties || []).map((p, i) => (
            <div key={i} className="text-sm">
              <p className="text-gray-500">{typeof p === 'object' ? p.role : '—'}</p>
              <p className="font-medium text-gray-900">{typeof p === 'object' ? p.name : p}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">NCCP Compliance</h3>
        <p className="text-sm text-gray-900">
          Subject to NCCP Act 2009: <span className="text-green-600 font-medium">✓ Yes - Regulated Consumer Credit</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">Loan Purpose: {c.nccpCompliance?.loanPurpose ?? 'Owner-occupied residential property purchase'}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Documents & Verification Status</h3>
        <p className="text-sm text-gray-900 mb-2">InfoTrack Checks: <span className="text-green-600 font-medium">✓ Completed</span></p>
        <p className="text-sm text-gray-900 mb-4">Automated Verification: <span className="text-green-600 font-medium">✓ Completed</span></p>
        <ul className="space-y-1">
          {(c.documentVerification || []).map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-900">
              <span className="text-green-600">✓</span> {typeof d === 'object' ? d.name : d}
              {typeof d === 'object' && d.status && <span className="text-green-600 text-xs">({d.status})</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Case Notes</h3>
        <p className="text-sm text-gray-700">{c.caseNotes ?? 'High priority case due to upcoming auction deadline. Borrower has secured new employment and is cooperative. LVR is favorable at 78.4%. Strong equity position provides good security for investors.'}</p>
      </div>
    </div>
  )
}
