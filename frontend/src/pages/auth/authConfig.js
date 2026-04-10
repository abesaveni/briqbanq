// Roles available for sign-up (no Borrower, no Admin)
export const USER_ROLES = [
  { value: "lender", label: "Lender" },
  { value: "investor", label: "Investor" },
  { value: "lawyer", label: "Lawyer" },
];

// All roles available for sign-in (Borrower shown but disabled)
export const SIGNIN_ROLES = [
  { value: "borrower", label: "Borrower", disabled: true },
  { value: "lender", label: "Lender" },
  { value: "investor", label: "Investor" },
  { value: "lawyer", label: "Lawyer" },
  { value: "admin", label: "Admin" },
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
