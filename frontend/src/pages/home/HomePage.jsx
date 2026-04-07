import { Link } from "react-router-dom";
import {
  Building2, TrendingUp, Scale, Shield, Briefcase,
  ArrowRight, CheckCircle, ChevronRight, Gavel,
  FileCheck, Users, BarChart3, Clock, CircleDot
} from "lucide-react";

const ROLES = [
  {
    icon: Building2,
    label: "Borrowers",
    desc: "Submit your case, track progress, and work toward resolution with full transparency.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-600",
  },
  {
    icon: Briefcase,
    label: "Lenders",
    desc: "Manage your loan portfolio, monitor defaults, and participate in live recovery auctions.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-600",
  },
  {
    icon: TrendingUp,
    label: "Investors",
    desc: "Bid on distressed assets, review investment memoranda, and track your portfolio returns.",
    color: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-600",
  },
  {
    icon: Scale,
    label: "Lawyers",
    desc: "Access assigned cases, review documents, complete KYC checks, and manage contracts.",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-600",
  },
];

const STATS = [
  { value: "250+", label: "Cases Resolved" },
  { value: "$2.4B", label: "Assets Managed" },
  { value: "98%", label: "Settlement Rate" },
  { value: "48hr", label: "Avg. Response Time" },
];

const FEATURES = [
  "Live auction bidding with real-time countdown",
  "KYC & document verification built-in",
  "Automated email notifications for all parties",
  "Role-based dashboards for every stakeholder",
  "Secure escrow and contract management",
  "Regulatory-compliant audit trail",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-[#1B3A6B] tracking-tight">BriqBanq</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/signin"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#1B3A6B] transition-colors rounded-lg hover:bg-slate-50"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold bg-[#1B3A6B] text-white rounded-lg hover:bg-[#142d55] transition-colors shadow-md"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0C1E3C]">
        {/* Background image */}
        {/* Background pattern */}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1E3C] via-[#0C1E3C]/90 to-[#0C1E3C]/60" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 md:py-36 lg:py-44">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Australian Mortgage Resolution Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
              Resolving mortgages.<br />
              <span className="text-[#5B9BD5]">Protecting assets.</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-lg">
              A unified platform for borrowers, lenders, investors, and lawyers to manage distressed property loans with transparency and speed.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-4 text-sm font-bold bg-[#5B9BD5] hover:bg-[#4a87c0] text-white rounded-xl transition-colors shadow-xl"
              >
                Create your account
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-7 py-4 text-sm font-bold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs font-medium text-white/50 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#1B3A6B] uppercase tracking-widest mb-3">Built for every stakeholder</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              One platform, four roles
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Each role gets a tailored dashboard and the tools they need — nothing more, nothing less.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map(({ icon: Icon, label, desc, color, dot }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${color} mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES + IMAGE ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold text-[#1B3A6B] uppercase tracking-widest mb-3">Enterprise-grade infrastructure</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                Everything you need to resolve a mortgage
              </h2>
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#1B3A6B] mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold bg-[#1B3A6B] text-white rounded-xl hover:bg-[#142d55] transition-colors shadow-md"
              >
                Start now <ChevronRight size={16} />
              </Link>
            </div>
            {/* Platform dashboard illustration */}
            <div className="bg-[#0C1E3C] rounded-2xl shadow-2xl p-5 space-y-4">
              {/* Header bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#5B9BD5] rounded-md flex items-center justify-center">
                    <Building2 size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">BriqBanq Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white/50">Live</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Gavel, label: "Active Auctions", value: "12", color: "bg-violet-500/20 text-violet-300" },
                  { icon: FileCheck, label: "Cases Open", value: "47", color: "bg-blue-500/20 text-blue-300" },
                  { icon: Users, label: "Stakeholders", value: "230", color: "bg-emerald-500/20 text-emerald-300" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <p className="text-lg font-extrabold text-white">{value}</p>
                    <p className="text-[10px] text-white/40 leading-tight mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Case pipeline */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/70">Case Pipeline</span>
                  <BarChart3 size={14} className="text-white/30" />
                </div>
                <div className="space-y-2.5">
                  {[
                    { stage: "Assessment", pct: 85, color: "bg-blue-400" },
                    { stage: "Auction", pct: 60, color: "bg-violet-400" },
                    { stage: "Settlement", pct: 40, color: "bg-emerald-400" },
                  ].map(({ stage, pct, color }) => (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-[11px] text-white/50 w-20 shrink-0">{stage}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-white/40 w-6 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/70">Recent Activity</span>
                  <Clock size={14} className="text-white/30" />
                </div>
                <div className="space-y-2.5">
                  {[
                    { dot: "bg-emerald-400", text: "Auction #A-1042 closed", time: "2m ago" },
                    { dot: "bg-blue-400", text: "KYC approved · Case #C-389", time: "14m ago" },
                    { dot: "bg-violet-400", text: "New bid — $1.2M on #A-1041", time: "31m ago" },
                  ].map(({ dot, text, time }, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CircleDot size={12} className={`${dot === "bg-emerald-400" ? "text-emerald-400" : dot === "bg-blue-400" ? "text-blue-400" : "text-violet-400"} shrink-0`} />
                      <span className="text-[11px] text-white/60 flex-1 truncate">{text}</span>
                      <span className="text-[10px] text-white/30 shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-[#0C1E3C]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Ready to manage your mortgage case?
          </h2>
          <p className="text-white/60 mb-10 max-w-lg mx-auto">
            Join hundreds of borrowers, lenders, and investors who are resolving mortgage cases faster on BriqBanq.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 text-sm font-bold bg-[#5B9BD5] hover:bg-[#4a87c0] text-white rounded-xl transition-colors shadow-xl"
            >
              Create free account
            </Link>
            <Link
              to="/signin"
              className="px-8 py-4 text-sm font-bold text-white border border-white/25 rounded-xl hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#5B9BD5] rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">BriqBanq</span>
            <span className="text-white/30 text-sm">· Mortgage Resolution Platform</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/signin" className="hover:text-white/70 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-white/70 transition-colors">Sign Up</Link>
            <span>© {new Date().getFullYear()} BriqBanq. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
