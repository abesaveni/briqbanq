import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./compiled.css";
import "./index.css";

import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";

// Use createBrowserRouter (data router) so hooks like useBlocker work correctly
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <NotificationProvider>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </NotificationProvider>
    ),
  },
]);

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p style='padding:2rem;font-family:sans-serif;'>Root element #root not found. Check index.html.</p>";
} else {
  try {
    ReactDOM.createRoot(rootEl).render(<RouterProvider router={router} />);
  } catch (err) {
    console.error("App failed to mount:", err);
    rootEl.innerHTML = "<div style='padding:2rem;font-family:sans-serif;'><h1>App failed to load</h1><p>Check the browser console for errors.</p><button onclick='location.reload()'>Reload</button></div>";
  }
}
