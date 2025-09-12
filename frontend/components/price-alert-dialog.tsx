"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

interface PriceAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPrice: number
  onSetAlert: (targetPrice: number) => void
}

export function PriceAlertDialog({ open, onOpenChange, currentPrice, onSetAlert }: PriceAlertDialogProps) {
  const [targetPrice, setTargetPrice] = useState(currentPrice * 0.9) // Default to 10% off

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetPrice > 0) {
      onSetAlert(targetPrice)
    }
  }

  const suggestedPrices = [
    { label: "5% off", value: currentPrice * 0.95 },
    { label: "10% off", value: currentPrice * 0.9 },
    { label: "15% off", value: currentPrice * 0.85 },
    { label: "20% off", value: currentPrice * 0.8 },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when the price drops to your target amount. Current price:{" "}
            <span className="font-semibold">${currentPrice.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                min="0.01"
                max={currentPrice}
                value={targetPrice.toFixed(2)}
                onChange={(e) => setTargetPrice(Number.parseFloat(e.target.value) || 0)}
                className="pl-8"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrices.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetPrice(suggestion.value)}
                  className="text-xs"
                >
                  {suggestion.label}
                  <br />${suggestion.value.toFixed(2)}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Set Alert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
