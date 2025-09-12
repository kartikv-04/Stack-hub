"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Plus, Search, Bell, User, LogOut, Loader2, Trash2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api"
import type { Product } from "@/types"
import { toast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const { user, logout } = useAuth()

  useEffect(() => {
    loadTrackedProducts()
  }, [])

  const loadTrackedProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await apiClient.getTrackedProducts()
      if (response.success && response.data) {
        setProducts(response.data)
      }
    } catch (error) {
      throw new (error as any);
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError("Please enter a valid URL")
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.trackProduct({ url });

      if (response.success && response.data) {
        const newProduct: Product = response.data; // <-- define the new product
        setProducts((prev) => [newProduct, ...prev]); // <-- now TypeScript knows it's a Product
        setUrl("");
        setSuccess("Product added successfully! We'll start tracking its price.");
      } else {
        setError(response.error || "Failed to scrape product data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }

  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await apiClient.deleteProduct(id)
      if (response.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id))
      } else {
        setError(response.error || "Failed to delete product")
      }
    } catch (err) {
      setError("Network error while deleting. Please try again.")
    }
  }

  const handleSetPriceAlert = async (id: string, targetPrice: number) => {
    try {
      const response = await apiClient.setPriceAlert(id, targetPrice)
      if (response.success) {
        setSuccess("Price alert set successfully!")
      } else {
        setError(response.error || "Failed to set price alert")
      }
    } catch (err) {
      setError("Network error while setting price alert. Please try again.")
    }
  }

  const priceDropsCount = products.filter((p) => {
    const latestPrice = p.productPriceHistory[p.productPriceHistory.length - 1]?.price || p.productPrice
    return latestPrice < p.productPrice
  }).length

  const toINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)

  const totalSavings = products.reduce((sum, p) => {
    const latestPrice = p.productPriceHistory[p.productPriceHistory.length - 1]?.price || p.productPrice
    const savings = p.productPrice - latestPrice
    return sum + (savings > 0 ? savings : 0)
  }, 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">PriceTracker</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h2>
            <p className="text-muted-foreground">Track new products or monitor your existing ones.</p>
          </div>

          {/* Add Product Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Product
              </CardTitle>
              <CardDescription>
                Paste any product URL from supported e-commerce sites to start tracking its price.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="url" className="sr-only">
                      Product URL
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://amazon.com/product-page or https://bestbuy.com/product-page"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Track Product
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">Products being tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Drops</CardTitle>
                <TrendingDown className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{priceDropsCount}</div>
                <p className="text-xs text-muted-foreground">Products with price drops</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{toINR(totalSavings)}</div>
                <p className="text-xs text-muted-foreground">Money saved from price drops</p>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-foreground">Your Tracked Products</h3>
              <Badge variant="secondary">{products.length} products</Badge>
            </div>

            {isLoadingProducts ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">Loading your products...</h4>
                  <p className="text-muted-foreground text-center">Please wait while we fetch your tracked products.</p>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">No products tracked yet</h4>
                  <p className="text-muted-foreground text-center mb-4">
                    Add your first product URL above to start tracking prices and get notified of deals.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onDelete={(id) => handleDeleteProduct(id)}
                    onUpdateAlert={(id, enable, targetPrice) => handleSetPriceAlert(id, targetPrice)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
