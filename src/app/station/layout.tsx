export const metadata = {
  title: 'JARVIS · Control Station',
  description: 'AuraFlow 3D command center',
  themeColor: '#000000',
}

export default function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden', width: '100vw', height: '100dvh' }}>
        {children}
      </body>
    </html>
  )
}
