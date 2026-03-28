import StatusBadge from './StatusBadge'

export default function TaskItem({ task, onToggle }) {
  if (!task) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle && onToggle(task.id)}
        className="mt-1 rounded border-gray-300 text-[#6366F1] focus:ring-[#6366F1]"
        aria-label={`Mark ${task.title} complete`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
          {task.dueDate && (
            <span className="text-xs text-gray-500">{task.dueDate}</span>
          )}
        </div>
      </div>
      <span className="text-gray-300 select-none" aria-hidden>⋮⋮</span>
    </div>
  )
}
