import Image from "next/image";
import { Inter } from "next/font/google";
import dynamic from 'next/dynamic'


const NeuralNetwork = dynamic(() => import('../components/NeuralNetwork'), { ssr: false })

export default function Home() {
  return (
    <div className="w-screen h-screen bg-gray-900">
    <div className="absolute top-0 left-0 p-4 text-white z-10">
      <h1 className="text-2xl font-bold mb-2">Neural Network Visualization</h1>
      <p className="text-sm">Nodes represent neurons, lines are connections, and moving particles show data flow.</p>
    </div>
    <NeuralNetwork />
  </div>
  );
}
