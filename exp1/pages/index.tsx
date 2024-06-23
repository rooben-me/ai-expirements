import Image from "next/image";
import { Inter } from "next/font/google";
import NeuralNetwork from "../components/NeuralNetwork"

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="w-screen h-screen bg-gray-900">
      <NeuralNetwork />
    </div>
  );
}
