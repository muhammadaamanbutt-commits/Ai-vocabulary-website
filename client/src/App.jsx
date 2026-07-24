import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Exploration from './pages/Exploration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/exploration" element={<Exploration />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
