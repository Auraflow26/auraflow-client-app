'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Ring, Cylinder, Torus } from '@react-three/drei'
import type * as THREE from 'three'
import type { AgentState, StationStats, TaskSummary, DaemonState } from './useJarvisRealtime'

const AGENTS_CONFIG = [
  { name: 'Orion', role: 'Revenue & Automation', color: '#4a9eff', angle: -Math.PI * 0.4 },
  { name: 'Cyrus', role: 'External Comms', color: '#ff9f43', angle: -Math.PI * 0.2 },
  { name: 'Nova', role: 'Legal & Policy', color: '#a855f7', angle: 0 },
  { name: 'Maven', role: 'Media & Creative', color: '#ef4444', angle: Math.PI * 0.2 },
  { name: 'Atlas', role: 'Systems of Truth', color: '#22c55e', angle: Math.PI * 0.4 },
]

const RADIUS = 7

interface Props {
  agents: AgentState[]
  tasks: TaskSummary[]
  daemons: DaemonState[]
  stats: StationStats
  selected: string | null
  onSelect: (name: string | null) => void
}

export function Scene({ agents, stats, selected, onSelect }: Props) {
  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#050510" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Ground ring */}
      <Ring args={[11.5, 12, 64]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshBasicMaterial color="#1a1a3a" transparent opacity={0.5} />
      </Ring>

      {/* Center column */}
      <CenterDisplay stats={stats} />

      {/* Agent stations */}
      {AGENTS_CONFIG.map((cfg) => {
        const x = Math.sin(cfg.angle) * RADIUS
        const z = Math.cos(cfg.angle) * RADIUS
        const agentData = agents.find((a) => a.name.toLowerCase() === cfg.name.toLowerCase())
        const isSelected = selected === cfg.name

        return (
          <AgentStation
            key={cfg.name}
            config={cfg}
            position={[x, 0, z]}
            status={agentData?.status ?? 'idle'}
            taskLabel={agentData?.currentTask ?? ''}
            isSelected={isSelected}
            onClick={() => onSelect(isSelected ? null : cfg.name)}
          />
        )
      })}
    </group>
  )
}

function CenterDisplay({ stats }: { stats: StationStats }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.15
  })

  return (
    <group position={[0, 2.5, 0]}>
      {/* Rotating torus */}
      <group ref={groupRef}>
        <Torus args={[1.8, 0.02, 16, 64]} rotation={[Math.PI / 3, 0, 0]}>
          <meshBasicMaterial color="#2792dc" transparent opacity={0.4} />
        </Torus>
        <Torus args={[2.2, 0.015, 16, 64]} rotation={[Math.PI / 2.5, Math.PI / 4, 0]}>
          <meshBasicMaterial color="#9ce6e6" transparent opacity={0.25} />
        </Torus>
      </group>

      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color={stats.daemonsLive > 0 ? '#00ff88' : '#ff4444'} transparent opacity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color={stats.daemonsLive > 0 ? '#00ff88' : '#ff4444'} transparent opacity={0.15} />
      </mesh>

      {/* Status label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text position={[0, 1.5, 0]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle" font="/fonts/inter-medium.woff">
          {stats.daemonsLive > 0 ? 'SYSTEMS ONLINE' : 'OFFLINE'}
        </Text>
        <Text position={[0, 1.15, 0]} fontSize={0.13} color="rgba(255,255,255,0.4)" anchorX="center" font="/fonts/inter-medium.woff">
          {`${stats.activeTasks} active · ${stats.awaitingApproval} pending · ${stats.completedToday} done`}
        </Text>
      </Billboard>
    </group>
  )
}

interface StationProps {
  config: (typeof AGENTS_CONFIG)[number]
  position: [number, number, number]
  status: string
  taskLabel: string
  isSelected: boolean
  onClick: () => void
}

function AgentStation({ config, position, status, taskLabel, isSelected, onClick }: StationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const baseColor = config.color

  const statusColor = status === 'executing' ? '#00ff88' :
                      status === 'blocked' ? '#ff4444' :
                      status === 'idle' ? baseColor :
                      baseColor

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = 1.5 + Math.sin(state.clock.elapsedTime * 0.8 + AGENTS_CONFIG.indexOf(config)) * 0.15
    }
    if (glowRef.current) {
      const s = isSelected ? 1.4 : 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.1
      glowRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick() }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'default'}>
      {/* Platform */}
      <Cylinder args={[1.2, 1.4, 0.15, 32]} position={[0, 0.075, 0]}>
        <meshStandardMaterial color="#0a0a20" metalness={0.9} roughness={0.3} emissive={statusColor} emissiveIntensity={isSelected ? 0.3 : 0.1} />
      </Cylinder>

      {/* Platform ring */}
      <Ring args={[1.15, 1.25, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <meshBasicMaterial color={statusColor} transparent opacity={isSelected ? 0.8 : 0.4} />
      </Ring>

      {/* Agent orb */}
      <mesh ref={meshRef} position={[0, 1.5, 0]} castShadow>
        <octahedronGeometry args={[0.45, 2]} />
        <meshStandardMaterial color={statusColor} metalness={0.7} roughness={0.2} emissive={statusColor} emissiveIntensity={0.5} />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.08} />
      </mesh>

      {/* Connection beam to center */}
      <mesh position={[0, 0.3, 0]} rotation={[0, Math.atan2(-position[0], -position[2]), 0]}>
        <boxGeometry args={[0.02, 0.02, RADIUS - 1.5]} />
        <meshBasicMaterial color={statusColor} transparent opacity={status === 'executing' ? 0.6 : 0.12} />
      </mesh>

      {/* Name label */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text position={[0, 2.5, 0]} fontSize={0.28} color="#ffffff" anchorX="center" font="/fonts/inter-medium.woff">
          {config.name}
        </Text>
        <Text position={[0, 2.15, 0]} fontSize={0.14} color="rgba(255,255,255,0.35)" anchorX="center" font="/fonts/inter-medium.woff">
          {config.role}
        </Text>
        {taskLabel && (
          <Text position={[0, 0.5, 0]} fontSize={0.11} color="rgba(255,255,255,0.25)" anchorX="center" maxWidth={2.5} font="/fonts/inter-medium.woff">
            {taskLabel}
          </Text>
        )}
      </Billboard>
    </group>
  )
}
