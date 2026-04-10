import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SIGNIN_ROLES, getDashboardPath } from "./authConfig";
import api from "../../services/api";
import { validateEmail } from "../../utils/auValidation";
import {
  Building2, Home, TrendingUp, Briefcase, Scale, Shield, ArrowRight, CheckCircle
} from "lucide-react";


const ROLE_META = {
  borrower: { icon: Home,       label: "Borrower",  desc: "Submit & track your case",        activeBg: "bg-blue-600",   border: "border-blue-200",   text: "text-blue-700" },
  lender:   { icon: Briefcase,  label: "Lender",    desc: "Portfolio & recovery management",  activeBg: "bg-indigo-600", border: "border-indigo-200", text: "text-indigo-700" },
  investor: { icon: TrendingUp, label: "Investor",  desc: "Auctions & investment returns",    activeBg: "bg-violet-600", border: "border-violet-200", text: "text-violet-700" },
  lawyer:   { icon: Scale,      label: "Lawyer",    desc: "Case review & KYC",                activeBg: "bg-amber-600",  border: "border-amber-200",  text: "text-amber-700" },
  admin:    { icon: Shield,     label: "Admin",     desc: "Platform control",                 activeBg: "bg-rose-600",   border: "border-rose-200",   text: "text-rose-700" },
};

