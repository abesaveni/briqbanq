import { Gavel, Home, Briefcase, FileText, History, Scale } from "lucide-react";
import PropTypes from 'prop-types';

const TABS = [
  { id: "overview", label: "Overview", icon: Gavel },
  { id: "property", label: "Property", icon: Home },
  { id: "memorandum", label: "Investment Memo", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "bid-history", label: "Bid History", icon: History },
  { id: "lawyer-review", label: "Lawyer Review", icon: Scale },
];

export default function AuctionTabs({ activeTab, setActiveTab }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
      <div className="flex min-w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

AuctionTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};
