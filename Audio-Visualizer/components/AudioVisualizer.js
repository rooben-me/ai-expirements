import React, { useRef, useState,useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars , Box} from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import CircularEqualizer from './CircularEqualizer'
const AudioSphere = ({ frequencies }) => {
    const sphereRef = useRef()
    const [color, setColor] = useState('#ffffff')
  
    useFrame(() => {
      if (sphereRef.current) {
        const averageFrequency = frequencies.reduce((a, b) => a + b) / frequencies.length
        sphereRef.current.scale.setScalar(1 + averageFrequency / 255 * 0.3)
        
        // Change color based on average frequency
        const hue = (averageFrequency / 255) * 360
        setColor(`hsl(${hue}, 100%, 50%)`)
      }
    })
  
    return (
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
      </mesh>
    )
  }
  
  const FloatingCube = ({ position }) => {
    const cubeRef = useRef()
  
    useFrame(({ clock }) => {
      const t = clock.getElapsedTime()
      cubeRef.current.position.y = position[1] + Math.sin(t * 2) * 0.5
      cubeRef.current.rotation.x = t * 0.5
      cubeRef.current.rotation.y = t * 0.3
    })
  
    return (
      <Box ref={cubeRef} position={position} args={[1, 1, 1]}>
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </Box>
    )
  }
  
  const AudioRings = ({ frequencies }) => {
    const ringsRef = useRef()
  
    useFrame(() => {
      if (ringsRef.current) {
        ringsRef.current.rotation.z += 0.005
        const averageFrequency = frequencies.reduce((a, b) => a + b) / frequencies.length
        ringsRef.current.scale.setScalar(1 + averageFrequency / 255 * 0.2)
      }
    })
  
    const ringGeometry = useMemo(() => new THREE.RingGeometry(2.5, 2.7, 128), [])
  
    return (
      <group ref={ringsRef}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[0, 0, index * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={ringGeometry} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
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
      <Canvas camera={{ position: [0, 15, 25], fov: 60 }}>
        <AudioAnalyzer
          analyser={analyser}
          dataArray={dataArray}
          setFrequencies={setFrequencies}
        />
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <CircularEqualizer frequencies={frequencies} />
        <AudioSphere frequencies={frequencies} />
        <AudioRings frequencies={frequencies} />
        
        <FloatingCube position={[0, 5, 0]} />
        <FloatingCube position={[-5, 5, 0]} />
        <FloatingCube position={[5, 5, 0]} />

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
        <OrbitControls enableZoom={true} enablePan={false} />
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