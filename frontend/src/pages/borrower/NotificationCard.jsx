export default function NotificationCard({ notification, onMarkRead, onDelete }) {
  return (
    <div className={`p-4 rounded-lg border ${notification.read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-slate-900">{notification.title}</h4>
            {notification.isNew && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-medium">New</span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
          <p className="text-xs text-slate-500 mt-2">{notification.time}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {!notification.read && onMarkRead && (
            <button type="button" onClick={() => onMarkRead(notification.id)} className="text-xs text-indigo-600 hover:text-indigo-700">
              Mark as read
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(notification.id)} className="text-xs text-red-500 hover:text-red-600">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
