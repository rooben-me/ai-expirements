import Image from "next/image";
import { Inter } from "next/font/google";
import dynamic from 'next/dynamic'
import AudioVisualizer from '../../components/AudioVisualizer-old-v1-updated'

export default function Home() {
  return (

  <div className="w-full h-screen">
  <AudioVisualizer />
</div>
  );
 
  
}
