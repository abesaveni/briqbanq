import { useState } from "react";

/**
 * Shared logo and brand for all app sidebars (Admin, Borrower, Investor, Lender).
 * Same look: logo mark + "Brickbanq" + "V-MIP PLATFORM".
 */
export default function AppLogo({ className = "" }) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div className={`flex items-center gap-3 flex-shrink-0 ${className}`}>
      <div className="w-9 h-9 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
        {!logoError ? (
          <img
            src="/logo.png"
            alt="Brickbanq"
            className="w-full h-full object-contain p-1"
            onError={() => setLogoError(true)}
          />
        ) : null}
        {logoError && (
          <span className="w-full h-full bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm">
            B
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-white font-bold text-sm tracking-tight">Brickbanq</span>
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest italic">
          V-MIP Platform
        </span>
      </div>
    </div>
  );
}
