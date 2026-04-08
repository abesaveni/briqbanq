/**
 * SquarePaymentForm — Simplified mock payment
 * Clicking Pay marks payment as complete instantly (no external gateway).
 * Square integration will be wired up in a future release.
 */

import { useState } from "react";
import { CreditCard, Lock, CheckCircle } from "lucide-react";

export default function SquarePaymentForm({
  amountCents = 25000,
  currency = "AUD",
  caseId,
  onSuccess,
  onError,
}) {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const amountDisplay = `$${(amountCents / 100).toFixed(2)} ${currency}`;

  function handlePay() {
    setLoading(true);
    // Simulate a brief processing delay then mark paid
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
      onSuccess?.({ orderId: "manual", paymentId: "manual" });
    }, 1200);
  }

  if (paid) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={24} className="text-emerald-600" />
        </div>
        <p className="font-bold text-emerald-800 text-base">Payment Confirmed</p>
        <p className="text-sm text-emerald-700">
          {amountDisplay} has been recorded. You can proceed to the next step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Amount summary */}
      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-800">Amount due</span>
        </div>
        <span className="text-lg font-extrabold text-indigo-700">{amountDisplay}</span>
      </div>

      {/* What's included */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1.5">
        {[
          ["InfoTrack Property Search", "A$85.00"],
          ["InfoTrack KYC/GreenID Verification", "A$45.00"],
          ["Platform Onboarding Fee", "A$120.00"],
        ].map(([label, price]) => (
          <div key={label} className="flex justify-between text-sm text-slate-600">
            <span>{label}</span>
            <span className="font-medium text-slate-800">{price}</span>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Lock size={12} className="shrink-0" />
        <span>Payment is processed securely. Your details are encrypted and protected.</span>
      </div>

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-md"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          <>
            <CreditCard size={15} />
            Pay {amountDisplay}
          </>
        )}
      </button>
    </div>
  );
}
