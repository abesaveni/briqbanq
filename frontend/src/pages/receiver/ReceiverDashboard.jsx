import { Link } from "react-router-dom";

export default function ReceiverDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Receiver Dashboard</h1>
          <p className="text-gray-500 mt-1">Receivership and reporting portal.</p>
          <p className="mt-4 text-sm text-gray-600">
            This area is for receivers. Full receiver features can be added here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to home
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
