import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SecondPage from './SecondPage.jsx'
import God from './God.jsx'
import Love from './Love.jsx'
import Purpose from './Purpose.jsx'
import Self from './Self.jsx'
import Soul from './Soul.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/explore" element={<SecondPage />} />
        <Route path="/god" element={<God />} />
        <Route path="/love" element={<Love />} />
        <Route path="/purpose" element={<Purpose />} />
        <Route path="/self" element={<Self />} />
        <Route path="/soul" element={<Soul />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
