export default function InvestmentTerms({ terms = {} }) {
  const keyTerms = terms.keyTerms || {}
  const process = terms.process || []
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Investment Terms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Key Terms</h3>
          <div className="space-y-3">
            {keyTerms.minimumInvestment != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Minimum Investment</p>
                <p className="text-sm text-slate-900">{keyTerms.minimumInvestment}</p>
              </div>
            )}
            {keyTerms.interestRate != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Interest Rate</p>
                <p className="text-sm text-slate-900">{keyTerms.interestRate}</p>
              </div>
            )}
            {keyTerms.interestPayments != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Interest Payments</p>
                <p className="text-sm text-slate-900">{keyTerms.interestPayments}</p>
              </div>
            )}
            {keyTerms.loanTerm != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Loan Term</p>
                <p className="text-sm text-slate-900">{keyTerms.loanTerm}</p>
              </div>
            )}
            {keyTerms.security != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Security</p>
                <p className="text-sm text-slate-900">{keyTerms.security}</p>
              </div>
            )}
            {keyTerms.settlement != null && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Settlement</p>
                <p className="text-sm text-slate-900">{keyTerms.settlement}</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-4">Process</h3>
          <div className="space-y-4">
            {process.map((step, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step ?? i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  {step.description && (
                    <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
