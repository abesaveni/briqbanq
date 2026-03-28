import { useState, useMemo } from 'react'
import ProgressBar from '../../components/ProgressBar'

/* ── helpers ───────────────────────────────────────────── */
const TEAM = ['David Richardson', 'Jennifer Wong', 'Patricia Davies', 'Michael Stevens', 'Thomas Chen']
const GROUPS_META = []

const AI_SUGGESTIONS = [
  '⚡ 3 critical tasks are due within 48 hours — consider re-assigning to free team members.',
  '📋 "Bank Transfer Authorization" has no progress notes. Add details to avoid blockers.',
  '🔗 "Transfer of Land Documentation" depends on "Mortgage Discharge Authority" — prioritise the discharge first.',
  '📅 Optimising your timeline could reduce estimated completion by 2 days.',
  '✅ Legal Requirements group is 60% complete — on track for settlement.',
]

const AI_GENERATED_TASKS = [
  { title: 'Confirm PEXA workspace access for all parties', priority: 'High', assignee: 'David Richardson', groupId: 'legal' },
  { title: 'Obtain council water & rates certificates', priority: 'Medium', assignee: 'Thomas Chen', groupId: 'financial' },
  { title: 'Prepare settlement statement for all parties', priority: 'Critical', assignee: 'Jennifer Wong', groupId: 'financial' },
  { title: 'Arrange power of attorney if required', priority: 'Medium', assignee: 'Patricia Davies', groupId: 'compliance' },
]

function priorityClass(p) {
  switch (p?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700'
    case 'high':     return 'bg-amber-100 text-amber-700'
    case 'medium':   return 'bg-yellow-100 text-yellow-800'
    default:         return 'bg-gray-100 text-gray-700'
  }
}
function statusClass(s) {
  switch (s) {
    case 'In Progress': return 'bg-blue-100 text-blue-700'
    case 'Completed':   return 'bg-green-100 text-green-700'
    case 'Blocked':     return 'bg-red-100 text-red-700'
    default:            return 'bg-gray-100 text-gray-600'
  }
}

