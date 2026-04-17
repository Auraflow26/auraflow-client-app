'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { Scene } from './Scene'
import { HUD } from './HUD'
import { useJarvisRealtime } from './useJarvisRealtime'

export default function Station3D() {
  const { agents, tasks, daemons, stats } = useJarvisRealtime()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 14]} fov={50} />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 12, 0]} intensity={0.8} color="#4a9eff" />
        <pointLight position={[-8, 6, -4]} intensity={0.3} color="#00ff88" />
        <pointLight position={[8, 6, -4]} intensity={0.3} color="#ff6644" />

        {/* Space backdrop */}
        <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />
        <fog attach="fog" args={['#000008', 20, 60]} />

        <Suspense fallback={null}>
          <Scene
            agents={agents}
            tasks={tasks}
            daemons={daemons}
            stats={stats}
            selected={selected}
            onSelect={setSelected}
          />
        </Suspense>
      </Canvas>

      {/* 2D overlay HUD */}
      <HUD stats={stats} selected={selected} agents={agents} tasks={tasks} onClose={() => setSelected(null)} />
    </div>
  )
}
