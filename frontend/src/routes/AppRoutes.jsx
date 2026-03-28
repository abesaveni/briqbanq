import { Routes, Route, Navigate } from "react-router-dom";
import InvestorDashboard from "../pages/investor/InvestorDashboard";
import InvestorCaseDetails from "../pages/investor/InvestorCaseDetails";
import InvestorPlaceBid from "../pages/investor/InvestorPlaceBid";
import InvestorAllDeals from "../pages/investor/InvestorAllDeals";
import InvestorAuctions from "../pages/investor/InvestorAuctions";
import InvestorLayout from "../components/layout/InvestorLayout";
import LenderLayout from "../components/layout/LenderLayout";
import InvestorContracts from "../pages/investor/InvestorContracts";
import InvestorContractSigning from "../pages/investor/InvestorContractSigning";
import InvestorEscrow from "../pages/investor/InvestorEscrow";
import InvestorAuctionRoom from "../pages/investor/InvestorAuctionRoom";
import InvestorBuyNowRoom from "../pages/investor/InvestorBuyNowRoom";
import InvestorNotifications from "../pages/investor/InvestorNotifications";
import InvestorSettings from "../pages/investor/InvestorSettings";
import InvestorTaskCenter from "../pages/investor/InvestorTaskCenter";
import InvestorReports from "../pages/investor/InvestorReports";
import InvestorDocuments from "../pages/investor/InvestorDocuments";

// Lender Imports
import LenderDashboard from "../pages/lender/LenderDashboard";
import LenderAllDeals from "../pages/lender/LenderAllDeals";
import LenderAuctions from "../pages/lender/LenderAuctions";
import LenderAuctionRoom from "../pages/lender/LenderAuctionRoom";
import LenderBuyNowRoom from "../pages/lender/LenderBuyNowRoom";
import LenderContracts from "../pages/lender/LenderContracts";
import LenderMyCases from "../pages/lender/LenderMyCases";
import LenderCommunications from "../pages/lender/LenderCommunications";
import LenderESignatures from "../pages/lender/LenderESignatures";
import LenderTaskCenter from "../pages/lender/LenderTaskCenter";
import LenderReports from "../pages/lender/LenderReports";
import LenderReviewRelevantCases from "../pages/lender/LenderReviewRelevantCases";
import LenderTrendAnalysis from "../pages/lender/LenderTrendAnalysis";
import LenderDocuments from "../pages/lender/LenderDocuments";
import LenderCaseDetails from "../pages/lender/LenderCaseDetails";
import LenderSubmitNewCase from "../pages/lender/LenderSubmitNewCase";

import LenderNotifications from "../pages/lender/LenderNotifications";
import LenderSettings from "../pages/lender/LenderSettings";

// Lawyer Panel
import LawyerLayout from "../pages/lawyer/LawyerLayout.jsx";
import LawyerDashboard from "../pages/lawyer/Dashboard.jsx";
import LawyerAssignedCases from "../pages/lawyer/AssignedCases";
import LawyerCaseDetail from "../pages/lawyer/CaseDetail";
import LawyerESignatures from "../pages/lawyer/ESignatures";
import LawyerTaskCenter from "../pages/lawyer/TaskCenter";
import LawyerContractReview from "../pages/lawyer/ContractReview";
import LawyerNotifications from "../pages/lawyer/Notifications";
import LawyerSettings from "../pages/lawyer/Settings";
import LawyerKYCReview from "../pages/lawyer/KYCReview";
import LawyerReports from "../pages/lawyer/Reports";
import LawyerAdminConsole from "../pages/lawyer/AdminConsole";
import LawyerLiveAuctions from "../pages/lawyer/LiveAuctions";



import NotFound from "../pages/NotFound";
import HomePage from "../pages/home/HomePage";
import RouteErrorBoundary from "../components/common/RouteErrorBoundary";
import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";
import ReceiverDashboard from "../pages/receiver/ReceiverDashboard";

import AdminDashboardLayout from "../components/admin/AdminDashboardLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminCaseManagement from "../pages/admin/CaseManagement";
import AdminAllDeals from "../pages/admin/AllDeals";
import AdminAuctionControl from "../pages/admin/AuctionControl";
import AdminKYCReviewQueue from "../pages/admin/KYCReviewQueue";
import AdminDocumentLibrary from "../pages/admin/DocumentLibrary";
import AdminReportsAnalytics from "../pages/admin/ReportsAnalytics";
import AdminNotifications from "../pages/admin/Notifications";
import AdminSettings from "../pages/admin/Settings";
import AdminConsole from "../pages/admin/AdminConsole";
import AdminTaskCenter from "../pages/admin/AdminTaskCenter";
import KYCReviewDetail from "../pages/admin/KYCReviewDetail";
import AdminAuctionRoom from "../pages/admin/AuctionRoom";
import AdminBuyNowRoom from "../pages/admin/AdminBuyNowRoom";

