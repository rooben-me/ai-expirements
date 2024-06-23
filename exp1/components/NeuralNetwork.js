import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
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
  const curve = useMemo(() => {
    const curveStart = new THREE.Vector3(...start)
    const curveEnd = new THREE.Vector3(...end)
    const midPoint = new THREE.Vector3().lerpVectors(curveStart, curveEnd, 0.5)
    const randomOffset = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5)
    midPoint.add(randomOffset)
    return new THREE.QuadraticBezierCurve3(curveStart, midPoint, curveEnd)
  }, [start, end])

  const points = useMemo(() => curve.getPoints(50), [curve])

  useFrame((state) => {
    const t = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2
    ref.current.material.dashOffset = t * 10
  })

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
      <lineDashedMaterial color="#4fc3f7" dashSize={0.1} gapSize={0.05} />
    </line>
  )
}

const NeuralNetwork = () => {
  const nodes = useMemo(() => {
    const nodeCount = 100
    return Array.from({ length: nodeCount }, () => [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    ])
  }, [])

  const connections = useMemo(() => {
    const connectionCount = 150
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
        <Node key={index} position={position} size={0.03} color="#4fc3f7" />
      ))}
      
      {connections.map(([startIndex, endIndex], index) => (
        <Connection key={index} start={nodes[startIndex]} end={nodes[endIndex]} />
      ))}
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} intensity={0.5} levels={5} />
      </EffectComposer>
    </Canvas>
  )
}

export default NeuralNetwork