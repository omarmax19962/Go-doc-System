import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Go Doc — Operations',
  description: 'Go Doc Home Physiotherapy — Operations Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