// ── Shared input style ──────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 outline-none transition text-sm";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // "signin" | "forgot-email" | "forgot-otp" | "forgot-done"
  const [step, setStep] = useState("signin");

  // ── Sign-in state ──────────────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState("lender");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Forgot-password state ──────────────────────────────────────────────────
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const emailErr = validateEmail(email.trim());
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/v1/identity/login", {
        email: email.trim(),
        password,
      });
      const { access_token } = res.data;

      // Verify selected role matches actual account role
      const meRes = await api.get("/api/v1/identity/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = meRes.data;

      const roles = userData.user_roles ?? [];
      const hasSelectedRole = roles.some(
        (r) =>
          (r.status === "APPROVED" || r.status === "approved") &&
          r.role_type?.toLowerCase() === selectedRole
      );

      if (roles.length > 0 && !hasSelectedRole) {
        const labelMap = { borrower: "Borrower", lender: "Lender", investor: "Investor", lawyer: "Lawyer", admin: "Admin" };
        const approvedRoles = roles
          .filter((r) => r.status === "APPROVED" || r.status === "approved")
          .map((r) => labelMap[r.role_type?.toLowerCase()] || r.role_type);
        const roleList = approvedRoles.length > 0 ? approvedRoles.join(" or ") : "another";
        setError(
          `This account does not have the ${labelMap[selectedRole] || selectedRole} role. ` +
          `Please select "${roleList}" above and try again.`
        );
        return;
      }

      login(access_token, userData, selectedRole);
      navigate(getDashboardPath(selectedRole), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Invalid email or password.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    const emailErr = validateEmail(fpEmail.trim());
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    try {
      await api.post("/api/v1/identity/forgot-password", { email: fpEmail.trim() });
      setStep("forgot-otp");
      startCooldown();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to send reset code.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/identity/forgot-password", { email: fpEmail.trim() });
      setFpOtp("");
      startCooldown();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to resend code.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!fpOtp.trim() || fpOtp.length < 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }
    if (!fpNewPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (fpNewPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/identity/reset-password", {
        email: fpEmail.trim(),
        otp: fpOtp.trim(),
        new_password: fpNewPassword,
      });
      setStep("forgot-done");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Invalid or expired code.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const resetToSignIn = () => {
    setStep("signin");
    setError("");
    setFpEmail("");
    setFpOtp("");
    setFpNewPassword("");
    setFpConfirmPassword("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-[#0C1E3C] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C1E3C] via-[#0C1E3C]/95 to-[#0C1E3C]/80" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#5B9BD5] rounded-xl flex items-center justify-center shadow-lg">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">BriqBanq</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Australian Mortgage Resolution</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-4 tracking-tight">
            Resolve mortgages.<br />
            <span className="text-[#5B9BD5]">Protect your assets.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            A unified platform connecting borrowers, lenders, investors and lawyers
            to manage distressed property loans with full transparency.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {[
              { label: "AFCA Compliant", sub: "Regulatory standards met" },
              { label: "Bank-grade security", sub: "AES-256 encrypted data" },
              { label: "98% Settlement rate", sub: "Across 250+ resolved cases" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#5B9BD5] rounded-full shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white">{b.label}</span>
                  <span className="text-xs text-white/40 ml-2">{b.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} BriqBanq. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col min-h-screen overflow-y-auto">
        <header className="lg:hidden border-b border-slate-100 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-lg font-bold text-[#1B3A6B] tracking-tight">BriqBanq</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* ── SIGN IN ── */}
            {step === "signin" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Welcome back</h1>
                  <p className="text-slate-500 text-sm">Select your role and sign in to your dashboard.</p>
                </div>

                {/* Role selector */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">I am signing in as</p>
                  <div className="grid grid-cols-5 gap-2">
                    {SIGNIN_ROLES.map(({ value, disabled }) => {
                      const meta = ROLE_META[value];
                      if (!meta) return null;
                      const Icon = meta.icon;
                      const isActive = selectedRole === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedRole(value)}
                          title={disabled ? 'Borrower sign-in is currently unavailable' : meta.label}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 ${
                            disabled
                              ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                              : isActive
                              ? `${meta.activeBg} text-white border-transparent shadow-md`
                              : `bg-white ${meta.text} ${meta.border} hover:bg-slate-50`
                          }`}
                        >
                          <Icon size={17} />
                          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedRole && (
                    <p className="mt-2 text-xs text-slate-400 text-center">{ROLE_META[selectedRole]?.desc}</p>
                  )}
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                  )}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com.au" autoComplete="email"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => { setError(""); setFpEmail(email); setStep("forgot-email"); }}
                        className="text-xs text-[#1B3A6B] hover:text-[#142d55] font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="password" type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? "Signing in…" : <><span>Sign in as {ROLE_META[selectedRole]?.label}</span><ArrowRight size={15} /></>}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link to="/signup" className="text-[#1B3A6B] hover:text-[#142d55] font-semibold">Create account</Link>
                </p>
              </>
            )}

            {/* ── FORGOT — enter email ── */}
            {step === "forgot-email" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Reset your password</h1>
                  <p className="text-slate-500 text-sm">
                    Enter your registered email address and we'll send you a 6-digit reset code.
                  </p>
                </div>

                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                  )}
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                    <input
                      id="fp-email" type="email" value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      placeholder="you@example.com.au" autoComplete="email"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending…" : <><span>Send reset code</span><ArrowRight size={15} /></>}
                  </button>
                </form>

                <button
                  type="button" onClick={resetToSignIn}
                  className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Back to sign in
                </button>
              </>
            )}

            {/* ── FORGOT — verify OTP + new password ── */}
            {step === "forgot-otp" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Enter reset code</h1>
                  <p className="text-slate-500 text-sm">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-slate-700">{fpEmail}</span>.
                    Enter it below along with your new password.
                  </p>
                </div>

                <form onSubmit={handleForgotReset} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                  )}

                  <div>
                    <label htmlFor="fp-otp" className="block text-sm font-semibold text-slate-700 mb-2">Verification code</label>
                    <input
                      id="fp-otp" type="text" value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000" maxLength={6} autoComplete="one-time-code"
                      className="w-full px-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-center text-3xl tracking-[0.5em] placeholder-slate-300 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 outline-none transition font-mono"
                    />
                    {/* Resend */}
                    <p className="mt-2 text-xs text-slate-400 text-right">
                      Didn't receive it?{" "}
                      {resendCooldown > 0 ? (
                        <span className="text-slate-400">Resend in {resendCooldown}s</span>
                      ) : (
                        <button type="button" onClick={handleForgotResend} disabled={loading}
                          className="text-[#1B3A6B] font-semibold hover:text-[#142d55] disabled:opacity-50">
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="fp-new-pw" className="block text-sm font-semibold text-slate-700 mb-1.5">New password</label>
                    <input
                      id="fp-new-pw" type="password" value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      placeholder="Min 8 chars, uppercase, number"
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label htmlFor="fp-confirm-pw" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm new password</label>
                    <input
                      id="fp-confirm-pw" type="password" value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      className={`${inputCls} ${
                        fpConfirmPassword && fpNewPassword !== fpConfirmPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : ""
                      }`}
                    />
                    {fpConfirmPassword && fpNewPassword !== fpConfirmPassword && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Resetting…" : <><span>Reset password</span><ArrowRight size={15} /></>}
                  </button>
                </form>

                <button
                  type="button" onClick={() => { setStep("forgot-email"); setError(""); setFpOtp(""); }}
                  className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Change email address
                </button>
              </>
            )}

            {/* ── FORGOT — success ── */}
            {step === "forgot-done" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Password reset</h1>
                <p className="text-slate-500 text-sm mb-8">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                  type="button" onClick={resetToSignIn}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  Back to sign in <ArrowRight size={15} />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
