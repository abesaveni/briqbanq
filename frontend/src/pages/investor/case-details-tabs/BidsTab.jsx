import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import CaseBidPanel from "../../../components/common/CaseBidPanel";

export default function BidsTab() {
    const { id } = useParams();
    const { user } = useAuth();
    return (
        <div className="bg-white border border-gray-100 rounded-[20px] p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
            <h3 className="text-[17px] font-bold text-slate-800 mb-6">Bids</h3>
            <CaseBidPanel
                caseId={id}
                canBid={true}
                canClose={false}
                currentUser={{ name: user?.name, role: 'Investor' }}
            />
        </div>
    );
}
