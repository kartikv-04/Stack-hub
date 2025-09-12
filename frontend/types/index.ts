export interface User {
  id: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  success: boolean
  refreshToken: string    // At root level
  userId: string         // At root level
  data: {
    message: string
    accessToken: string
  }
}

export interface Product {
  _id: string
  productId: string
  productUrl: string
  productName: string
  productPrice: number
  productImg: string
  productRatings: number
  productTotalRatings: number
  productDiscount: string | null
  productIsavailable: string | null
  productPriceHistory: PriceHistoryEntry[]
  productPlatform: string
  createdAt: Date
  updatedAt: Date
}

export interface PriceHistoryEntry {
  price: number
  date: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
}

export interface TrackProductRequest {
  url: string
}
// In your @/types file
export interface RegisterResponse {
  success: boolean
  data: {
    message: string
  }
}

