

export interface PriceHitory {
    price: number,
    date: Date
}

export interface AlertSettings {
  enabled: boolean
  targetPrice: number | null
  userId?: string
}

export interface ProductDetails {
    owner?: string
    productId?: string,
    productUrl: string,
    productName: string,
    productPrice: number,
    productImg: string,
    productRatings: number,
    productTotalRatings: number,
    productDiscount?: string,
    productIsavailable?: string
    productPriceHistory: PriceHitory[]
    productPlatform: 'amazon' | 'flipkart'
    alert?: AlertSettings


}

