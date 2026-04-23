import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from './components/Badge'
import { taskService } from '../../api/dataService'
import { Calendar } from 'lucide-react'

const priorityVariant = { Urgent: 'urgent', High: 'high', Medium: 'medium', Done: 'done' }
const statusVariant = { Overdue: 'overdue', Pending: 'pending', InProgress: 'in-progress', Completed: 'completed' }

const normalizeStatus = (s) => {
  if (!s) return 'Pending'
  const lower = s.toLowerCase().replace(/[_ ]/g, '')
  if (lower === 'inprogress') return 'InProgress'
  if (lower === 'completed' || lower === 'done') return 'Completed'
  if (lower === 'overdue') return 'Overdue'
  if (lower === 'pending') return 'Pending'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const normalizePriority = (p) => {
  if (!p) return 'Low'
  const cap = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  return ['Urgent', 'High', 'Medium', 'Low'].includes(cap) ? cap : 'Low'
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']
const MODULE_OPTIONS = ['Brickbanq', 'Accounting', 'Compliance', 'Legal Review', 'Documentation', 'AML/CTF']

export default function TaskCenter() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [priorityFilter, setPriorityFilter] = useState('All Priorities')
  const [moduleFilter, setModuleFilter] = useState('All Modules')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortOrder, setSortOrder] = useState('asc')

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Low',
    dueDate: '',
    module: 'Brickbanq',
  })

  useEffect(() => {
    taskService.getTasks()
      .then((res) => {
        const data = res.data || res || []
        setTasks(data.map((t) => ({
          ...t,
          id: t.id ?? t.task_id,
          desc: t.desc || t.description || '',
          status: normalizeStatus(t.status),
          priority: normalizePriority(t.priority),
          dueLabel: formatDueLabel(t.dueDate || t.due_date),
          dueDateRaw: t.dueDate || t.due_date || '',
          module: t.module || 'Brickbanq',
          tags: t.tags || [],
        })))
      })
      .catch(() => {})
  }, [])

  const formatDueLabel = (dateStr) => {
    if (!dateStr || !String(dateStr).trim()) return null
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const due = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (due < today) return 'Overdue'
    if (due.getTime() === today.getTime()) return 'Due Today'
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleNewTask = () => setShowNewTaskModal(true)
  const setNewTaskField = (field, value) => setNewTaskForm((f) => ({ ...f, [field]: value }))
  const resetNewTaskForm = () =>
    setNewTaskForm({ title: '', description: '', priority: 'Low', dueDate: '', module: 'Brickbanq' })

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) return
    const payload = {
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || '',
      priority: newTaskForm.priority,
      due_date: newTaskForm.dueDate || null,
      module: newTaskForm.module,
    }
    try {
      const res = await taskService.createTask(payload)
      const created = res.data || res
      setTasks((prev) => [...prev, {
        ...created,
        id: created.id ?? created.task_id,
        desc: created.description || '',
        status: normalizeStatus(created.status) || 'Pending',
        priority: normalizePriority(created.priority) || newTaskForm.priority,
        dueLabel: formatDueLabel(created.due_date) || '—',
        dueDateRaw: created.due_date || '',
        module: created.module || newTaskForm.module,
        tags: created.tags || [],
      }])
    } catch (_) {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`
      setTasks((prev) => [...prev, { id, title: newTaskForm.title.trim(), desc: newTaskForm.description.trim() || '', status: 'Pending', priority: newTaskForm.priority, dueLabel: formatDueLabel(newTaskForm.dueDate) || '—', tags: [], caseId: null, module: newTaskForm.module }])
    }
    resetNewTaskForm()
    setShowNewTaskModal(false)
  }

  const handleCloseNewTaskModal = () => {
    setShowNewTaskModal(false)
    setEditingTask(null)
    resetNewTaskForm()
  }

  const handleViewCase = (caseId) => () => {
    if (caseId) navigate(`/lawyer/assigned-cases/${caseId}`)
  }

  const handleStartTask = (taskId) => () => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'InProgress' } : t)))
    taskService.updateTask(taskId, { status: 'InProgress' }).catch(() => {})
  }

  const handleMarkComplete = (taskId) => () => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'Completed' } : t)))
    taskService.updateTask(taskId, { status: 'Completed' }).catch(() => {})
  }

  const handleMoveToPending = (taskId) => () => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'Pending' } : t)))
    taskService.updateTask(taskId, { status: 'Pending' }).catch(() => {})
  }

  const handleToggleCheck = (taskId) => () => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const newStatus = t.status === 'Completed' ? 'Pending' : 'Completed'
        taskService.updateTask(taskId, { status: newStatus }).catch(() => {})
        return { ...t, status: newStatus }
      })
    )
  }

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(taskId)))
    if (editingTask?.id !== undefined && String(editingTask.id) === String(taskId)) handleCloseNewTaskModal()
    try { await taskService.deleteTask(taskId) } catch (_) {}
  }

  const handleEditTask = (task) => () => {
    setEditingTask(task)
    setNewTaskForm({
      title: task.title,
      description: task.desc || '',
      priority: task.priority || 'Low',
      dueDate: task.dueDateRaw || '',
      module: task.module || 'Brickbanq',
    })
  }

  const handleSaveEditTask = async () => {
    if (!editingTask || !newTaskForm.title.trim()) return
    const updates = {
      title: newTaskForm.title.trim(),
      desc: newTaskForm.description.trim() || 'No description',
      priority: newTaskForm.priority,
      dueLabel: formatDueLabel(newTaskForm.dueDate) || editingTask.dueLabel,
      dueDateRaw: newTaskForm.dueDate,
      module: newTaskForm.module,
    }
    setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, ...updates } : t))
    try { await taskService.updateTask(editingTask.id, { title: updates.title, description: newTaskForm.description.trim(), priority: newTaskForm.priority, due_date: newTaskForm.dueDate || null, module: newTaskForm.module }) } catch (_) {}
    handleCloseNewTaskModal()
  }

  const applyQuickFilter = (filter) => {
    if (filter === 'total') {
      setStatusFilter('All Status')
      setPriorityFilter('All Priorities')
      setModuleFilter('All Modules')
      return
    }
    if (filter === 'active') {
      setStatusFilter('Active')
      setPriorityFilter('All Priorities')
      return
    }
    if (filter === 'overdue') {
      setStatusFilter('Overdue')
      setPriorityFilter('All Priorities')
      return
    }
    if (filter === 'dueToday') {
      setStatusFilter('Due Today')
      setPriorityFilter('All Priorities')
      return
    }
    if (filter === 'urgent') {
      setPriorityFilter('Urgent')
      setStatusFilter('All Status')
      return
    }
    if (filter === 'inProgress') {
      setStatusFilter('In Progress')
      setPriorityFilter('All Priorities')
      return
    }
    if (filter === 'completed') {
      setStatusFilter('Completed')
      setPriorityFilter('All Priorities')
      return
    }
  }

  const handleSortClick = (key) => {
    if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else setSortBy(key)
  }

  const searchLower = search.trim().toLowerCase()
  const filteredTasks = tasks
    .filter((t) => {
      if (searchLower) {
        const matchSearch =
          t.title?.toLowerCase().includes(searchLower) ||
          t.desc?.toLowerCase().includes(searchLower) ||
          t.caseId?.toLowerCase().includes(searchLower) ||
          (t.tags || []).some((tag) => String(tag).toLowerCase().includes(searchLower))
        if (!matchSearch) return false
      }
      if (statusFilter !== 'All Status') {
        if (statusFilter === 'Active' && t.status === 'Completed') return false
        if (statusFilter === 'In Progress' && t.status !== 'InProgress') return false
        if (statusFilter === 'Overdue' && !t.dueLabel?.startsWith('Overdue')) return false
        if (statusFilter === 'Due Today' && t.dueLabel !== 'Due Today') return false
        if (statusFilter === 'Completed' && t.status !== 'Completed') return false
        if (
          !['Active', 'In Progress', 'Overdue', 'Due Today', 'Completed'].includes(statusFilter) &&
          t.status !== statusFilter
        )
          return false
      }
      if (priorityFilter !== 'All Priorities' && t.priority !== priorityFilter) return false
      if (moduleFilter !== 'All Modules' && t.module !== moduleFilter) return false
      return true
    })
    .sort((a, b) => {
      const mult = sortOrder === 'asc' ? 1 : -1
      if (sortBy === 'priority') {
        const order = { Urgent: 0, High: 1, Medium: 2, Low: 3, Done: 4 }
        return ((order[a.priority] ?? 3) - (order[b.priority] ?? 3)) * mult
      }
      if (sortBy === 'status') {
        const order = { Overdue: 0, InProgress: 1, Pending: 2, Completed: 3 }
        return ((order[a.status] ?? 2) - (order[b.status] ?? 2)) * mult
      }
      if (sortBy === 'created') return ((b.id || 0) - (a.id || 0)) * mult
      if (sortBy === 'dueDate') {
        const order = (x) => {
          if (!x.dueLabel) return 4
          if (x.dueLabel.startsWith('Overdue')) return 0
          if (x.dueLabel === 'Due Today') return 1
          if (x.dueLabel === 'Tomorrow') return 2
          return 3
        }
        return (order(a) - order(b)) * mult
      }
      return 0
    })

  const activeTasks = tasks.filter((t) => t.status !== 'Completed').length
  const overdueCount = tasks.filter((t) => t.dueLabel?.startsWith('Overdue')).length
  const dueTodayCount = tasks.filter((t) => t.dueLabel === 'Due Today').length
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length
  const inProgressCount = tasks.filter((t) => t.status === 'InProgress').length
  const completedCount = tasks.filter((t) => t.status === 'Completed').length

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Task Center</h1>
          <p className="text-sm text-slate-500">Manage all your tasks across BriqBanq</p>
        </div>
        <button
          type="button"
          onClick={handleNewTask}
          className="bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          type="button"
          onClick={() => applyQuickFilter('total')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-500">📋</span>
          <div>
            <p className="text-lg font-bold text-slate-800">{tasks.length}</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('active')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-blue-600">✓</span>
          <div>
            <p className="text-xl font-bold text-slate-800">{activeTasks}</p>
            <p className="text-xs text-gray-500">Active Tasks</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('overdue')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-red-500">⊗</span>
          <div>
            <p className="text-xl font-bold text-red-500">{overdueCount}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('dueToday')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-amber-500">🕐</span>
          <div>
            <p className="text-xl font-bold text-slate-800">{dueTodayCount}</p>
            <p className="text-xs text-gray-500">Due Today</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('urgent')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-red-500">🚩</span>
          <div>
            <p className="text-xl font-bold text-slate-800">{urgentCount}</p>
            <p className="text-xs text-gray-500">Urgent</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('inProgress')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-blue-600">📊</span>
          <div>
            <p className="text-xl font-bold text-slate-800">{inProgressCount}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => applyQuickFilter('completed')}
          className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-emerald-500">✓</span>
          <div>
            <p className="text-xl font-bold text-slate-800">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title, case number, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Overdue</option>
          <option>Due Today</option>
          <option>Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option>All Priorities</option>
          <option>Urgent</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option>All Modules</option>
          {MODULE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSortClick('dueDate')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'dueDate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </button>
        <button
          type="button"
          onClick={() => handleSortClick('priority')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'priority' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Priority {sortBy === 'priority' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </button>
        <button
          type="button"
          onClick={() => handleSortClick('status')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Status {sortBy === 'status' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </button>
        <button
          type="button"
          onClick={() => handleSortClick('created')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${sortBy === 'created' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Created {sortBy === 'created' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
        </button>
        <span className="text-sm text-gray-500 ml-auto">Showing {filteredTasks.length} of {tasks.length} tasks</span>
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white border border-gray-200 rounded-lg p-4 ${task.status === 'Completed' ? 'opacity-75' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={handleToggleCheck(task.id)}
                  className="mt-0.5 shrink-0"
                  aria-label={task.status === 'Completed' ? 'Mark incomplete' : 'Mark complete'}
                >
                  <span
                    className={`inline-block w-5 h-5 border-2 rounded flex items-center justify-center text-xs ${task.status === 'Completed' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}
                  >
                    {task.status === 'Completed' && '✓'}
                  </span>
                </button>
                <div className="min-w-0">
                  <p className={`text-sm font-medium text-slate-800 ${task.status === 'Completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{task.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge label={task.priority} variant={priorityVariant[task.priority] || 'medium'} />
                    <Badge label={task.status} variant={statusVariant[task.status] || 'pending'} />
                    {task.dueLabel && (
                      <Badge
                        label={task.dueLabel}
                        variant={task.dueLabel.startsWith('Overdue') ? 'overdue' : 'pending'}
                      />
                    )}
                    {task.caseId && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">{task.caseId}</span>
                    )}
                    {task.module && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">{task.module}</span>
                    )}
                    {(task.tags || []).map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {task.caseId && (
                  <button
                    type="button"
                    onClick={handleViewCase(task.caseId)}
                    className="border border-gray-300 bg-white text-gray-700 text-xs px-2 py-1 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
                  >
                    View Case
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                )}
                {task.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={handleStartTask(task.id)}
                    className="border border-blue-600 text-blue-600 text-xs px-2 py-1 rounded-lg hover:bg-blue-50"
                  >
                    Start Task
                  </button>
                )}
                {task.status === 'InProgress' && (
                  <button
                    type="button"
                    onClick={handleMoveToPending(task.id)}
                    className="border border-gray-300 bg-white text-gray-700 text-xs px-2 py-1 rounded-lg hover:bg-gray-50"
                  >
                    Move to Pending
                  </button>
                )}
                {task.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={handleMarkComplete(task.id)}
                    className="bg-blue-600 hover:bg-[#2a5fc4] text-white text-xs px-2 py-1 rounded-lg"
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEditTask(task)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  aria-label="Edit task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showNewTaskModal || editingTask) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 id="task-modal-title" className="text-lg font-semibold text-slate-800">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                type="button"
                onClick={handleCloseNewTaskModal}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskField('title', e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskField('description', e.target.value)}
                  placeholder="Enter task description..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-y min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskField('priority', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newTaskForm.dueDate}
                      onChange={(e) => setNewTaskField('dueDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white h-[38px] appearance-none"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                <select
                  value={newTaskForm.module}
                  onChange={(e) => setNewTaskField('module', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {MODULE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseNewTaskModal}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {editingTask ? (
                <button
                  type="button"
                  onClick={handleSaveEditTask}
                  disabled={!newTaskForm.title?.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-[#2a5fc4] disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-medium rounded-lg"
                >
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-[#2a5fc4] text-white text-sm font-medium rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
