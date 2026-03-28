export default function TimelineEvent({ event }) {
  const getDotColor = (s) => {
    switch (s) {
      case 'complete':
        return 'bg-green-600'
      case 'info':
        return 'bg-blue-600'
      default:
        return 'bg-amber-600'
    }
  }

  const title = event?.title ?? event?.description ?? ''
  const date = event?.date ?? event?.created_at ?? event?.timestamp ?? ''
  const status = event?.status ?? 'info'

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className={`w-2 h-2 ${getDotColor(status)} rounded-full mt-1.5`}></div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{date}</p>
      </div>
    </div>
  )
}
