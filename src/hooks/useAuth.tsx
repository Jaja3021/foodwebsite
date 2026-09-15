import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, type SessionUser } from '../lib/auth'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<SessionUser>
  signUp: (input: { email: string; password: string; full_name: string; phone?: string }) => Promise<SessionUser>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const u = await auth.getUser()
    setUser(u)
  }, [])

  useEffect(() => {
    let active = true
    auth
      .getUser()
      .then((u) => active && setUser(u))
      .finally(() => active && setLoading(false))
    const off = auth.onChange((u) => active && setUser(u))
    return () => {
      active = false
      off()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        const u = await auth.signIn(email, password)
        setUser(u)
        return u
      },
      signUp: async (input) => {
        const u = await auth.signUp(input)
        setUser(u)
        return u
      },
      signOut: async () => {
        await auth.signOut()
        setUser(null)
      },
      refresh,
    }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
