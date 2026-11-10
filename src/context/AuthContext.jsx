import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserProfile } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshProfile(u = auth.currentUser) {
    setProfile(u ? await getUserProfile(u.uid) : null)
  }

  useEffect(() => {
    // Runs when the page loads and every time someone logs in or out
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      try {
        await refreshProfile(u)
      } catch {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    refreshProfile,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)