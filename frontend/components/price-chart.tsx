"use client"

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface PriceData {
  date: string
  price: number
}

interface PriceChartProps {
  data: PriceData[]
  compact?: boolean
}

export function PriceChart({ data, compact = false }: PriceChartProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const minPrice = Math.min(...data.map((d) => d.price))
  const maxPrice = Math.max(...data.map((d) => d.price))
  const priceRange = maxPrice - minPrice
  const yAxisMin = Math.max(0, minPrice - priceRange * 0.1)
  const yAxisMax = maxPrice + priceRange * 0.1

  return (
    <div className={compact ? "h-24" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            hide={compact}
          />
          <YAxis
            domain={[yAxisMin, yAxisMax]}
            tickFormatter={formatPrice}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            hide={compact}
          />
          {!compact && (
            <Tooltip
              formatter={(value: number) => [formatPrice(value), "Price"]}
              labelFormatter={(label: string) => formatDate(label)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={compact ? 1.5 : 2}
            dot={compact ? false : { fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
            activeDot={compact ? false : { r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
