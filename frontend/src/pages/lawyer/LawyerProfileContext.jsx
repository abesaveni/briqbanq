import { createContext, useContext, useState } from 'react'

const defaultUser = { name: 'David Williams', role: 'Lawyer', initials: 'DW' }

const LawyerProfileContext = createContext({
  user: defaultUser,
  setUser: () => {},
})

export function useLawyerProfile() {
  return useContext(LawyerProfileContext)
}

export function LawyerProfileProvider({ children }) {
  const [user, setUser] = useState(defaultUser)
  return (
    <LawyerProfileContext.Provider value={{ user, setUser }}>
      {children}
    </LawyerProfileContext.Provider>
  )
}
