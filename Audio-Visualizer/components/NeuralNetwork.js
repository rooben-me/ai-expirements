import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Sphere, Line, Cloud, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import SimplexNoise from 'simplex-noise';

const simplex = new SimplexNoise();

const Node = ({ position }) => {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.position.x = position[0] + simplex.noise3D(position[0], position[1], t * 0.5) * 0.1
    ref.current.position.y = position[1] + simplex.noise3D(position[1], position[2], t * 0.5) * 0.1
    ref.current.position.z = position[2] + simplex.noise3D(position[2], position[0], t * 0.5) * 0.1
  })
  return (
    <Sphere ref={ref} position={position} args={[0.05, 16, 16]}>
      <meshBasicMaterial color="#4fc3f7" />
    </Sphere>
  )
}

const Connection = ({ start, end }) => {
  const ref = useRef()
  const curve = useMemo(() => {
    const startV = new THREE.Vector3(...start)
    const endV = new THREE.Vector3(...end)
    const midV = new THREE.Vector3().lerpVectors(startV, endV, 0.5)
    const distance = startV.distanceTo(endV)
    midV.y += distance * 0.1
    return new THREE.QuadraticBezierCurve3(startV, midV, endV)
  }, [start, end])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const points = curve.getPoints(50)
    const positions = points.map(p => [
      p.x + simplex.noise3D(p.x, p.y, t * 0.5) * 0.02,
      p.y + simplex.noise3D(p.y, p.z, t * 0.5) * 0.02,
      p.z + simplex.noise3D(p.z, p.x, t * 0.5) * 0.02
    ]).flat()
    ref.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  })

  return (
    <Line ref={ref} points={curve.getPoints(50)} color="#4fc3f7" lineWidth={1} />
  )
}

const DataFlow = ({ curve }) => {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() % 2) / 2
    const position = curve.getPoint(t)
    ref.current.position.copy(position)
  })
  return (
    <Sphere ref={ref} args={[0.02, 8, 8]}>
      <meshBasicMaterial color="#ffffff" />
    </Sphere>
  )
}

const AtmosphericBackground = () => {
  const texture = useTexture('/noise-texture.png') // You'll need to add this texture
  return (
    <mesh>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial map={texture} transparent opacity={0.2} />
    </mesh>
  )
}

const NeuralNetwork = () => {
  const nodes = useMemo(() => {
    return Array.from({ length: 100 }, () => [
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    ])
  }, [])

  const connections = useMemo(() => {
    return Array.from({ length: 150 }, () => [
      Math.floor(Math.random() * nodes.length),
      Math.floor(Math.random() * nodes.length)
    ])
  }, [nodes])

  const curves = useMemo(() => {
    return connections.map(([startIndex, endIndex]) => {
      const start = new THREE.Vector3(...nodes[startIndex])
      const end = new THREE.Vector3(...nodes[endIndex])
      const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)
      const distance = start.distanceTo(end)
      mid.y += distance * 0.1
      return new THREE.QuadraticBezierCurve3(start, mid, end)
    })
  }, [connections, nodes])

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <color attach="background" args={['#000814']} />
      <fog attach="fog" args={['#000814', 5, 15]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} />
      
      <AtmosphericBackground />
      
      {nodes.map((position, index) => (
        <Node key={index} position={position} />
      ))}
      
      {connections.map(([startIndex, endIndex], index) => (
        <Connection key={index} start={nodes[startIndex]} end={nodes[endIndex]} />
      ))}

      {curves.map((curve, index) => (
        <DataFlow key={index} curve={curve} />
      ))}
      
      <Cloud opacity={0.5} speed={0.4} width={20} depth={1.5} segments={20} />
      
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        <Noise opacity={0.02} blendFunction={BlendFunction.MULTIPLY} />
      </EffectComposer>
    </Canvas>
  )
}

export default NeuralNetwork