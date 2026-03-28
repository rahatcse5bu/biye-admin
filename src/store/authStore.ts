import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  _id: string
  email: string
  user_name: string
  user_role: string
  user_status: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      login: (token: string, user: User) => 
        set({ isAuthenticated: true, token, user }),
      logout: () => 
        set({ isAuthenticated: false, token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)