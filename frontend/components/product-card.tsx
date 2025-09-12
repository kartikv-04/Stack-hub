"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ExternalLink, MoreVertical, Bell, Trash2, BarChart3, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PriceChart } from "@/components/price-chart"
import { PriceAlertDialog } from "@/components/price-alert-dialog"
import Image from "next/image"
import type { Product } from "@/types"

export interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;                 // pass product ID when deleting
  onUpdateAlert?: (id: string, enable: boolean, targetPrice: number) => void; // all info
}

export function ProductCard({ product, onDelete, onUpdateAlert }: ProductCardProps) {
  const [showChart, setShowChart] = useState(false)
  const [showAlertDialog, setShowAlertDialog] = useState(false)

  const currentPrice = product.productPrice
  const priceHistory = product.productPriceHistory || []
  const previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2]?.price : currentPrice
  const priceChange = currentPrice - previousPrice
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0

  const isPriceDown = priceChange < 0
  const isPriceUp = priceChange > 0

  const handleToggleAlert = () => {
    setShowAlertDialog(true)
  }

  const handleSetAlert = (targetPrice: number) => {
    onUpdateAlert?.(product._id, true, targetPrice)
    setShowAlertDialog(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const chartData = priceHistory.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString(),
    price: entry.price,
  }))

  const toINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <Image
              src={product.productImg || "/placeholder.svg?height=300&width=300"}
              alt={product.productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />

            {/* Price Change Badge */}
            {isPriceDown && (
              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground shadow-md">
                <TrendingDown className="h-3 w-3 mr-1" />
                {priceChangePercent.toFixed(1)}%
              </Badge>
            )}
            {isPriceUp && (
              <Badge variant="destructive" className="absolute top-2 left-2 shadow-md">
                <TrendingUp className="h-3 w-3 mr-1" />+{priceChangePercent.toFixed(1)}%
              </Badge>
            )}

            {/* Availability Badge */}
            {!product.productIsavailable && (
              <Badge variant="secondary" className="absolute top-2 right-2 shadow-md">
                Out of Stock
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Product Info */}
            <div>
              <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight hover:line-clamp-none transition-all">
                {product.productName}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{product.productPlatform}</p>
                <div className="flex items-center gap-1">
                  {product.productRatings > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      {product.productRatings.toFixed(1)} ({product.productTotalRatings})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{toINR(currentPrice)}</div>
                  {product.productDiscount && (
                    <div className="text-xs text-accent font-medium">{product.productDiscount} off</div>
                  )}
                </div>

                {priceChange !== 0 && (
                  <div className={`text-sm font-medium ${isPriceDown ? "text-accent" : "text-destructive"}`}>
                    {isPriceDown ? "-" : "+"}{toINR(Math.abs(priceChange))}
                  </div>
                )}
              </div>
            </div>

            {/* Price History Mini Chart */}
            {showChart && chartData.length > 1 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <PriceChart data={chartData} compact />
              </div>
            )}

          
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {/* Show chart toggle if applicable */}
                {priceHistory.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowChart(!showChart)} className="h-8 w-8 p-0">
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                )}

                {/* Price alert button */}
                <Button variant="ghost" size="sm" onClick={handleToggleAlert} className="h-8 w-8 p-0">
                  <Bell className="h-3 w-3" />
                </Button>

                {/* External link button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(product.productUrl, "_blank")}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>

                {/* Remove product button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(product._id)}
                  className="h-8 w-8 p-0 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <PriceAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        currentPrice={currentPrice}
        onSetAlert={handleSetAlert}
      />
    </>
  )
}
