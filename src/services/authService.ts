import api from './api'

interface LoginCredentials {
  email: string
  token_id: string
  user_role: string
}

interface LoginResponse {
  token: string
  user: {
    _id: string
    email: string
    user_name: string
    user_role: string
    user_status: string
  }
}

export const authService = {
  // Admin login using existing user API
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/api/v1/user-info/create-login-user/app', credentials)
    const { token, ...user } = response.data.data
    return { token, user }
  },

  // Verify token using existing user API
  verifyToken: async () => {
    const response = await api.get('/api/v1/user-info/verify-token')
    return response.data
  },

  // Logout (client-side only)
  logout: async () => {
    // Just return success since logout is handled client-side
    return { success: true }
  },
}