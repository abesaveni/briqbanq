import React from "react";
import { Link } from "react-router-dom";

/**
 * Error boundary for individual routes. Catches render errors and shows
 * a fallback with link back home so the rest of the app stays usable.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorRouteLabel: null, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error) };
  }

  // Reset error state when navigating to a different route
  static getDerivedStateFromProps(props, state) {
    if (state.hasError && state.errorRouteLabel !== props.routeLabel) {
      return { hasError: false, errorRouteLabel: null };
    }
    if (!state.hasError) {
      return { errorRouteLabel: props.routeLabel };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const label = this.props.routeLabel || "this page";
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-gray-50 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-4">
            We couldn’t load {label}. Try refreshing or go back to the home page.
          </p>
          {this.state.errorMessage && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4 font-mono break-all max-w-lg">
              {this.state.errorMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/"
              className="px-5 py-2.5 font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
