import Badge from './Badge'

const statusToVariant = {
  'In Auction': 'in-auction',
  Active: 'pending',
  Completed: 'completed',
  Pending: 'pending',
  'Under Contract': 'under-contract',
  'Brickbanq Now': 'brickbanq-now',
  Urgent: 'urgent',
  High: 'high',
  Medium: 'medium',
  Done: 'done',
  Overdue: 'overdue',
  Protected: 'protected',
  'In Progress': 'in-progress',
  Draft: 'draft',
  Cancelled: 'cancelled',
}

export default function StatusPill({ status }) {
  const variant = statusToVariant[status] || 'pending'
  return <Badge label={status} variant={variant} />
}
