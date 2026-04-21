// src/components/admin/case/InternalNotesTab.jsx
import { useState, useEffect } from 'react'
import { Pin, Trash2, PlusCircle, Loader2, StickyNote } from 'lucide-react'
import { useCaseContext } from '../../../context/CaseContext'
import { casesService } from '../../../api/dataService'

const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'recovery_strategy', label: 'Recovery Strategy' },
  { value: 'borrower_conduct', label: 'Borrower Conduct' },
  { value: 'legal', label: 'Legal' },
  { value: 'document_review', label: 'Document Review' },
  { value: 'risk_review', label: 'Risk Review' },
]

const TYPE_COLOURS = {
  general: 'bg-slate-100 text-slate-600',
  recovery_strategy: 'bg-blue-100 text-blue-700',
  borrower_conduct: 'bg-orange-100 text-orange-700',
  legal: 'bg-purple-100 text-purple-700',
  document_review: 'bg-teal-100 text-teal-700',
  risk_review: 'bg-red-100 text-red-700',
}

export default function InternalNotesTab() {
  const { caseData } = useCaseContext()
  const caseId = caseData?._id || caseData?.id

  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState(null)

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fetchNotes = async () => {
    if (!caseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await casesService.getInternalNotes(caseId)
      if (res.success) {
        setNotes(Array.isArray(res.data) ? res.data : [])
      } else {
        setError(res.error || 'Failed to load notes')
      }
    } catch {
      setError('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotes() }, [caseId])

  const handleAdd = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await casesService.addInternalNote(caseId, {
        content: content.trim(),
        note_type: noteType,
        is_pinned: pinned,
      })
      if (res.success) {
        setContent('')
        setPinned(false)
        setNoteType('general')
        await fetchNotes()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePin = async (noteId) => {
    try {
      await fetch(`/api/v1/cases/${caseId}/internal-notes/${noteId}`, {
        method: 'PATCH',
        headers,
      })
      await fetchNotes()
    } catch {}
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await casesService.deleteInternalNote(caseId, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch {}
  }

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const regularNotes = notes.filter(n => !n.is_pinned)

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Compose new note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-indigo-500" /> Add Internal Note
        </p>
        <textarea
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white"
          placeholder="Write your internal note here..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={noteType}
            onChange={e => setNoteType(e.target.value)}
            className="h-9 text-sm border border-slate-200 rounded-lg px-2 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
            Pin this note
          </label>
          <button
            onClick={handleAdd}
            disabled={submitting || !content.trim()}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading notes...
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && notes.length === 0 && !error && (
        <div className="text-center py-10 text-slate-400 text-sm">No internal notes yet. Add one above.</div>
      )}

      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Pin className="w-3 h-3" /> Pinned
          </p>
          {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onPin={handleTogglePin} onDelete={handleDelete} />)}
        </div>
      )}
      {regularNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</p>}
          {regularNotes.map(note => <NoteCard key={note.id} note={note} onPin={handleTogglePin} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onPin, onDelete }) {
  const typeLabel = NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type
  const typeColour = TYPE_COLOURS[note.note_type] || TYPE_COLOURS.general
  const date = note.created_at
    ? new Date(note.created_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`bg-white border rounded-xl p-4 space-y-2 ${note.is_pinned ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeColour}`}>{typeLabel}</span>
          {note.author_role && (
            <span className="text-[11px] text-slate-400 font-medium">{note.author_role}</span>
          )}
          {note.is_pinned && <Pin className="w-3 h-3 text-indigo-500" />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            title={note.is_pinned ? 'Unpin' : 'Pin'}
            onClick={() => onPin(note.id)}
            className={`p-1 rounded hover:bg-slate-100 transition-colors ${note.is_pinned ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-400'}`}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            title="Delete"
            onClick={() => onDelete(note.id)}
            className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
      <p className="text-xs text-slate-400">{date}</p>
    </div>
  )
}