function todayPlus(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── SVGs ──────────────────────────────────────────────── */
const BellIcon = ({ active }) => (
  <svg className={`w-4 h-4 ${active ? 'text-blue-600 fill-blue-100' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const ChevronDown = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
const ChevronUp   = () => <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>

/* ── Add Task Modal ─────────────────────────────────────── */
function AddTaskModal({ groups, onAdd, onClose }) {
  const [form, setForm] = useState({ title: '', priority: 'Medium', assignee: TEAM[0], due: '', groupId: groups[0]?.id || '', status: 'Not Started', notes: '' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const valid = form.title.trim() && form.due

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Add Task</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Task Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Confirm PEXA workspace access" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
              <select value={form.groupId} onChange={set('groupId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {groups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
              <select value={form.assignee} onChange={set('assignee')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {TEAM.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.due} onChange={set('due')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {['Not Started', 'In Progress', 'Blocked', 'Completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Additional notes or context…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium py-2 rounded-lg transition-colors">Cancel</button>
          <button type="button" disabled={!valid} onClick={() => onAdd(form)} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">Add Task</button>
        </div>
      </div>
    </div>
  )
}

/* ── Task Details Modal ─────────────────────────────────── */
function TaskDetailModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ ...task })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const toggleDone = () => setForm(p => ({ ...p, completed: !p.completed, status: !p.completed ? 'Completed' : 'In Progress' }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-3 ${form.completed ? 'bg-green-50' : 'bg-white'}`}>
          <div className="flex items-start gap-3">
            <input type="checkbox" checked={!!form.completed} onChange={toggleDone} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
            <div>
              <p className="text-base font-semibold text-gray-900">{task.title}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityClass(form.priority)}`}>{form.priority}</span>
                {form.status && <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusClass(form.status)}`}>{form.status}</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Assigned To</p>
              <p className="font-medium text-gray-800">{task.assignee}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
              <p className="font-medium text-gray-800">{task.due}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status || 'Not Started'} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {['Not Started', 'In Progress', 'Blocked', 'Completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select value={form.priority} onChange={set('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Progress Update</label>
            <textarea value={form.notes || ''} onChange={set('notes')} rows={4} placeholder="Add progress notes, blockers, or next steps…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {task.overdue !== undefined && task.overdue > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              This task is {task.overdue} day{task.overdue !== 1 ? 's' : ''} overdue.
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium py-2 rounded-lg transition-colors">Cancel</button>
          <button type="button" onClick={() => onSave(form)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Bell Reminder Modal ────────────────────────────────── */
function BellModal({ task, active, onSave, onClose }) {
  const [reminder, setReminder] = useState(active ? '1 day before' : '')
  const options = ['On due date', '1 day before', '2 days before', '3 days before', '1 week before']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Set Reminder — {task.title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {active && (
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              Reminder already set: {reminder || '1 day before'}
            </p>
          )}
          <p className="text-xs text-gray-500">Send a reminder notification:</p>
          {options.map(o => (
            <label key={o} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="radio" name="reminder" value={o} checked={reminder === o} onChange={() => setReminder(o)} className="text-blue-600" />
              <span className="text-sm text-gray-800">{o}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          {active && (
            <button type="button" onClick={() => onSave(null)} className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-lg transition-colors">Remove</button>
          )}
          <button type="button" onClick={() => onSave(reminder)} disabled={!reminder} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">Set Reminder</button>
        </div>
      </div>
    </div>
  )
}

/* ── AI Assistant Panel ─────────────────────────────────── */
function AiPanel({ tasks, onClose }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your AI Settlement Assistant. I\'ve analysed your current tasks and have some suggestions.' },
    ...AI_SUGGESTIONS.map(s => ({ role: 'ai', text: s })),
  ])
  const [thinking, setThinking] = useState(false)

  const pending = tasks.filter(t => !t.completed)
  const critical = tasks.filter(t => t.priority === 'Critical' && !t.completed)

  const handleAsk = () => {
    if (!input.trim()) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setThinking(true)
    setTimeout(() => {
      let reply = 'I\'m reviewing your settlement tasks based on your question…'
      if (/critical/i.test(q)) reply = `You have ${critical.length} critical task(s) pending: ${critical.map(t => t.title).join(', ')}.`
      else if (/overdue/i.test(q)) reply = `${tasks.filter(t => t.overdue > 0).length} task(s) are currently overdue. I recommend addressing Bank Transfer Authorization first.`
      else if (/assign/i.test(q)) reply = 'I recommend distributing tasks evenly: Thomas Chen (financial), David Richardson (legal & compliance), Patricia Davies (documentation).'
      else if (/complete|progress/i.test(q)) reply = `${tasks.filter(t => t.completed).length} of ${tasks.length} tasks are complete. You're on track for settlement.`
      else reply = `Based on the current ${pending.length} pending tasks, I recommend focusing on critical legal and financial items first to keep the settlement on schedule.`
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
      setThinking(false)
    }, 1200)
  }

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-purple-50 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          </div>
          <span className="text-sm font-semibold text-purple-900">AI Settlement Assistant</span>
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full font-medium">Active</span>
        </div>
        <button type="button" onClick={onClose} className="text-purple-400 hover:text-purple-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
      </div>
      <div className="h-56 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
              {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask about tasks, priorities, assignments…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <button type="button" onClick={handleAsk} disabled={!input.trim() || thinking} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────── */
export default function SettlementTab({ settlement: settlementProp, caseId }) {
  const summary = (settlementProp && typeof settlementProp.completed === 'number')
    ? settlementProp : { completed: 0, total: 0, overdue: 0, critical: 0 }

  // Flatten all tasks into a single state map: id -> task
  const [taskMap, setTaskMap] = useState(() => {
    const map = {}
    const initGroups = settlementProp?.groups || []
    initGroups.forEach(g => g.tasks.forEach(t => { map[t.id] = { ...t, groupId: g.id } }))
    return map
  })

  const [subTab,          setSubTab]          = useState('overview')
  const [aiPanelOpen,     setAiPanelOpen]     = useState(false)
  const [expandedGroups,  setExpandedGroups]  = useState({ legal: true, financial: true, documentation: true, 'property-inspection': false, compliance: false, 'party-communication': false })
  const [addTaskOpen,     setAddTaskOpen]      = useState(false)
  const [detailTask,      setDetailTask]       = useState(null)
  const [bellTask,        setBellTask]         = useState(null)
  const [bells,           setBells]            = useState({})      // id -> reminder string | null
  const [generating,      setGenerating]       = useState(false)
  const [autoAssigning,   setAutoAssigning]    = useState(false)
  const [optimizing,      setOptimizing]       = useState(false)
  const [actionBanner,    setActionBanner]     = useState(null)   // { text, type }

  const tasks = Object.values(taskMap)
  const allGroups = (settlementProp?.groups || []).map(g => ({
    ...g,
    tasks: g.tasks.map(t => taskMap[t.id] || t).concat(
      tasks.filter(t => t.groupId === g.id && !g.tasks.find(ot => ot.id === t.id))
    ),
  }))

  const completedCount = tasks.filter(t => t.completed).length
  const totalCount     = tasks.length
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length
  const overdueCount   = tasks.filter(t => (t.overdue ?? 0) > 0 && !t.completed).length
  const criticalCount  = tasks.filter(t => t.priority === 'Critical' && !t.completed).length
  const progressPct    = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const showBanner = (text, type = 'success') => {
    setActionBanner({ text, type })
    setTimeout(() => setActionBanner(null), 3500)
  }

  const updateTask = (id, patch) => {
    setTaskMap(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const toggleTask = (id) => {
    const t = taskMap[id]
    const next = !t.completed
    updateTask(id, { completed: next, status: next ? 'Completed' : (t.status === 'Completed' ? 'In Progress' : t.status) })
  }

  const handleAddTask = (form) => {
    const id = `custom-${Date.now()}`
    const dueFmt = form.due ? new Date(form.due).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    setTaskMap(prev => ({ ...prev, [id]: { id, title: form.title, priority: form.priority, assignee: form.assignee, due: dueFmt, completed: false, status: form.status, notes: form.notes, groupId: form.groupId } }))
    setAddTaskOpen(false)
    showBanner(`Task "${form.title}" added successfully.`)
  }

  const handleSaveDetail = (form) => {
    updateTask(form.id, form)
    setDetailTask(null)
    showBanner('Task updated successfully.')
  }

  const handleGenerateTasks = () => {
    setGenerating(true)
    setTimeout(() => {
      const newMap = { ...taskMap }
      AI_GENERATED_TASKS.forEach((t, i) => {
        const id = `ai-${Date.now()}-${i}`
        newMap[id] = { id, ...t, completed: false, status: 'Not Started', due: todayPlus(3 + i * 2) }
      })
      setTaskMap(newMap)
      setGenerating(false)
      showBanner(`AI generated ${AI_GENERATED_TASKS.length} new tasks based on settlement requirements.`)
    }, 1800)
  }

  const handleAutoAssign = () => {
    setAutoAssigning(true)
    setTimeout(() => {
      const unassigned = tasks.filter(t => !t.completed && (!t.assignee || t.assignee === 'Unassigned'))
      if (unassigned.length === 0) {
        setAutoAssigning(false)
        showBanner('All tasks already have assignees.', 'info')
        return
      }
      const patch = {}
      unassigned.forEach((t, i) => {
        patch[t.id] = { ...t, assignee: TEAM[i % TEAM.length] }
      })
      setTaskMap(prev => ({ ...prev, ...patch }))
      setAutoAssigning(false)
      showBanner(`Auto-assigned ${unassigned.length} task(s) to team members.`)
    }, 1400)
  }

  const handleOptimizeTimeline = () => {
    setOptimizing(true)
    setTimeout(() => {
      const pending = tasks.filter(t => !t.completed).sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
      })
      const patch = {}
      pending.forEach((t, i) => {
        patch[t.id] = { ...t, due: todayPlus(i + 1) }
      })
      setTaskMap(prev => ({ ...prev, ...patch }))
      setOptimizing(false)
      showBanner(`Timeline optimised — ${pending.length} tasks redistributed by priority.`)
    }, 1600)
  }

  const handleBellSave = (reminder) => {
    setBells(prev => ({ ...prev, [bellTask.id]: reminder }))
    setBellTask(null)
    if (reminder) showBanner(`Reminder set: "${reminder}" for "${bellTask.title}".`)
    else          showBanner(`Reminder removed for "${bellTask.title}".`, 'info')
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      {addTaskOpen  && <AddTaskModal groups={GROUPS_META} onAdd={handleAddTask} onClose={() => setAddTaskOpen(false)} />}
      {detailTask   && <TaskDetailModal task={detailTask} onSave={handleSaveDetail} onClose={() => setDetailTask(null)} />}
      {bellTask     && <BellModal task={bellTask} active={!!bells[bellTask.id]} onSave={handleBellSave} onClose={() => setBellTask(null)} />}

      {/* Action banner */}
      {actionBanner && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border ${
          actionBanner.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={actionBanner.type === 'info' ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M5 13l4 4L19 7'} />
          </svg>
          {actionBanner.text}
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setSubTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>Settlement Overview</button>
        <button type="button" onClick={() => setSubTab('pexa')}     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subTab === 'pexa'     ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>PEXA Settlement</button>
      </div>

      {subTab === 'pexa' && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">PEXA Workspace</h3>
          <p className="text-sm text-gray-500">Connect to PEXA to manage electronic settlement. Case: <strong>{caseId || c?.case_number || '—'}</strong></p>
          <button type="button" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">Connect to PEXA</button>
        </div>
      )}

      {subTab === 'overview' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Completed', value: `${completedCount}/${totalCount}`, sub: <ProgressBar value={progressPct} color="blue" />, accent: 'blue' },
              { label: 'In Progress', value: inProgressCount, icon: <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>, bg: 'bg-blue-100' },
              { label: 'Overdue',     value: overdueCount,   icon: <svg className="w-5 h-5 text-red-600"  fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>, bg: 'bg-red-100' },
              { label: 'Critical',    value: criticalCount,  icon: <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>, bg: 'bg-orange-100' },
              { label: 'Est. Completion', value: summary.estimatedCompletion ?? '08 Mar 2026', sub: <p className="text-xs text-gray-400">{summary.daysRemaining ?? 5} days remaining</p> },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                {c.icon ? (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg}`}>{c.icon}</div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{c.value}</p>
                      <p className="text-xs text-gray-500">{c.label}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-500 mb-1">{c.label}</p>
                    <p className="text-xl font-bold text-gray-900">{c.value}</p>
                    {c.sub}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* AI Settlement Assistant toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">AI Settlement Assistant</h3>
                  <p className="text-xs text-gray-500">Automate task creation, assignments, and timeline optimisation.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setAddTaskOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add Task
                </button>
                <button type="button" onClick={handleGenerateTasks} disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors">
                  {generating ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : '✨'}
                  {generating ? 'Generating…' : 'Generate Tasks'}
                </button>
                <button type="button" onClick={handleAutoAssign} disabled={autoAssigning}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors">
                  {autoAssigning ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : '👤'}
                  {autoAssigning ? 'Assigning…' : 'Auto-Assign'}
                </button>
                <button type="button" onClick={handleOptimizeTimeline} disabled={optimizing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors">
                  {optimizing ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : '📅'}
                  {optimizing ? 'Optimising…' : 'Optimize Timeline'}
                </button>
                <button type="button" onClick={() => setAiPanelOpen(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${aiPanelOpen ? 'bg-purple-600 text-white' : 'border border-purple-300 text-purple-700 hover:bg-purple-50'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  AI Assist
                </button>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          {aiPanelOpen && <AiPanel tasks={tasks} onClose={() => setAiPanelOpen(false)} />}

          {/* Alert cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <div>
                <p className="text-sm font-semibold text-red-900">Critical Tasks</p>
                <p className="text-base font-bold text-red-800">{criticalCount} critical task{criticalCount !== 1 ? 's' : ''} pending</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <div>
                <p className="text-sm font-semibold text-amber-900">Due Soon</p>
                <p className="text-base font-bold text-amber-800">{tasks.filter(t => !t.completed && (t.overdue ?? 0) >= 0 && (t.overdue ?? 0) <= 3).length} tasks due within 3 days</p>
              </div>
            </div>
          </div>

          {/* Task accordion groups */}
          <div className="space-y-2">
            {allGroups.map(group => {
              const gtasks    = group.tasks
              const gDone     = gtasks.filter(t => t.completed).length
              const gTotal    = gtasks.length
              const gPct      = gTotal ? Math.round((gDone / gTotal) * 100) : 0
              const isOpen    = expandedGroups[group.id] !== false

              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button type="button" onClick={() => setExpandedGroups(p => ({ ...p, [group.id]: !p[group.id] }))}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 shrink-0">{group.title}</span>
                      <span className="text-xs text-gray-400 shrink-0">{gDone}/{gTotal} — {gPct}%</span>
                      <div className="hidden sm:block w-24 shrink-0"><ProgressBar value={gPct} color="blue" /></div>
                    </div>
                    <span className="shrink-0 ml-2">{isOpen ? <ChevronUp /> : <ChevronDown />}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200 px-5 pb-3">
                      <ul className="space-y-0 pt-1">
                        {gtasks.map(task => {
                          const t       = taskMap[task.id] || task
                          const bellOn  = !!bells[t.id]
                          return (
                            <li key={t.id} className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${t.completed ? 'opacity-60' : ''}`}>
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={!!t.completed}
                                onChange={() => toggleTask(t.id)}
                                className="rounded border-gray-300 text-blue-600 h-4 w-4 shrink-0 cursor-pointer"
                              />
                              {/* Task info */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-gray-900 ${t.completed ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${priorityClass(t.priority)}`}>{t.priority}</span>
                                  {t.status && <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${statusClass(t.status)}`}>{t.status}</span>}
                                  {bellOn && <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-100"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z"/></svg>{bells[t.id]}</span>}
                                  <span className="text-xs text-gray-400">👤 {t.assignee}</span>
                                  <span className="text-xs text-gray-400">📅 {t.due}</span>
                                  {(t.overdue ?? 0) > 0 && !t.completed && (
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{t.overdue}d overdue</span>
                                  )}
                                </div>
                                {t.notes && <p className="text-xs text-gray-500 mt-1 italic truncate">{t.notes}</p>}
                              </div>
                              {/* Bell */}
                              <button
                                type="button"
                                title={bellOn ? 'Edit reminder' : 'Set reminder'}
                                onClick={() => setBellTask(t)}
                                className={`p-1.5 rounded-lg transition-colors shrink-0 ${bellOn ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                              >
                                <BellIcon active={bellOn} />
                              </button>
                              {/* Details */}
                              <button
                                type="button"
                                onClick={() => setDetailTask(t)}
                                className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                Details
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
