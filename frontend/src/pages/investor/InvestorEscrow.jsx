import { useState, useEffect } from "react";
import { escrowService } from "../../api/dataService";
import { LoadingState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import { CheckCircle, Shield, Calendar, CreditCard } from "lucide-react";

const SECURITY_PROTOCOLS = [
  { title: "256-bit SSL Encryption", description: "All fund transfers use bank-grade SSL encryption to ensure maximum protection." },
  { title: "Two-Factor Authorization", description: "All releases require dual authorization from escrow agent and account holder." },
  { title: "AFCA Compliant", description: "Monitored and compliant with the Australian Financial Complaints Authority." },
  { title: "Segregated Accounts", description: "Escrow funds are held in segregated trust accounts separate from operational funds." },
];

export default function InvestorEscrow() {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const res = await escrowService.getEscrowInfo();
        if (res.success && res.data) {
          setEscrow(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEscrow();
  }, []);

  const handleRelease = async () => {
    if (!escrow) return;
    const res = await escrowService.releaseFunds(escrow.id);
    if (res.success) {
      setEscrow(res.data);
      setReleased(true);
    }
  };

  if (loading) return <LoadingState />;

  if (!escrow) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Escrow Funds</h2>
          <p className="text-gray-500 font-medium">Manage your secure investment releases and balances</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
          <div className="bg-indigo-50 p-4 rounded-full text-indigo-400">
            <Shield size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No Active Escrow</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            You don't have any active escrow accounts. Escrow is created automatically once you win an auction and proceed to contract.
          </p>
        </div>
        <SecurityPanel />
      </div>
    );
  }

  const amount = Number(escrow.amount) || 0;
  const isHeld = escrow.status === "HELD";
  const isReleased = escrow.status === "RELEASED" || released;
  const isPending = escrow.status === "PENDING";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Escrow Funds</h2>
          <p className="text-gray-500 font-medium">Manage your secure investment releases and balances</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center gap-2 text-indigo-700 text-xs font-medium uppercase tracking-wider">
          <Shield size={14} />
          Secured by Brickbanq
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Funds Held" value={isHeld ? amount : 0} color="indigo" icon={<Shield size={20} />} />
        <StatCard title="Total Released" value={isReleased ? amount : 0} color="green" icon={<CheckCircle size={20} />} />
        <StatCard title="Remaining Balance" value={isHeld ? amount : 0} color="gray" icon={<CreditCard size={20} />} />
      </div>

      {/* PENDING RELEASE ALERT */}
      {isHeld && !isReleased && (
        <div className="bg-gradient-to-r from-orange-50 to-white border-y md:border border-orange-200 p-6 md:rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 animate-bounce">
              <Calendar size={24} />
            </div>
            <div>
              <p className="font-semibold text-orange-900 leading-tight uppercase text-xs tracking-widest mb-1">
                Pending Release Authorization
              </p>
              <p className="text-sm text-orange-700 font-medium">
                {formatCurrency(amount)} is awaiting release authorization.
              </p>
            </div>
          </div>
          <button
            onClick={handleRelease}
            className="w-full md:w-auto bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            Authorize Release
          </button>
        </div>
      )}

      {/* ESCROW DETAILS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900 uppercase text-xs tracking-wider">Escrow Record</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs font-medium text-gray-400 uppercase tracking-wider bg-white">
              <tr>
                <th className="p-6">Deal ID</th>
                <th className="py-6">Amount</th>
                <th className="py-6">Mode</th>
                <th className="py-6">Status</th>
                <th className="py-6">Created</th>
                {escrow.release_reason && <th className="p-6">Release Reason</th>}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 text-sm text-gray-500 font-mono">{escrow.deal_id}</td>
                <td className="py-6 text-lg font-semibold text-indigo-600">{formatCurrency(amount)}</td>
                <td className="py-6 text-sm text-gray-700 capitalize">{(escrow.mode || "").toLowerCase()}</td>
                <td className="py-6">
                  <StatusBadge status={escrow.status} />
                </td>
                <td className="py-6 text-sm text-gray-500">
                  {escrow.created_at ? new Date(escrow.created_at).toLocaleDateString("en-AU") : "—"}
                </td>
                {escrow.release_reason && (
                  <td className="p-6 text-sm text-gray-500">{escrow.release_reason}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ESCROW DETAILS + SECURITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ESCROW AUTHORITY */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Shield size={200} />
          </div>
          <h3 className="text-base font-bold uppercase tracking-tight mb-4 border-b border-white/10 pb-3 text-indigo-100">
            Escrow Authority Details
          </h3>
          <div className="space-y-3 relative z-10">
            <DetailItem label="Escrow Agent" value="BrickBanq Escrow Services" sub="License: AFCA-ESC-2024-001" />
            <DetailItem label="Escrow ID" value={String(escrow.id).slice(0, 18) + "..."} mono />
            <DetailItem label="Status" value={escrow.status} />
            <DetailItem label="Mode" value={(escrow.mode || "").toLowerCase()} />
          </div>
          <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-[9px] leading-tight opacity-60 italic">
            All escrow activities are monitored and compliant with the Australian Financial Complaints Authority (AFCA).
          </div>
        </div>

        <SecurityPanel />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    HELD: "bg-orange-100 text-orange-700",
    RELEASED: "bg-green-100 text-green-700",
    PENDING: "bg-blue-100 text-blue-700",
    REFUNDED: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function SecurityPanel() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-green-50 p-2 rounded-xl text-green-600">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-tight">Security Protocols</h3>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Compliance & Protection Level 4</p>
        </div>
      </div>
      <div className="space-y-4">
        {SECURITY_PROTOCOLS.map((item, index) => (
          <div key={index} className="flex items-start gap-4 group">
            <div className="mt-1 bg-green-50 text-green-600 p-1 rounded-full group-hover:scale-110 transition-transform">
              <CheckCircle size={14} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm uppercase tracking-tight mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }) {
  const iconColors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    gray: "bg-gray-50 text-gray-600",
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-medium text-gray-400 mb-1">{title}</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(value)}</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Escrow Active</p>
      </div>
      <div className={`p-3 rounded-xl ${iconColors[color]}`}>{icon}</div>
    </div>
  );
}

function DetailItem({ label, value, sub, mono }) {
  return (
    <div>
      <p className="text-white/40 text-[9px] font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-base font-bold ${mono ? "font-mono" : ""}`}>{value || "Pending Verification"}</p>
      {sub && <p className="text-[9px] text-white/40 font-normal italic mt-0.5">{sub}</p>}
    </div>
  );
}
