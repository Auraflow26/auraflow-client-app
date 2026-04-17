'use client'

import dynamic from 'next/dynamic'

const Station3D = dynamic(() => import('./Station3D'), { ssr: false })

export default function StationPage() {
  return <Station3D />
}
