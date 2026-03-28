const REAL_WORLD_STEPS = [
  {
    module: 'Grow CRM',
    description: 'New client "John Smith" added.',
    detail: 'Contact available in both Grow Trust and Grow Settlement',
  },
  {
    module: 'Grow Settlement',
    description: 'Matter created.',
    detail: 'Links to John Smith contact from CRM',
  },
  {
    module: 'Grow Trust',
    description: 'Deposit recorded.',
    detail: 'Linked to settlement matter and John Smith contact',
  },
  {
    module: 'Grow Documents',
    description: 'Contract of Sale, Section 32, and bank cheques uploaded.',
    detail: 'Tagged to matter, accessible in both modules',
  },
  {
    module: 'Grow Time & Workflow',
    description: 'Lawyer logs 2.5 hours.',
    detail: 'Time tracked, ready for automated billing',
  },
  {
    module: 'Grow Documents',
    description: 'Settlement statement generated.',
    detail: 'Auto-populated with trust transactions and time costs',
  },
  {
    module: 'Grow Time & Workflow',
    description: 'Invoice generated.',
    detail: 'Includes time costs, disbursements, and trust charges',
  },
  {
    module: 'Grow CRM',
    description: 'Settlement completed, relationship status updated.',
    detail: 'Contact flagged for follow-up',
  },
]

const BENEFITS = [
  'Zero Data Re-Entry',
  'Complete Audit Trail',
  'Automated Billing',
  'Cross-Sell Opportunity',
  'Unified Search',
]

export default function RealWorldExample() {
  return (
    <div
      className="border border-green-200 rounded-lg p-6 mb-8"
      style={{ backgroundColor: '#F0FDF4' }}
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">🌍</span>
        <h2 className="text-lg font-semibold text-slate-900">Real-World Integration Example</h2>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
        <h3 className="text-base font-semibold text-slate-900 mb-2">
          Scenario: Law Firm Using Grow Trust + Grow Settlement + All Add-Ons
        </h3>
      </div>

      <div className="space-y-3">
        {REAL_WORLD_STEPS.map((step, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{step.module}</p>
              <p className="text-sm text-slate-700">{step.description}</p>
              <p className="text-xs text-slate-600 italic mt-0.5">Example: {step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-green-300">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Benefits Realized</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
          {BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
