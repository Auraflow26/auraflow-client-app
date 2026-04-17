export const metadata = {
  title: 'JARVIS',
  description: 'Talk to Jarvis — AuraFlow voice control',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false },
}

export default function TalkLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
