import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Briefcase,
    Gavel,
    FileText,
    Shield,
    ClipboardList,
    ChevronDown,
    Bell,
    Settings,
    MoreHorizontal,
    Menu,
    X,
    Folder,
    BarChart2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function InvestorHeader() {
    const { user, switchRole, getProfile } = useAuth();
    const profile = getProfile("investor");
    const navigate = useNavigate();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isPlatformOpen, setIsPlatformOpen] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const navLinks = [
        { to: "/investor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/investor/deals", icon: Briefcase, label: "All Deals" },
        { to: "/investor/auctions", icon: Gavel, label: "Auctions" },
    ];

    const moreLinks = [
        { to: "/investor/contracts", icon: FileText, label: "Contracts" },
        { to: "/investor/escrow", icon: Shield, label: "Escrow" },
        { to: "/investor/tasks", icon: ClipboardList, label: "Tasks" },
        { to: "/investor/reports", icon: BarChart2, label: "Reports" },
        { to: "/investor/documents", icon: Folder, label: "Documents" },
        { to: "/investor/notifications", icon: Bell, label: "Notifications" },
        { to: "/investor/settings", icon: Settings, label: "Settings" },
    ];

    const roles = [
        { label: "Borrower", icon: "👤", to: "/borrower/dashboard" },
        { label: "Lender", icon: "🏢", to: "/lender/dashboard" },
        { label: "Investor", icon: "💼", active: true, to: "/investor/dashboard" },
        { label: "Admin", icon: "⚙️" },
        { label: "Lawyer", icon: "⚖️" },
        { label: "Receiver", icon: "📋" },
        { label: "Credit", icon: "💳" },
        { label: "Super Admin", icon: "🦸" },
    ];

    return (
        <header className="sticky top-0 w-full h-14 bg-white border-b border-gray-100 z-50 shadow-sm">
            <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between w-full h-full gap-4">
                {/* Left - Logo & Mobile Menu Toggle */}
                <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate("/")}>
                        <div className="w-7 h-7 flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/28?text=B" }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base text-[#0F172A] leading-none">Brickbanq</span>
                            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider hidden sm:block">MIP Platform</span>
                        </div>
                    </div>

                    {/* Navigation Desktop */}
                    <nav className="hidden lg:flex items-center gap-0.5">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${isActive
                                            ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-100"
                                            : "text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]"
                                        }`
                                    }
                                >
                                    <Icon size={14} />
                                    <span>{link.label}</span>
                                </NavLink>
                            );
                        })}

                        {/* More Dropdown */}
                        <div className="relative ml-1">
                            <button
                                onClick={() => setIsMoreOpen(!isMoreOpen)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]"
                            >
                                <MoreHorizontal size={14} />
                                <span>More</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMoreOpen && (
                                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                                    {moreLinks.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <button
                                                key={link.to}
                                                onClick={() => { navigate(link.to); setIsMoreOpen(false); }}
                                                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-[#475569] hover:bg-gray-50 transition-colors"
                                            >
                                                <Icon size={14} className="text-gray-400" />
                                                <span>{link.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Right - Platform, Role, Profile */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Platform Switcher */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setIsPlatformOpen(!isPlatformOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-100 rounded-lg text-[11px] font-semibold text-[#475569] hover:bg-gray-50 transition-colors"
                        >
                            <span>Brickbanq Platform</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${isPlatformOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Role Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsRoleOpen(!isRoleOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-lg text-[11px] font-bold text-[#4338CA] hover:bg-[#E0E7FF] transition-colors"
                        >
                            <Briefcase size={14} />
                            <span className="hidden sm:inline">Investor</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${isRoleOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isRoleOpen && (
                            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 overflow-hidden">
                                {roles.map((role) => (
                                    <button
                                        key={role.label}
                                        onClick={() => {
                                            setIsRoleOpen(false);
                                            if (role.to) {
                                                switchRole(role.label);
                                                navigate(role.to);
                                            }
                                        }}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-bold text-left transition-colors ${role.active ? "bg-[#3B82F6] text-white" : "text-[#475569] hover:bg-gray-50"
                                            }`}
                                    >
                                        <span className="text-sm shrink-0">{role.icon}</span>
                                        <span>{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bell Icon & Notifications Dropdown */}
                    <div className="relative hidden sm:block">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`relative p-1.5 transition-colors rounded-lg ${isNotificationsOpen ? 'text-[#4F46E5] bg-indigo-50' : 'text-gray-400 hover:text-[#4F46E5] hover:bg-gray-50'}`}
                        >
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                    <span className="text-[13px] font-bold text-[#0F172A]">Notifications</span>
                                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Mark all as read</button>
                                </div>
                                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                                    {[
                                        { id: 1, title: "Bid Outbid", desc: "You have been outbid on 7 Park Lane...", time: "2 mins ago", unread: true },
                                        { id: 2, title: "Contract Ready", desc: "The contract for 12 George St is ready for signing.", time: "1 hour ago", unread: true },
                                        { id: 3, title: "KYC Approved", desc: "Your identity verification has been successful.", time: "3 hours ago", unread: false },
                                        { id: 4, title: "New Deal Alert", desc: "A new commercial deal in South Yarra just opened.", time: "5 hours ago", unread: false },
                                    ].map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => { setIsNotificationsOpen(false); navigate("/investor/notifications"); }}
                                            className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 group"
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.unread ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className="text-xs font-bold text-[#1E293B] group-hover:text-indigo-600 transition-colors">{notif.title}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{notif.time}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium line-clamp-2">{notif.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => { setIsNotificationsOpen(false); navigate("/investor/notifications"); }}
                                    className="w-full py-3 text-[11px] font-bold text-[#475569] hover:bg-gray-50 hover:text-[#0F172A] transition-colors border-t border-gray-100 flex items-center justify-center gap-1.5"
                                >
                                    View All Notifications
                                    <ChevronDown size={12} className="-rotate-90" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Settings Icon */}
                    <button
                        onClick={() => navigate("/investor/settings")}
                        className="p-1.5 text-gray-400 hover:text-[#4F46E5] hover:bg-gray-50 rounded-lg transition-colors hidden sm:block"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>

                    {/* Profile */}
                    <div className="flex items-center gap-2 pl-1 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/investor/settings")}>
                        <div className="text-right hidden md:block max-w-[120px]">
                            <div className="text-xs font-bold text-[#0F172A] leading-none truncate">
                                {profile?.name ||
                                    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : null) ||
                                    user?.name ||
                                    "User"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold mt-0.5">Investor</div>
                        </div>
                        <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-indigo-50 overflow-hidden">
                            {profile?.photo || user?.photo ? (
                                <img
                                    src={profile.photo || user?.photo}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (profile?.firstName ? profile.firstName[0] + (profile.lastName?.[0] || '') : null) ||
                                (profile?.name ? profile.name.split(' ').map(n => n[0]).join('') : null) ||
                                (user?.name ? user.name.split(' ').map(n => n[0]).join('') : null) ||
                                "U"
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg lg:hidden px-4 py-4 space-y-2 z-40 max-h-[80vh] overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                                        ? "bg-[#EEF2FF] text-[#4F46E5]"
                                        : "text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]"
                                    }`
                                }
                            >
                                <Icon size={18} />
                                <span>{link.label}</span>
                            </NavLink>
                        );
                    })}
                    <div className="h-px bg-gray-100 my-2" />
                    <button
                        onClick={() => { navigate("/investor/notifications"); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-gray-50 transition-all w-full text-left"
                    >
                        <Bell size={18} />
                        <span>Notifications</span>
                    </button>
                    <button
                        onClick={() => { navigate("/investor/settings"); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-gray-50 transition-all w-full text-left"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            )}
        </header>
    );
}
