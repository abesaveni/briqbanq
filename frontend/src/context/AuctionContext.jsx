import { createContext, useState, useEffect } from "react";
import { auctionService } from "../api/dataService";

export const AuctionContext = createContext();

export function AuctionProvider({ children }) {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    auctionService.getAuctions()
      .then((res) => {
        const list = res?.data || res || []
        if (Array.isArray(list) && list.length) setAuctions(list)
      })
      .catch(() => {})
  }, []);

  return (
    <AuctionContext.Provider value={{ auctions, setAuctions }}>
      {children}
    </AuctionContext.Provider>
  );
}
