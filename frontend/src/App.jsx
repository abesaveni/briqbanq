import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/common/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 16px; background-color: #f3f4f6 !important; }
        #root { min-height: 100vh; display: flex; flex-direction: column; }
      `}</style>
      <ScrollToTop />
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App
