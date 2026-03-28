import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'brickbanq_borrower_profile'

const defaultProfile = {
  name: 'David Williams',
  role: 'Investor',
  initials: 'DW',
}

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        name: parsed.name ?? defaultProfile.name,
        role: parsed.role ?? defaultProfile.role,
        initials: parsed.initials ?? defaultProfile.initials,
      }
    }
  } catch (_) {}
  return defaultProfile
}

const BorrowerProfileContext = createContext(null)

export const useBorrowerProfile = () => {
  const ctx = useContext(BorrowerProfileContext)
  if (!ctx) return { profile: defaultProfile, updateProfile: () => {} }
  return ctx
}

export const BorrowerProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(loadStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (_) {}
  }, [profile])

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates }
      if (updates.name != null && updates.initials == null) {
        const parts = String(updates.name).trim().split(/\s+/)
        next.initials = parts.map((s) => s[0]).join('').toUpperCase().slice(0, 2) || prev.initials
      }
      return next
    })
  }, [])

  return (
    <BorrowerProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </BorrowerProfileContext.Provider>
  )
}
