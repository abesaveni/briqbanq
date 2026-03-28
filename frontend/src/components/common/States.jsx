import { AlertCircle } from "lucide-react";

export const LoadingState = ({ message = "Loading data..." }) => (
    <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium tracking-wide">{message}</p>
    </div>
);

export const EmptyState = ({ message = "No items found", submessage = "Try adjusting your filters or check back later." }) => (
    <div className="w-full py-16 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <AlertCircle className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <p className="text-gray-500 text-sm mt-1">{submessage}</p>
    </div>
);

export const ErrorState = ({ message = "Failed to load data" }) => (
    <div className="w-full py-16 flex flex-col items-center justify-center bg-red-50 rounded-3xl border-2 border-dashed border-red-100">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 text-red-500">
            <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-semibold text-red-900">{message}</h3>
        <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
            Try refreshing the page
        </button>
    </div>
);
