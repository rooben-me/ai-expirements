import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Cloud, Text } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

const NebulaCloud = ({ position, color, scale, speed }) => {
  const cloudRef = useRef()

  useFrame(({ clock }) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = Math.sin(clock.getElapsedTime() * speed) * 0.2
      cloudRef.current.rotation.x = Math.cos(clock.getElapsedTime() * speed) * 0.2
      cloudRef.current.scale.setScalar(scale)
    }
  })

  return (
    <Cloud
      ref={cloudRef}
      position={position}
      color={color}
      opacity={0.5}
      speed={0.4}
      width={5}
      depth={1.5}
      segments={20}
    />
  )
}

const AudioAnalyzer = ({ analyser, dataArray, setFrequencies }) => {
  useFrame(() => {
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray)
      const frequencies = []
      for (let i = 0; i < 8; i++) {
        const slice = dataArray.slice(i * 32, (i + 1) * 32)
        const average = slice.reduce((a, b) => a + b, 0) / slice.length
        frequencies.push(average)
      }
      setFrequencies(frequencies)
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
  const [frequencies, setFrequencies] = useState(new Array(8).fill(0))

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
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <AudioAnalyzer
          analyser={analyser}
          dataArray={dataArray}
          setFrequencies={setFrequencies}
        />
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {frequencies.map((freq, index) => (
          <NebulaCloud
            key={index}
            position={[
              (index - 3.5) * 3,
              Math.sin(index) * 2,
              Math.cos(index) * 2
            ]}
            color={new THREE.Color().setHSL(index / 8, 1, 0.5)}
            scale={1 + freq / 128}
            speed={0.2 + index * 0.05}
          />
        ))}
        <Text
          position={[0, 8, 0]}
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
        <OrbitControls />
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