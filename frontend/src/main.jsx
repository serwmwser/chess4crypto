import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ✅ Чистый рендер без провайдеров кошельков
// - Нет WagmiConfig → нет авто-подключения при загрузке
// - Нет QueryClientProvider → нет лишних зависимостей
// - Приложение запускается мгновенно и стабильно

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)