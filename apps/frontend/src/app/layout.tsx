import type { Metadata } from 'next'
import { Providers } from './providers'
import ToastContainer from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'TikTok Carousel Automation',
  description: 'Automate TikTok carousel creation and posting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
          <ToastContainer />
        </ErrorBoundary>
      </body>
    </html>
  )
}