import { NavLink } from "react-router-dom";
import {
  Home,
  Gavel,
  FileText,
  Shield,
  Bell,
  Settings,
  LogOut,
  Briefcase,
  BarChart,
  Folder,
} from "lucide-react";
import AppLogo from "../common/AppLogo";

const navLinks = [
  { to: "/investor/dashboard", icon: Home, label: "Dashboard" },
  { to: "/investor/deals", icon: Briefcase, label: "All Deals" },
  { to: "/investor/auctions", icon: Gavel, label: "Auctions" },
  { to: "/investor/contracts", icon: FileText, label: "Contracts" },
  { to: "/investor/escrow", icon: Shield, label: "Escrow" },
  { to: "/investor/reports", icon: BarChart, label: "Reports" },
  { to: "/investor/documents", icon: Folder, label: "Documents" },
  { to: "/investor/notifications", icon: Bell, label: "Notifications" },
  { to: "/investor/settings", icon: Settings, label: "Settings" },
];

export default function InvestorSidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full bg-gray-900 text-white w-64 transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 transition-transform duration-300 z-50 flex flex-col border-r border-gray-800`}
      >
        <div className="px-4 py-4 border-b border-gray-800 flex-shrink-0">
          <AppLogo />
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-tight text-xs">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="leading-tight text-xs">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
