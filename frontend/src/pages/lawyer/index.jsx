import { Route, Navigate } from 'react-router-dom'
import LawyerLayout from './LawyerLayout'
import Dashboard from './Dashboard'
import AssignedCases from './AssignedCases'
import TaskCenter from './TaskCenter'
import Notifications from './Notifications'
import Settings from './Settings'
import CaseDetail from './CaseDetail'
import Reports from './Reports'
import ContractReview from './ContractReview'

export default function LawyerRoutes() {
  return (
    <Route path="/lawyer" element={<LawyerLayout />}>
      <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="assigned-cases" element={<AssignedCases />} />
      <Route path="assigned-cases/:caseId" element={<CaseDetail />} />
      <Route path="task-center" element={<TaskCenter />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="settings" element={<Settings />} />
      <Route path="reports" element={<Reports />} />
      <Route path="contract-review" element={<ContractReview />} />
    </Route>
  )
}
