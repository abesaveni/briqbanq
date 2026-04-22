import { Routes, Route, Navigate } from "react-router-dom";
import InvestorDashboard from "../pages/investor/InvestorDashboard";
import InvestorCaseDetails from "../pages/investor/InvestorCaseDetails";
import InvestorPlaceBid from "../pages/investor/InvestorPlaceBid";
import InvestorAllDeals from "../pages/investor/InvestorAllDeals";
import InvestorAuctions from "../pages/investor/InvestorAuctions";
import InvestorLayout from "../components/layout/InvestorLayout";
import LenderLayout from "../components/layout/LenderLayout";
import InvestorContracts from "../pages/investor/InvestorContracts";
import InvestorEscrow from "../pages/investor/InvestorEscrow";
import InvestorAuctionRoom from "../pages/investor/InvestorAuctionRoom";
import InvestorBuyNowRoom from "../pages/investor/InvestorBuyNowRoom";
import InvestorNotifications from "../pages/investor/InvestorNotifications";
import InvestorSettings from "../pages/investor/InvestorSettings";
import InvestorTaskCenter from "../pages/investor/InvestorTaskCenter";
import InvestorReports from "../pages/investor/InvestorReports";
import InvestorDocuments from "../pages/investor/InvestorDocuments";
import InvestorWatchlist from "../pages/investor/InvestorWatchlist";
import InvestorSubmitNewCase from "../pages/investor/InvestorSubmitNewCase";

// Lender Imports
import LenderDashboard from "../pages/lender/LenderDashboard";
import LenderAllDeals from "../pages/lender/LenderAllDeals";
import LenderAuctions from "../pages/lender/LenderAuctions";
import LenderAuctionRoom from "../pages/lender/LenderAuctionRoom";
import LenderBuyNowRoom from "../pages/lender/LenderBuyNowRoom";
import LenderContracts from "../pages/lender/LenderContracts";
import LenderMyCases from "../pages/lender/LenderMyCases";
import LenderCommunications from "../pages/lender/LenderCommunications";
import LenderTaskCenter from "../pages/lender/LenderTaskCenter";
import LenderReports from "../pages/lender/LenderReports";
import LenderReviewRelevantCases from "../pages/lender/LenderReviewRelevantCases";
import LenderTrendAnalysis from "../pages/lender/LenderTrendAnalysis";
import LenderDocuments from "../pages/lender/LenderDocuments";
import LenderCaseDetails from "../pages/lender/LenderCaseDetails";
import LenderSubmitNewCase from "../pages/lender/LenderSubmitNewCase";

import LenderNotifications from "../pages/lender/LenderNotifications";
import LenderSettings from "../pages/lender/LenderSettings";
import LenderEditCase from "../pages/lender/LenderEditCase";

// Lawyer Panel
import LawyerLayout from "../pages/lawyer/LawyerLayout.jsx";
import LawyerDashboard from "../pages/lawyer/Dashboard.jsx";
import LawyerAssignedCases from "../pages/lawyer/AssignedCases";
import LawyerCaseDetail from "../pages/lawyer/CaseDetail";
import LawyerTaskCenter from "../pages/lawyer/TaskCenter";
import LawyerContractReview from "../pages/lawyer/ContractReview";
import LawyerNotifications from "../pages/lawyer/Notifications";
import LawyerSettings from "../pages/lawyer/Settings";
import LawyerKYCReview from "../pages/lawyer/KYCReview";
import LawyerReports from "../pages/lawyer/Reports";
import UserManagement from "../pages/admin/UserManagement";
import LawyerLiveAuctions from "../pages/lawyer/LiveAuctions";
import LawyerMyCases from "../pages/lawyer/MyCases";
import LawyerEditCase from "../pages/lawyer/LawyerEditCase";
import LawyerSubmitNewCase from "../pages/lawyer/SubmitNewCase";
import MyBidsPage from "../pages/common/MyBidsPage";



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

