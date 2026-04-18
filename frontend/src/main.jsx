import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ✅ Чистый рендер — без провайдеров кошельков
// Нет авто-подключений → нет ошибок inpage.js

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)