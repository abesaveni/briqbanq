import { useNavigate } from "react-router-dom";
import { Menu, Bell, ChevronDown, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export default function Header({ setIsOpen, basePath = "/investor" }) {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const roles = [
    { label: "Borrower", icon: "👤", to: "/borrower/dashboard" },
    { label: "Lender", icon: "🏢", active: true, to: "/lender/dashboard" },
    { label: "Investor", icon: "💼", to: "/investor/dashboard" },
    { label: "Admin", icon: "⚙️" },
    { label: "Lawyer", icon: "⚖️" },
    { label: "Receiver", icon: "📋" },
    { label: "Credit", icon: "💳" },
    { label: "Super Admin", icon: "🦸" },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-white shadow-sm sticky top-0 z-30">
      {/* Left - Menu (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-gray-600" />
        </button>
      </div>

      {/* Right - Notifications & user */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleOpen(!isRoleOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-lg text-[11px] font-bold text-[#4338CA] hover:bg-[#E0E7FF] transition-colors"
          >
            <Briefcase size={14} />
            <span className="hidden sm:inline">Lender</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isRoleOpen ? 'rotate-180' : ''}`} />
          </button>
          {isRoleOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 overflow-hidden">
              {roles.map((role) => (
                <button
                  key={role.label}
                  onClick={() => {
                    setIsRoleOpen(false);
                    if (role.to) navigate(role.to);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-bold text-left transition-colors ${role.active ? "bg-[#3B82F6] text-white" : "text-[#475569] hover:bg-gray-50"}`}
                >
                  <span className="text-sm shrink-0">{role.icon}</span>
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(`${basePath}/notifications`)}
          className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors group hidden sm:block"
          aria-label="Notifications"
        >
          <Bell size={19} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
          )}
        </button>
        <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />
        <button className="flex items-center gap-2 px-1.5 py-1 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-100">
            {user?.name?.charAt(0) || "D"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user?.name || "David Williams"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
