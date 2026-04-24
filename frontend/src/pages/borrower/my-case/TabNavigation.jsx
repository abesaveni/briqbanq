import { Home, Building2, FileText, FileCheck, Handshake, DollarSign, MessageSquare, Activity } from 'lucide-react'

const tabs = [
  { id: 'overview',       label: 'Overview',   icon: Home },
  { id: 'property',       label: 'Property',   icon: Building2 },
  { id: 'documents',      label: 'Documents',  icon: FileText },
  { id: 'investment-memo',label: 'Inv. Memo',  icon: FileCheck },
  { id: 'settlement',     label: 'Settlement', icon: Handshake },
  { id: 'bids',           label: 'Bids',       icon: DollarSign },
  { id: 'messages',       label: 'Messages',   icon: MessageSquare },
  { id: 'activity',       label: 'Activity',   icon: Activity },
]

export default function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <nav className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
