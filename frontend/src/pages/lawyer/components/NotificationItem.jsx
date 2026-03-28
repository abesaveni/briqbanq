export default function NotificationItem({ item, onMarkRead, onDelete }) {
  return (
    <div className={`rounded-lg border p-4 ${item.unread ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">{item.title}</p>
            {item.unread && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#6366F1] text-white">
                New
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{item.time}</span>
          {item.unread && onMarkRead && (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              Mark read
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="text-sm font-medium text-red-500 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
