import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Summit Finance OS',
  description: 'Your complete financial command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-primary antialiased">{children}</body>
    </html>
  )
}
