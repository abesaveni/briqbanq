import { Gavel, Briefcase } from "lucide-react";
import PropTypes from 'prop-types';

/**
 * AuctionTabs: A premium pill-switcher for navigating auction sections.
 */
export default function AuctionTabs({ activeTab, setActiveTab }) {
  return (
    <div className="bg-gray-100/60 p-1 rounded-2xl flex w-full">
      <button
        onClick={() => setActiveTab("live")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs transition-all ${activeTab === "live"
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
          }`}
      >
        <Gavel size={16} className={activeTab === "live" ? "text-gray-900" : "text-gray-400"} />
        Live Auction
      </button>
      <button
        onClick={() => setActiveTab("memorandum")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs transition-all ${activeTab === "memorandum"
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
          }`}
      >
        <Briefcase size={16} className={activeTab === "memorandum" ? "text-gray-900" : "text-gray-400"} />
        Investment Memorandum
      </button>
    </div>
  );
}

AuctionTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired
};

