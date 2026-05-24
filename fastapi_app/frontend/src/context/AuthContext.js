import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const authAxios = useCallback(() => {
    const instance = axios.create({ baseURL: API_BASE_URL })
    if (token) {
      instance.defaults.headers.common.Authorization = `Bearer ${token}`
    }
    return instance
  }, [token])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password })
    const newToken = res.data.access_token
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const register = async (email, password, fullName) => {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      full_name: fullName || null
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authAxios }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
