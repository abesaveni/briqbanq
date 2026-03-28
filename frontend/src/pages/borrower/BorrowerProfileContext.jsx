import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const defaultValue = { profile: null, setProfile: () => {}, user: null, setUser: () => {} }
export const BorrowerProfileContext = createContext(defaultValue)

export function useBorrowerProfile() {
  return useContext(BorrowerProfileContext)
}

export function BorrowerProfileProvider({ children }) {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (authUser) {
      setUser(authUser)
    }
  }, [authUser])
  return (
    <BorrowerProfileContext.Provider value={{ profile, setProfile, user, setUser }}>
      {children}
    </BorrowerProfileContext.Provider>
  )
}
