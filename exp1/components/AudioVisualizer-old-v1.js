import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

const AudioBar = ({ position, color, scale }) => {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + scale * 3
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

const WaveForm = ({ frequencies, color }) => {
  const lineRef = useRef()
  const curve = useMemo(() => new THREE.EllipseCurve(0, 0, 10, 10, 0, 2 * Math.PI, false, 0), [])
  const points = useMemo(() => curve.getPoints(256), [curve])

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Array(256 * 3).fill(0), 3))
    return geometry
  }, [points])

  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position
      for (let i = 0; i < 256; i++) {
        const t = i / 255
        const [x, y] = curve.getPoint(t).toArray()
        const z = (frequencies[Math.floor(i / 2) % frequencies.length] / 255) * 2
        positions.setXYZ(i, x, y, z)
      }
      positions.needsUpdate = true
    }
  })

  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  )
}
const AudioSphere = ({ frequencies }) => {
  const sphereRef = useRef()

  useFrame(() => {
    if (sphereRef.current) {
      const averageFrequency = frequencies.reduce((a, b) => a + b) / frequencies.length
      sphereRef.current.scale.setScalar(1 + averageFrequency / 255)
    }
  })

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} wireframe />
    </mesh>
  )
}

const AudioAnalyzer = ({ analyser, dataArray, setFrequencies }) => {
  useFrame(() => {
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray)
      setFrequencies([...dataArray])
    }
  })

  return null
}

const AudioVisualizer = () => {
  const [audio, setAudio] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [dataArray, setDataArray] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [frequencies, setFrequencies] = useState(new Array(128).fill(0))

  useEffect(() => {
    if (audio) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaElementSource(audio)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      setAnalyser(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      setDataArray(dataArray)
    }
  }, [audio])

  useEffect(() => {
    if (audio) {
      audio.volume = volume
    }
  }, [audio, volume])

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const audioElement = new Audio(URL.createObjectURL(file))
      setAudio(audioElement)
      setIsPlaying(false)
    }
  }

  const handlePlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (event) => {
    setVolume(parseFloat(event.target.value))
  }

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-0 left-0 z-10 p-4 bg-gray-800 bg-opacity-75 rounded-br-lg">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="mb-2 text-white"
        />
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-32"
          />
          <span className="text-white">{Math.round(volume * 100)}%</span>
        </div>
      </div>
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
        <AudioAnalyzer
          analyser={analyser}
          dataArray={dataArray}
          setFrequencies={setFrequencies}
        />
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <group rotation={[0, 0, Math.PI / 2]}>
          {frequencies.slice(0, 64).map((freq, index) => (
            <AudioBar
              key={index}
              position={[(index - 32) * 0.3, 0, 0]}
              color={new THREE.Color().setHSL(index / 64, 1, 0.5)}
              scale={freq / 255}
            />
          ))}
        </group>
        <WaveForm frequencies={frequencies} color="#00ffff" />
        <AudioSphere frequencies={frequencies} />
        <Text
          position={[0, 10, 0]}
          color="white"
          fontSize={1.5}
          maxWidth={200}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
          anchorX="center"
          anchorY="middle"
        >
          Audio Visualizer
        </Text>
        <OrbitControls enableZoom={false} enablePan={false} />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

export default AudioVisualizer