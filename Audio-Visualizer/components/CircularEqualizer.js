import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CubeBar = ({ position, color, scale }) => {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + scale * 5
      meshRef.current.position.y = (meshRef.current.scale.y - 1) / 2
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.3, 1, 0.3]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  )
}

const CircularEqualizer = ({ frequencies }) => {
  const numBars = 64
  const radius = 8

  return (
    <group>
      {frequencies.slice(0, numBars).map((freq, index) => {
        const angle = (index / numBars) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const color = new THREE.Color().setHSL(index / numBars, 0.7, 0.5)

        return (
          <CubeBar
            key={index}
            position={[x, 0, z]}
            color={color}
            scale={freq / 255}
          />
        )
      })}
    </group>
  )
}

export default CircularEqualizer