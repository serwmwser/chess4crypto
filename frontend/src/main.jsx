import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ background: '#111', color: '#fff', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>♟️ Chess4Crypto</h1>
      <p>✅ ПРИЛОЖЕНИЕ РАБОТАЕТ!</p>
      <button onClick={() => alert('Ура!')}>🔘 Тест</button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)