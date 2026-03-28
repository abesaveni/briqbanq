import LenderTopNavBar from "./LenderTopNavBar";
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LenderLayout() {
    const { currentRole, switchRole, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token && !localStorage.getItem('token')) { navigate('/signin', { replace: true }); return; }
        if (currentRole !== "lender") switchRole("lender");
    }, [token, currentRole, switchRole, navigate]);

    return (
        <div className="min-h-screen bg-gray-50">
            <LenderTopNavBar />

            <main className="pt-14 flex flex-col min-h-screen">
                <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
