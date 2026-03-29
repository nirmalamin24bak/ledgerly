import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ledgerly — Smart Bill & Supplier Ledger',
  description: 'AI-powered bill scanning and supplier ledger for construction businesses in India',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