import MyCase from "../pages/borrower/MyCase";
import IdentityVerification from "../pages/borrower/IdentityVerification";
import LenderIdentityVerification from "../pages/borrower/IdentityVerification";
import LawyerIdentityVerification from "../pages/borrower/IdentityVerification";
import InvestorIdentityVerification from "../pages/borrower/IdentityVerification";
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
import CaseLawyerReview from "../pages/admin/case-details/LawyerReview";

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
          <Route path="lawyer-review" element={<CaseLawyerReview />} />
          <Route path="settlement" element={<CaseSettlement />} />
          <Route path="bids" element={<CaseBids />} />
          <Route path="messages" element={<CaseMessages />} />
          <Route path="activity" element={<CaseActivity />} />
        </Route>
        <Route path="document-library" element={<RouteErrorBoundary key="admin-document-library" routeLabel="Document Library"><AdminDocumentLibrary /></RouteErrorBoundary>} />
        <Route path="reports-analytics" element={<RouteErrorBoundary key="admin-reports-analytics" routeLabel="Reports & Analytics"><AdminReportsAnalytics /></RouteErrorBoundary>} />
        <Route path="admin-center" element={<RouteErrorBoundary key="admin-center" routeLabel="Admin Centre"><AdminConsole /></RouteErrorBoundary>} />
        <Route path="user-management" element={<RouteErrorBoundary key="admin-user-management" routeLabel="User Management"><UserManagement /></RouteErrorBoundary>} />
        <Route path="task-center" element={<RouteErrorBoundary key="admin-task-center" routeLabel="Task Centre"><AdminTaskCenter /></RouteErrorBoundary>} />
        <Route path="notifications" element={<RouteErrorBoundary key="admin-notifications" routeLabel="Notifications"><AdminNotifications /></RouteErrorBoundary>} />
        <Route path="settings" element={<RouteErrorBoundary key="admin-settings" routeLabel="Settings"><AdminSettings /></RouteErrorBoundary>} />
      </Route>



      {/* Borrower Routes */}
      <Route path="/borrower" element={<RouteErrorBoundary routeLabel="the borrower panel"><BorrowerLayout /></RouteErrorBoundary>}>
        <Route index element={<Navigate to="/borrower/dashboard" replace />} />
        <Route path="dashboard" element={<BorrowerDashboard />} />
        <Route path="my-case" element={<MyCase />} />
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
        <Route path="watchlist" element={<InvestorWatchlist />} />
        <Route path="case-details/:id" element={<InvestorCaseDetails />} />
        <Route path="place-bid/:id" element={<InvestorPlaceBid />} />
        <Route path="buy-now/:id" element={<InvestorBuyNowRoom />} />
        <Route path="my-bids" element={<MyBidsPage role="investor" />} />
        <Route path="notifications" element={<InvestorNotifications />} />
        <Route path="settings" element={<InvestorSettings />} />
        <Route path="identity-verification" element={<InvestorIdentityVerification />} />
        <Route path="submit-case" element={<RouteErrorBoundary key="investor-submit-case" routeLabel="Submit New Case"><InvestorSubmitNewCase /></RouteErrorBoundary>} />
      </Route>

      {/* Lender Routes Layout */}
      <Route path="/lender" element={<LenderLayout />}>
        <Route index element={<Navigate to="/lender/dashboard" replace />} />
        <Route path="dashboard" element={<RouteErrorBoundary key="lender-dashboard" routeLabel="Dashboard"><LenderDashboard /></RouteErrorBoundary>} />
        <Route path="deals" element={<RouteErrorBoundary key="lender-deals" routeLabel="Deals"><LenderAllDeals /></RouteErrorBoundary>} />
        <Route path="my-cases" element={<RouteErrorBoundary key="lender-my-cases" routeLabel="My Cases"><LenderMyCases /></RouteErrorBoundary>} />
        <Route path="communications" element={<RouteErrorBoundary key="lender-communications" routeLabel="Client Communications"><LenderCommunications /></RouteErrorBoundary>} />
        <Route path="tasks" element={<RouteErrorBoundary key="lender-tasks" routeLabel="Task Centre"><LenderTaskCenter /></RouteErrorBoundary>} />
        <Route path="auctions" element={<RouteErrorBoundary key="lender-auctions" routeLabel="Auctions"><LenderAuctions /></RouteErrorBoundary>} />
        <Route path="auctions/:id" element={<RouteErrorBoundary key="lender-auction-room" routeLabel="Auction Room"><LenderAuctionRoom /></RouteErrorBoundary>} />
        <Route path="buy-now/:id" element={<RouteErrorBoundary key="lender-buy-now" routeLabel="Buy Now Room"><LenderBuyNowRoom /></RouteErrorBoundary>} />
        <Route path="contracts" element={<RouteErrorBoundary key="lender-contracts" routeLabel="Contracts"><LenderContracts /></RouteErrorBoundary>} />
        <Route path="reports" element={<RouteErrorBoundary key="lender-reports" routeLabel="Reports"><LenderReports /></RouteErrorBoundary>} />
        <Route path="review-relevant-cases" element={<RouteErrorBoundary key="lender-review-cases" routeLabel="Review Relevant Cases"><LenderReviewRelevantCases /></RouteErrorBoundary>} />
        <Route path="trend-analysis" element={<RouteErrorBoundary key="lender-trend-analysis" routeLabel="Trend Analysis"><LenderTrendAnalysis /></RouteErrorBoundary>} />
        <Route path="case-details/:id" element={<RouteErrorBoundary key="lender-case-details" routeLabel="Case Details"><LenderCaseDetails /></RouteErrorBoundary>} />
        <Route path="submit-case" element={<RouteErrorBoundary key="lender-submit-case" routeLabel="Submit New Case"><LenderSubmitNewCase /></RouteErrorBoundary>} />
        <Route path="edit-case/:id" element={<RouteErrorBoundary key="lender-edit-case" routeLabel="Edit Case"><LenderEditCase /></RouteErrorBoundary>} />
        <Route path="contracts/create" element={<RouteErrorBoundary key="lender-contracts-create" routeLabel="Create Contract"><LenderContracts /></RouteErrorBoundary>} />
        <Route path="documents" element={<RouteErrorBoundary key="lender-documents" routeLabel="Documents"><LenderDocuments /></RouteErrorBoundary>} />
        <Route path="my-bids" element={<RouteErrorBoundary key="lender-my-bids" routeLabel="My Bids"><MyBidsPage role="lender" /></RouteErrorBoundary>} />
        <Route path="notifications" element={<RouteErrorBoundary key="lender-notifications" routeLabel="Notifications"><LenderNotifications /></RouteErrorBoundary>} />
        <Route path="settings" element={<RouteErrorBoundary key="lender-settings" routeLabel="Settings"><LenderSettings /></RouteErrorBoundary>} />
        <Route path="identity-verification" element={<RouteErrorBoundary key="lender-kyc" routeLabel="Identity Verification"><LenderIdentityVerification /></RouteErrorBoundary>} />
      </Route>



      {/* Lawyer Panel */}
      <Route path="/lawyer" element={<RouteErrorBoundary routeLabel="the lawyer panel"><LawyerLayout /></RouteErrorBoundary>}>
        <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
        <Route path="dashboard" element={<LawyerDashboard />} />
        <Route path="kyc-review" element={<LawyerKYCReview />} />
        <Route path="reports" element={<LawyerReports />} />
        <Route path="my-cases" element={<LawyerMyCases />} />
        <Route path="my-cases/:id" element={<RouteErrorBoundary key="lawyer-my-case-details" routeLabel="Case Details"><LenderCaseDetails /></RouteErrorBoundary>} />
        <Route path="edit-case/:id" element={<RouteErrorBoundary key="lawyer-edit-case" routeLabel="Edit Case"><LawyerEditCase /></RouteErrorBoundary>} />
        <Route path="assigned-cases" element={<LawyerAssignedCases />} />
        <Route path="assigned-cases/:caseId" element={<LawyerCaseDetail />} />
        <Route path="contract-review" element={<LawyerContractReview />} />
        <Route path="task-center" element={<LawyerTaskCenter />} />
        <Route path="notifications" element={<LawyerNotifications />} />
        <Route path="settings" element={<LawyerSettings />} />
        <Route path="identity-verification" element={<LawyerIdentityVerification />} />
        <Route path="live-auctions" element={<LawyerLiveAuctions />} />
        <Route path="auctions/:id" element={<InvestorAuctionRoom />} />
        <Route path="my-bids" element={<MyBidsPage role="lawyer" />} />
        <Route path="submit-case" element={<RouteErrorBoundary key="lawyer-submit-case" routeLabel="Submit New Case"><LawyerSubmitNewCase /></RouteErrorBoundary>} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