// Borrower Imports
import BorrowerLayout from "../pages/borrower/BorrowerLayout";
import BorrowerDashboard from "../pages/borrower/BorrowerDashboard";
import BorrowerNewCase from "../pages/borrower/NewCase";
import MyCase from "../pages/borrower/MyCase";
import BorrowerESignatures from "../pages/borrower/ESignatures";
import BorrowerContracts from "../pages/borrower/Contracts";
import IdentityVerification from "../pages/borrower/IdentityVerification";
import BorrowerTaskCenter from "../pages/borrower/TaskCenter";
import BorrowerAuctionRoom from "../pages/borrower/AuctionRoom";
import BorrowerNotifications from "../pages/borrower/Notifications";
import BorrowerSettings from "../pages/borrower/Settings";

import { CaseProvider } from "../context/CaseContext";
import CaseDetailsLayout from "../pages/admin/case-details/CaseDetailsLayout";
import CaseOverview from "../pages/admin/case-details/Overview";
import CaseProperty from "../pages/admin/case-details/Property";
import CaseDocuments from "../pages/admin/case-details/Documents";
import CaseInvestmentMemorandum from "../pages/admin/case-details/InvestmentMemorandum";
import CaseSettlement from "../pages/admin/case-details/Settlement";
import CaseBids from "../pages/admin/case-details/Bids";
import CaseMessages from "../pages/admin/case-details/Messages";
import CaseActivity from "../pages/admin/case-details/Activity";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public: Home & Auth */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Admin Panel */}
      <Route path="/admin" element={<AdminDashboardLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<RouteErrorBoundary key="admin-dashboard" routeLabel="Dashboard"><AdminDashboard /></RouteErrorBoundary>} />
        <Route path="case-management" element={<RouteErrorBoundary key="admin-case-management" routeLabel="Case Management"><AdminCaseManagement /></RouteErrorBoundary>} />
        <Route path="all-deals" element={<RouteErrorBoundary key="admin-all-deals" routeLabel="All Deals"><AdminAllDeals /></RouteErrorBoundary>} />
        <Route path="auction-control" element={<RouteErrorBoundary key="admin-auction-control" routeLabel="Auction Control"><AdminAuctionControl /></RouteErrorBoundary>} />
        <Route path="auction-room/:id" element={<RouteErrorBoundary key="admin-auction-room" routeLabel="Auction Room"><AdminAuctionRoom /></RouteErrorBoundary>} />
        <Route path="buy-now/:id" element={<RouteErrorBoundary key="admin-buy-now" routeLabel="Buy Now Room"><AdminBuyNowRoom /></RouteErrorBoundary>} />
        <Route path="kyc-review" element={<RouteErrorBoundary key="admin-kyc-review" routeLabel="KYC Review Queue"><AdminKYCReviewQueue /></RouteErrorBoundary>} />
        <Route path="kyc-review/:id" element={<RouteErrorBoundary key="admin-kyc-review-detail" routeLabel="KYC Review Detail"><KYCReviewDetail /></RouteErrorBoundary>} />
        <Route path="case-details/:id" element={<RouteErrorBoundary key="admin-case-details" routeLabel="Case Details"><CaseProvider><CaseDetailsLayout /></CaseProvider></RouteErrorBoundary>}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<CaseOverview />} />
          <Route path="property" element={<CaseProperty />} />
          <Route path="documents" element={<CaseDocuments />} />
          <Route path="investment-memorandum" element={<CaseInvestmentMemorandum />} />
          <Route path="settlement" element={<CaseSettlement />} />
          <Route path="bids" element={<CaseBids />} />
          <Route path="messages" element={<CaseMessages />} />
          <Route path="activity" element={<CaseActivity />} />
        </Route>
        <Route path="document-library" element={<RouteErrorBoundary key="admin-document-library" routeLabel="Document Library"><AdminDocumentLibrary /></RouteErrorBoundary>} />
        <Route path="reports-analytics" element={<RouteErrorBoundary key="admin-reports-analytics" routeLabel="Reports & Analytics"><AdminReportsAnalytics /></RouteErrorBoundary>} />
        <Route path="admin-center" element={<RouteErrorBoundary key="admin-center" routeLabel="Admin Centre"><AdminConsole /></RouteErrorBoundary>} />
        <Route path="task-center" element={<RouteErrorBoundary key="admin-task-center" routeLabel="Task Centre"><AdminTaskCenter /></RouteErrorBoundary>} />
        <Route path="notifications" element={<RouteErrorBoundary key="admin-notifications" routeLabel="Notifications"><AdminNotifications /></RouteErrorBoundary>} />
        <Route path="settings" element={<RouteErrorBoundary key="admin-settings" routeLabel="Settings"><AdminSettings /></RouteErrorBoundary>} />
      </Route>



      {/* Borrower Routes */}
      <Route path="/borrower" element={<RouteErrorBoundary routeLabel="the borrower panel"><BorrowerLayout /></RouteErrorBoundary>}>
        <Route index element={<Navigate to="/borrower/dashboard" replace />} />
        <Route path="dashboard" element={<BorrowerDashboard />} />
        <Route path="new-case" element={<BorrowerNewCase />} />
        <Route path="my-case" element={<MyCase />} />
        <Route path="e-signatures" element={<BorrowerESignatures />} />
        <Route path="contracts" element={<BorrowerContracts />} />
        <Route path="identity-verification" element={<IdentityVerification />} />
        <Route path="task-center" element={<BorrowerTaskCenter />} />
        <Route path="auction" element={<BorrowerAuctionRoom />} />
        <Route path="notifications" element={<BorrowerNotifications />} />
        <Route path="settings" element={<BorrowerSettings />} />
      </Route>


      {/* Investor Routes Layout */}
      <Route path="/investor" element={<InvestorLayout />}>
        <Route index element={<Navigate to="/investor/dashboard" replace />} />
        <Route path="dashboard" element={<InvestorDashboard />} />
        <Route path="deals" element={<InvestorAllDeals />} />
        <Route path="auctions" element={<InvestorAuctions />} />
        <Route path="auctions/:id" element={<InvestorAuctionRoom />} />
        <Route path="contracts" element={<InvestorContracts />} />
        <Route path="escrow" element={<InvestorEscrow />} />
        <Route path="tasks" element={<InvestorTaskCenter />} />
        <Route path="reports" element={<InvestorReports />} />
        <Route path="documents" element={<InvestorDocuments />} />
        <Route path="case-details/:id" element={<InvestorCaseDetails />} />
        <Route path="contracts/:id" element={<InvestorContractSigning />} />
        <Route path="place-bid/:id" element={<InvestorPlaceBid />} />
        <Route path="buy-now/:id" element={<InvestorBuyNowRoom />} />
        <Route path="notifications" element={<InvestorNotifications />} />
        <Route path="settings" element={<InvestorSettings />} />
      </Route>

      {/* Lender Routes Layout */}
      <Route path="/lender" element={<LenderLayout />}>
        <Route index element={<Navigate to="/lender/dashboard" replace />} />
        <Route path="dashboard" element={<LenderDashboard />} />
        <Route path="deals" element={<LenderAllDeals />} />
        <Route path="my-cases" element={<LenderMyCases />} />
        <Route path="communications" element={<LenderCommunications />} />
        <Route path="e-signatures" element={<LenderESignatures />} />
        <Route path="tasks" element={<LenderTaskCenter />} />
        <Route path="auctions" element={<LenderAuctions />} />
        <Route path="auctions/:id" element={<RouteErrorBoundary key="lender-auction-room" routeLabel="Auction Room"><LenderAuctionRoom /></RouteErrorBoundary>} />
        <Route path="buy-now/:id" element={<RouteErrorBoundary key="lender-buy-now" routeLabel="Buy Now Room"><LenderBuyNowRoom /></RouteErrorBoundary>} />
        <Route path="contracts" element={<LenderContracts />} />
        <Route path="reports" element={<LenderReports />} />
        <Route path="review-relevant-cases" element={<LenderReviewRelevantCases />} />
        <Route path="trend-analysis" element={<LenderTrendAnalysis />} />
        <Route path="case-details/:id" element={<LenderCaseDetails />} />
        <Route path="submit-case" element={<LenderSubmitNewCase />} />
        <Route path="notifications" element={<LenderNotifications />} />
        <Route path="settings" element={<LenderSettings />} />
      </Route>



      {/* Lawyer Panel */}
      <Route path="/lawyer" element={<RouteErrorBoundary routeLabel="the lawyer panel"><LawyerLayout /></RouteErrorBoundary>}>
        <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
        <Route path="dashboard" element={<LawyerDashboard />} />
        <Route path="kyc-review" element={<LawyerKYCReview />} />
        <Route path="reports" element={<LawyerReports />} />
        <Route path="admin-console" element={<LawyerAdminConsole />} />
        <Route path="assigned-cases" element={<LawyerAssignedCases />} />
        <Route path="assigned-cases/:caseId" element={<LawyerCaseDetail />} />
        <Route path="e-signatures" element={<LawyerESignatures />} />
        <Route path="contract-review" element={<LawyerContractReview />} />
        <Route path="task-center" element={<LawyerTaskCenter />} />
        <Route path="notifications" element={<LawyerNotifications />} />
        <Route path="settings" element={<LawyerSettings />} />
        <Route path="live-auctions" element={<LawyerLiveAuctions />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
