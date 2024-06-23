import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

const Node = ({ position, size, color }) => {
  const ref = useRef()
  useFrame((state) => {
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + position[0] * 10) * 0.1)
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

const Connection = ({ start, end }) => {
  const ref = useRef()
  const curve = useMemo(() => new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end)), [start, end])
  const points = useMemo(() => curve.getPoints(50), [curve])

  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#4fc3f7" transparent opacity={0.3} />
    </line>
  )
}

const DataParticle = ({ start, end }) => {
  const ref = useRef()
  const curve = useMemo(() => new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end)), [start, end])
  
  useFrame((state) => {
    const t = (state.clock.elapsedTime % 2) / 2
    const position = curve.getPoint(t)
    ref.current.position.copy(position)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}

const NeuralNetwork = () => {
  const nodes = useMemo(() => {
    const nodeCount = 50
    return Array.from({ length: nodeCount }, () => [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    ])
  }, [])

  const connections = useMemo(() => {
    const connectionCount = 100
    return Array.from({ length: connectionCount }, () => [
      Math.floor(Math.random() * nodes.length),
      Math.floor(Math.random() * nodes.length)
    ])
  }, [nodes])

  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={['#000814']} />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} />
      
      {nodes.map((position, index) => (
        <Node key={index} position={position} size={0.05} color="#4fc3f7" />
      ))}
      
      {connections.map(([startIndex, endIndex], index) => (
        <Connection key={index} start={nodes[startIndex]} end={nodes[endIndex]} />
      ))}

      {connections.map(([startIndex, endIndex], index) => (
        <DataParticle key={index} start={nodes[startIndex]} end={nodes[endIndex]} />
      ))}
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={1.5} levels={5} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </Canvas>
  )
}

export default NeuralNetwork