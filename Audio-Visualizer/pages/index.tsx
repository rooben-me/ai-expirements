import Link from "next/link";

export default function Home() {
  return (<div className="flex justify-evenly items-center min-h-screen">
  
<Link href="/audioviz1"><button className="px-4 py-2 bg-gray-800/50 text-white rounded-md border border-gray-200/20 hover:bg-gray-700/50 hover:border-gray-200/40 ease-in-out transition-all">Audio Viz 1</button></Link>   
<Link href="/audioviz1-updated"><button className="px-4 py-2 bg-gray-800/50 text-white rounded-md border border-gray-200/20 hover:bg-gray-700/50 hover:border-gray-200/40 ease-in-out transition-all">Audio Viz 1 - updated</button></Link>   
<Link href="/audioviz2"><button className="px-4 py-2 bg-gray-800/50 text-white rounded-md border border-gray-200/20 hover:bg-gray-700/50 hover:border-gray-200/40 ease-in-out transition-all">Audio Viz 2</button></Link>   
<Link href="/neuralnet"><button className="px-4 py-2 bg-blue-800/50 text-white rounded-md border border-blue-200/20 hover:bg-blue-700/50 hover:border-blue-200/40 ease-in-out transition-all">Neural net</button></Link>   

</div>
  );
 
  
}
