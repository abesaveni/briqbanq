export const USER_ROLES = [
  { value: "borrower", label: "Borrower" },
  { value: "lender", label: "Lender" },
  { value: "investor", label: "Investor" },
  { value: "lawyer", label: "Lawyer" },
  { value: "admin", label: "Admin" }
];

export function getDashboardPath(role) {
  switch (role) {
    case "borrower": return "/borrower/dashboard";
    case "lender": return "/lender/dashboard";
    case "lawyer": return "/lawyer/dashboard";
    case "investor": return "/investor/dashboard";
    case "admin": return "/admin";
    default: return "/dashboard";
  }
}
