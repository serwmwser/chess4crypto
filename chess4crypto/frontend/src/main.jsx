import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Web3Provider } from './Web3Provider.jsx'
import './index.css'

// ✅ Поиск корневого элемента
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('❌ FATAL: Элемент <div id="root"></div> не найден в index.html')
  document.body.innerHTML = '<h1 style="color: #fff; text-align: center; margin-top: 2rem;">Ошибка: не найден элемент #root</h1>'
} else {
  try {
    // ✅ Создаём корень и рендерим приложение с провайдерами
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <Web3Provider>
          <App />
        </Web3Provider>
      </React.StrictMode>
    )
    console.log('✅ React-приложение успешно смонтировано в #root')
  } catch (error) {
    // ✅ Если при рендере возникнет ошибка — покажем её на экране вместо зелёного фона
    console.error('❌ Ошибка рендеринга React:', error)
    rootElement.innerHTML = `
      <div style="color: #fff; padding: 2rem; max-width: 600px; margin: 0 auto; font-family: system-ui;">
        <h2 style="color: #ef4444;">⚠️ Ошибка загрузки приложения</h2>
        <p>Проверьте консоль браузера (F12) для подробностей.</p>
        <pre style="background: #1e293b; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 0.8rem;">
          ${error.message}
        </pre>
      </div>
    `
  }
}