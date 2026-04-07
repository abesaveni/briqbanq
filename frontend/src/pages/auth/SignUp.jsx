import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES, getDashboardPath } from "./authConfig";
import api from "../../services/api";
import {
  validateFirstName, validateLastName, validateEmail,
  validateAuPhone, validatePassword,
} from "../../utils/auValidation";
import { Building2, ArrowRight, Eye, EyeOff } from "lucide-react";


export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const cooldownRef = useRef(null);

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

  const validate = () => {
    const errs = {};
    const fnErr = validateFirstName(firstName); if (fnErr) errs.firstName = fnErr;
    const lnErr = validateLastName(lastName); if (lnErr) errs.lastName = lnErr;
    const emErr = validateEmail(email); if (emErr) errs.email = emErr;
    const phErr = validateAuPhone(phone); if (phErr) errs.phone = phErr;
    const pwErr = validatePassword(password); if (pwErr) errs.password = pwErr;
    if (!role) errs.role = "Please select your role";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseApiError = (err, fallback) => {
    let detail = err.response?.data?.detail;
    if (typeof detail === 'string') {
      try { detail = JSON.parse(detail); } catch {}
    }
    if (Array.isArray(detail)) {
      return detail.map((e) => e.msg?.replace(/^Value error,\s*/i, '') || e.message || JSON.stringify(e)).join(' ');
    }
    if (typeof detail === 'string') return detail;
    const msg = err.response?.data?.message;
    if (typeof msg === 'string') return msg;
    return fallback;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post("/api/v1/identity/send-otp", { email: email.trim() });
      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
        setOtp(res.data.dev_otp);
      }
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(parseApiError(err, "Failed to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setResendSuccess(false);
    setLoading(true);
    try {
      const res = await api.post("/api/v1/identity/send-otp", { email: email.trim() });
      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
        setOtp(res.data.dev_otp);
      } else {
        setOtp("");
      }
      setResendSuccess(true);
      startCooldown();
    } catch (err) {
      setError(parseApiError(err, "Failed to resend OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/v1/identity/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        role: role.toUpperCase(),
      });

      const { tokens, user } = res.data;
      login(tokens.access_token, user);
      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      const parsed = parseApiError(err, "Invalid or expired OTP.");
      // If the error is about password, navigate back to form so user can fix it
      if (parsed.toLowerCase().includes('password')) {
        setStep("form");
        setFieldErrors((prev) => ({ ...prev, password: parsed }));
      } else {
        setError(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 focus:ring-2 outline-none transition text-sm ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]/10"
    }`;

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — brand / hero ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 bg-[#0C1E3C] overflow-hidden">
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
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Join BriqBanq today</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-4 tracking-tight">
            Your mortgage.<br />
            <span className="text-[#5B9BD5]">Fully transparent.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Create your account and get access to a role-tailored dashboard built for
            Australian mortgage resolution professionals and borrowers.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { title: "Borrowers", desc: "Track your case from submission to resolution" },
              { title: "Lenders", desc: "Manage your portfolio and live recovery auctions" },
              { title: "Investors", desc: "Bid on distressed assets and track returns" },
              { title: "Lawyers", desc: "Access assigned cases and KYC documents" },
            ].map((r) => (
              <div key={r.title} className="flex items-start gap-3">
                <span className="w-2 h-2 bg-[#5B9BD5] rounded-full shrink-0 mt-1.5" />
                <div>
                  <p className="text-xs font-bold text-white">{r.title}</p>
                  <p className="text-xs text-white/40">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} BriqBanq. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ───────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col min-h-screen overflow-y-auto">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-slate-100 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-white" />
            </div>
            <span className="text-lg font-bold text-[#1B3A6B] tracking-tight">BriqBanq</span>
          </Link>
        </header>

        <div className="flex-1 flex items-start justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {step === "form" ? (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Create your account</h1>
                  <p className="text-slate-500 text-sm">Sign up and choose your role to access your dashboard.</p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1.5">First name</label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setFieldErrors(p => ({ ...p, firstName: undefined })); }}
                        placeholder="Jane"
                        autoComplete="given-name"
                        className={inputClass(fieldErrors.firstName)}
                      />
                      {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1.5">Last name</label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value); setFieldErrors(p => ({ ...p, lastName: undefined })); }}
                        placeholder="Smith"
                        autoComplete="family-name"
                        className={inputClass(fieldErrors.lastName)}
                      />
                      {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }}
                      placeholder="you@example.com.au"
                      autoComplete="email"
                      className={inputClass(fieldErrors.email)}
                    />
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">Australian mobile or phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: undefined })); }}
                      placeholder="0412 345 678"
                      autoComplete="tel"
                      className={inputClass(fieldErrors.phone)}
                    />
                    {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                        placeholder="Min 8 chars, A-Z, 0-9, special char"
                        autoComplete="new-password"
                        className={`${inputClass(fieldErrors.password)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1.5">I am a</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => { setRole(e.target.value); setFieldErrors(p => ({ ...p, role: undefined })); }}
                      className={`w-full px-4 py-3 rounded-xl border text-slate-900 bg-slate-50 focus:ring-2 outline-none transition text-sm appearance-none cursor-pointer ${
                        fieldErrors.role
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]/10"
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        backgroundSize: "1.25rem",
                        paddingRight: "2.5rem",
                      }}
                      aria-label="Select your role"
                    >
                      <option value="">Select your role</option>
                      {USER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {fieldErrors.role && <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? "Sending verification code…" : (
                      <>Send verification code <ArrowRight size={15} /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Verify your email</h1>
                  <p className="text-slate-500 text-sm">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-slate-700">{email}</span>.
                    Enter it below to complete registration.
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  {devOtp && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm font-mono text-center">
                      <span className="font-semibold">Dev mode — Your OTP:</span> <span className="text-lg tracking-widest font-bold">{devOtp}</span>
                    </div>
                  )}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-slate-700 mb-2">
                      Verification code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="w-full px-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-center text-3xl tracking-[0.5em] placeholder-slate-300 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10 outline-none transition font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1B3A6B] hover:bg-[#142d55] text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying…" : (
                      <>Create account <ArrowRight size={15} /></>
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendSuccess && (
                      <p className="text-emerald-600 text-xs mb-2 font-medium">A new code has been sent to your email.</p>
                    )}
                    <p className="text-slate-500 text-sm">
                      Didn't receive the code?{" "}
                      {resendCooldown > 0 ? (
                        <span className="text-slate-400">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={loading}
                          className="text-[#1B3A6B] hover:text-[#142d55] font-semibold disabled:opacity-50 transition-colors"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setStep("form"); setError(""); setOtp(""); setResendSuccess(false); }}
                    className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ← Back to registration
                  </button>
                </form>
              </>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/signin" className="text-[#1B3A6B] hover:text-[#142d55] font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
