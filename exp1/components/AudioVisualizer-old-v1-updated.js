import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars, useMatcapTexture, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, GodRays, Glitch } from '@react-three/postprocessing'
import { BlendFunction, Resizer, KernelSize } from 'postprocessing'
import * as THREE from 'three'
import { FaPlay, FaPause, FaForward, FaBackward } from 'react-icons/fa'
import { MeshDistortMaterial } from '@react-three/drei'
import { MeshTransmissionMaterial } from '@react-three/drei'
import AudioSphere from "./audioviz/AudioSphere"

const AudioBar = ({ index, frequency, totalBars }) => {
  const meshRef = useRef();
  const scale = frequency / 255;

  const color = useMemo(() => {
    return new THREE.Color().setHSL(index / totalBars, 0.8, 0.5);
  }, [index, totalBars]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = 1 + scale * 3;
      meshRef.current.position.y = (meshRef.current.scale.y - 1) / 2;
    }
  });

  const barWidth = 0.2;
  const spacing = 0.1;
  const totalWidth = totalBars * (barWidth + spacing);
  const startX = -totalWidth / 2;

  const position = useMemo(() => {
    const x = startX + index * (barWidth + spacing);
    return [x, 0, 0];
  }, [index, startX, barWidth, spacing]);

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[barWidth, 1, barWidth]} />
      <MeshDistortMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5 + scale}
        distort={0.3 * scale}
        speed={5}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
};

const WaveForm = ({ frequencies, color }) => {
  const lineRef = useRef();
  const mirroredFrequencies = useMemo(() => {
    const half = frequencies.slice(0, frequencies.length / 2);
    return [...half, ...half.slice().reverse()];
  }, [frequencies]);

  const points = useMemo(() => {
    const totalPoints = mirroredFrequencies.length;
    return new Array(totalPoints).fill().map((_, i) => {
      const x = (i / (totalPoints - 1)) * 20 - 10;
      return new THREE.Vector3(x, 0, 0);
    });
  }, [mirroredFrequencies.length]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position;
      for (let i = 0; i < mirroredFrequencies.length; i++) {
        const y = (mirroredFrequencies[i] / 255) * 2;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
};

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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [frequencies, setFrequencies] = useState(new Array(128).fill(0))

  // const avgFrequency = useMemo(() => 
  //   frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length, 
  //   [frequencies]
  // );

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

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })
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

  const handleSeek = (event) => {
    if (audio) {
      const newTime = parseFloat(event.target.value)
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleForward = () => {
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + 10, audio.duration)
    }
  }

  const handleBackward = () => {
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - 10, 0)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex-grow">
        <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
          <AudioAnalyzer
            analyser={analyser}
            dataArray={dataArray}
            setFrequencies={setFrequencies}
          />
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
          <WaveForm frequencies={frequencies} color={"white"}/>
          
          <group position={[0, -3.5, 0]}>
            {frequencies.slice(0, 64).map((freq, index) => (
              <AudioBar
                key={index}
                position={[(index - 32) * 0.3, 0, 0]}
                frequency={freq}
                index={index}
                totalBars={64}
              />
            ))}
          </group>
          
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
          
          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
          
          <EffectComposer>
            <Bloom
              intensity={0.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              height={300}
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            
          </EffectComposer>
        </Canvas>
      </div>
      <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md p-4">
        <div className="max-w-3xl mx-auto">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="mb-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={handleBackward}
              className="text-white hover:text-blue-300 transition-colors"
            >
              <FaBackward size={24} />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
            <button
              onClick={handleForward}
              className="text-white hover:text-blue-300 transition-colors"
            >
              <FaForward size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
          <span className="text-white">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-grow accent-purple-500"
            />
            <span className="text-white">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-white text-lg">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32 accent-purple-500"
            />
            <span className="text-white font-medium">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioVisualizer