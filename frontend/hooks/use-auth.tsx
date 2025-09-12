"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, LoginCredentials, RegisterCredentials } from "@/types"
import { AuthManager } from "@/lib/auth"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
  let mounted = true

  async function init() {
    try {
      const userFromServer = await getCurrentUser()
      if (!mounted) return

      if (userFromServer) {
        setUser(userFromServer)
        // sync into AuthManager for consistency
        AuthManager.setUser(userFromServer)
      } else {
        AuthManager.clearAuth()
        setUser(null)
      }
    } finally {
      if (mounted) setIsLoading(false)
    }
  }

  init()
  return () => { mounted = false }
}, [])


  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await apiClient.signin(credentials)

 

      // Based on your backend response structure
      if (response.success && response.data) {
        // Store tokens
        const tokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.refreshToken // This comes from root level
        }
        
        // Create user object
        const userData: User = {
          id: response.userId,
          email: credentials.email
        }

        AuthManager.setTokens(tokens)
        AuthManager.setUser(userData)
        setUser(userData)
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        })
        router.push("/dashboard")
      } else {
        throw new Error(response.data?.message || "Login failed")
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true)
      const response = await apiClient.register(credentials)

      if (response.success) {
        toast({
          title: "Success",
          description: "Account created successfully! Please sign in.",
        })
        router.push("/signin")
      } else {
        throw new Error(response.data.message || "Registration failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const tokens = AuthManager.getTokens()
      if (tokens?.refreshToken) {
        await apiClient.signout()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Logout failed",
        variant: "destructive",
      })
    } finally {
      AuthManager.clearAuth()
      setUser(null)
      router.push("/")
      toast({
        title: "Success",
        description: "Logged out successfully!",
      })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!AuthManager.getTokens()?.accessToken,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}