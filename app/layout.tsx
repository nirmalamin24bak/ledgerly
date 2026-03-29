import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ledgerly — Smart Bill & Supplier Ledger',
  description: 'AI-powered bill scanning and expense tracking for businesses and individuals',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
      </head>
      <body>{children}</body>
    </html>
  )
}
