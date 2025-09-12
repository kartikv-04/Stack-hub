# E-commerce Price Tracker

A modern TypeScript-based price tracking application that monitors product prices across multiple e-commerce platforms and provides historical data and alerts.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Product Tracking**: Add products by URL and track price changes
- **Price History**: Visual charts showing price trends over time
- **Price Alerts**: Get notified when prices drop to your target
- **Multi-platform Support**: Works with major e-commerce sites
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Recharts** for price visualization
- **SWR** for data fetching and caching

### Backend Integration
- **JWT Authentication** with access and refresh tokens
- **RESTful API** integration
- **Protected routes** with authentication middleware

## Getting Started

### Prerequisites
- Node.js 18+ 
- Your backend API running (with endpoints at `/api/v1/`)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
4. Update `.env.local` with your backend URL and other configuration:
   \`\`\`env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The frontend expects your backend to have these endpoints:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/signin` - User login  
- `POST /api/v1/auth/signout` - User logout

### Price Tracking
- `POST /api/v1/pricetrack` - Add product to track
- `GET /api/v1/pricetrack` - Get user's tracked products

### Expected Data Structure

The frontend expects products in this format:
\`\`\`typescript
{
  _id: string
  productId: string
  productUrl: string
  productName: string
  productPrice: number
  productImg: string
  productRatings: number
  productTotalRatings: number
  productDiscount: string
  productIsavailable: boolean
  productPriceHistory: Array<{
    price: number
    date: Date
  }>
  productPlatform: string
}
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── dashboard/         # Protected dashboard pages
│   ├── signin/           # Authentication pages
│   ├── register/         
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── product-card.tsx # Product display component
│   ├── price-chart.tsx  # Price history visualization
│   └── protected-route.tsx # Auth protection wrapper
├── hooks/               # Custom React hooks
│   └── use-auth.tsx    # Authentication hook
├── lib/                # Utility libraries
│   ├── api.ts         # API client with JWT handling
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # General utilities
├── types/              # TypeScript type definitions
│   └── index.ts       # Shared interfaces
└── .env.example       # Environment variables template
\`\`\`

## Authentication Flow

1. User registers/signs in via forms
2. Backend returns JWT access and refresh tokens
3. Tokens stored in localStorage
4. API requests include Authorization header
5. Protected routes redirect to signin if not authenticated

## Contributing

1. Ensure TypeScript types are properly defined
2. Follow the existing code structure and patterns
3. Test authentication flows thoroughly
4. Update environment variables as needed

## License

MIT License
