import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App w-full h-screen flex items-center justify-center">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-4">RECALENDER</h1>
        <p>
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCount((count) => count + 1)}
          >
            カウント: {count}
          </button>
        </p>
      </header>
    </div>
  )
}

export default App