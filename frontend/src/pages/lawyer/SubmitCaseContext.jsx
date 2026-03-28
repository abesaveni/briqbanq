import { createContext, useContext, useState, useCallback } from 'react'

const SubmitCaseContext = createContext(null)

export function SubmitCaseProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openSubmitCase = useCallback(() => setOpen(true), [])
  const closeSubmitCase = useCallback(() => setOpen(false), [])

  return (
    <SubmitCaseContext.Provider value={{ open, openSubmitCase, closeSubmitCase }}>
      {children}
    </SubmitCaseContext.Provider>
  )
}

export function useSubmitCase() {
  const ctx = useContext(SubmitCaseContext)
  if (!ctx) throw new Error('useSubmitCase must be used within SubmitCaseProvider')
  return ctx
}
