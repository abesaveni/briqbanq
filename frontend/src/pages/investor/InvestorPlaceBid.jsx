import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingState } from "../../components/common/States";

export default function InvestorPlaceBid() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the combined Auction Room which handles bidding
    if (id) {
      navigate(`/investor/auctions/${id}`, { replace: true });
    } else {
      navigate('/investor/auctions', { replace: true });
    }
  }, [id, navigate]);

  return <LoadingState message="Redirecting to Auction Room..." />;
}
