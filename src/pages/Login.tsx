import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { toast } from 'react-toastify'
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth'
import { app } from '../firebase/config'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      if (!user.email) {
        toast.error('Email is required for admin access')
        return
      }
      const idToken = await user.getIdToken()
      const response = await authService.login({ email: user.email, token_id: idToken, user_role: 'admin' })
      if (response.user.user_role !== 'admin') {
        toast.error('Access denied. Admin privileges required.')
        await auth.signOut()
        return
      }
      login(response.token, response.user)
      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.status === 401) {
        toast.error('Access denied. Admin privileges required.')
      } else {
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-base">PN</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-none">PNC Nikah</p>
            <p className="text-indigo-200 text-xs mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your<br />platform with ease.
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
            Full control over biodatas, users, payments, and refunds — all in one place.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <ShieldCheckIcon className="h-5 w-5 text-indigo-300" />
            <span className="text-indigo-300 text-sm">Restricted to admin accounts only</span>
          </div>
        </div>

        {/* Footer quote */}
        <p className="relative text-indigo-300/60 text-xs">© 2025 PNC Soft Tech. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PN</span>
            </div>
            <p className="text-gray-900 font-semibold">PNC Nikah Admin</p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-500">
              Use your admin Google account to continue
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Only accounts with <span className="font-semibold text-gray-600">admin</span> privileges can access this panel.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
