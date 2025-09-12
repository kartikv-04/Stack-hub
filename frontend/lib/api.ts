import type {
  AuthResponse,
  RegisterResponse,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  Product,
  TrackProductRequest,
} from "@/types"
import { AuthManager } from "./auth"

const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const API_BASE_URL = rawBase.replace(/\/?(api\/v1|api)\/?$/i, "").replace(/\/$/, "")

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${normalized}`
    const headers = {
      ...AuthManager.getAuthHeaders(),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data as T
    } catch (error) {
      throw error
    }
  }

  // Auth endpoints - these return the exact response structure from backend
  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async signin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async signout(): Promise<ApiResponse> {
    const tokens = AuthManager.getTokens()
    return this.request<ApiResponse>("/api/v1/auth/signout", {
      method: "POST",
      body: JSON.stringify({ 
        refreshToken: tokens?.refreshToken 
      }),
    })
  }

  // Other endpoints that return ApiResponse<T> wrapper
  async trackProduct(data: TrackProductRequest): Promise<ApiResponse<Product>> {
  return this.request<ApiResponse<Product>>("/api/v1/priceTrack", { 
    method: "POST",
    body: JSON.stringify(data),
  })
}

  async getTrackedProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<ApiResponse<Product[]>>("/api/v1/priceTrack")
  }



  async me(): Promise<{ success: boolean; user?: { id: string; email: string } }> {
    return this.request("/api/v1/auth/me", { method: "GET" });
  }

  // NEW: Delete a tracked product
  async deleteProduct(productId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/v1/pricetrack/${productId}`, {
      method: "DELETE",
    })
  }

  // NEW: Set price alert for a tracked product
  async setPriceAlert(productId: string, targetPrice: number): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/v1/pricetrack/${productId}/alert`, {
      method: "POST",
      body: JSON.stringify({ targetPrice }),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)