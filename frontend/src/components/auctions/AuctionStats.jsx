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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Live */}
      <div className="p-6 rounded-2xl border border-red-200 bg-red-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Live Now</p>
            <h2 className="text-3xl font-bold text-red-600">
              {liveCount}
            </h2>
          </div>
          <Gavel className="text-red-500" size={28} />
        </div>
      </div>

      {/* Upcoming */}
      <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Upcoming</p>
            <h2 className="text-3xl font-bold text-blue-600">
              {upcomingCount}
            </h2>
          </div>
          <Calendar className="text-blue-500" size={28} />
        </div>
      </div>

      {/* Total Value */}
      <div className="p-6 rounded-2xl border border-green-200 bg-green-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Total Value</p>
            <h2 className="text-3xl font-bold text-green-600">
              ${(totalValue / 1000000).toFixed(1)}M
            </h2>
          </div>
          <DollarSign className="text-green-500" size={28} />
        </div>
      </div>

      {/* Active Bidders */}
      <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Active Bidders</p>
            <h2 className="text-3xl font-bold text-purple-600">
              {totalBidders}
            </h2>
          </div>
          <Users className="text-purple-500" size={28} />
        </div>
      </div>

    </div>
  );
}
