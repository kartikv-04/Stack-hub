import type { AuthTokens, User } from "@/types"
import { apiClient } from "./api"

const TOKEN_KEY = "auth_tokens"
const USER_KEY = "user_data"

export class AuthManager {
  static setTokens(tokens: AuthTokens): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    }
  }



  static getTokens(): AuthTokens | null {
    if (typeof window !== "undefined") {
      const tokens = localStorage.getItem(TOKEN_KEY)
      return tokens ? JSON.parse(tokens) : null
    }
    return null
  }

  static setUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  }

  static getUser(): User | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    }
    return null
  }

  static clearAuth(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const tokens = this.getTokens()
    if (tokens?.accessToken) {
      return {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      }
    }
    return {
      "Content-Type": "application/json",
    }
  }

  static isAuthenticated(): boolean {
    const tokens = this.getTokens()
    return !!tokens?.accessToken
  }
}
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  try {
    const res = await apiClient.me();
    if (res?.success && res.user) return res.user;
    return null;
  } catch (err) {
    return null;
  }
}
