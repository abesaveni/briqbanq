import { Gavel, Calendar, DollarSign, Users } from "lucide-react";

export default function AuctionStats({ auctions }) {
  const list = Array.isArray(auctions) ? auctions : [];

  const liveCount = list.filter(a => a.status === "live").length;

  const upcomingCount = list.filter(a => a.status === "upcoming").length;

  const totalValue = list.reduce(
    (sum, a) => sum + (a.propertyValue || Number(a.starting_price) || 0),
    0
  );

  const totalBidders = list.reduce(
    (sum, a) => sum + (a.bidders || (Array.isArray(a.bids) ? a.bids.length : 0)),
    0
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Live Now</p>
          <p className="text-2xl font-bold text-red-600">{liveCount}</p>
        </div>
        <Gavel className="text-red-400" size={22} />
      </div>
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingCount}</p>
        </div>
        <Calendar className="text-blue-400" size={22} />
      </div>
      <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Total Value</p>
          <p className="text-2xl font-bold text-green-600">${(totalValue / 1000000).toFixed(1)}M</p>
        </div>
        <DollarSign className="text-green-400" size={22} />
      </div>
      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Active Bidders</p>
          <p className="text-2xl font-bold text-purple-600">{totalBidders}</p>
        </div>
        <Users className="text-purple-400" size={22} />
      </div>
    </div>
  );
}
