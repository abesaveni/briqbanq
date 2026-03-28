// src/services/auctionService.js
import api from "./api";

export const auctionService = {
    getAuctionById: async (id) => {
        const res = await api.get(`/api/v1/auctions/${id}`)
        const deal = res?.data?.data ?? res?.data ?? null
        if (!deal) return null
        return {
            ...deal,
            images: deal.images || [deal.image].filter(Boolean),
            bidHistory: deal.bidHistory || [],
            documents: deal.documents || [],
            metrics: deal.metrics || {},
            financials: deal.financials || {},
            propertyDetails: deal.propertyDetails || {}
        }
    },

    placeBid: async (id, amount) => {
        if (!id || !amount) throw new Error("Invalid bid parameters")
        const res = await api.post(`/api/v1/bids`, { auction_id: id, amount })
        return res?.data ?? { success: true, newBid: amount, timestamp: new Date().toISOString() }
    },

    getBidHistory: async (id) => {
        const res = await api.get(`/api/v1/auctions/${id}/bids`)
        return res?.data?.data ?? res?.data ?? []
    },

    getDocuments: async (id) => {
        const res = await api.get(`/api/v1/auctions/${id}/documents`)
        return res?.data?.data ?? res?.data ?? []
    }
};
