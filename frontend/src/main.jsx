import React from 'react'
import ReactDOM from 'react-dom/client'

// 🔍 Минимальная проверка перед загрузкой тяжёлых модулей
console.log('🚀 Chess4Crypto starting...')

// ✅ Аварийный рендер: показывает ошибку, если что-то пошло не так
function renderError(message, details = '') {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;background:#0b1120;color:#e2e8f0;font-family:sans-serif;padding:2rem">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#000;padding:0.75rem 1rem;text-align:center;font-weight:600;margin-bottom:1rem">
          ⚠️ Ошибка загрузки приложения
        </div>
        <div style="background:#1e293b;border:2px solid #ef4444;border-radius:12px;padding:1.5rem">
          <p style="margin:0 0 1rem 0;font-weight:600">❌ ${message}</p>
          ${details ? `<pre style="background:#0f172a;padding:1rem;border-radius:6px;overflow:auto;font-size:0.8rem;margin:0">${details}</pre>` : ''}
          <p style="color:#94a3b8;margin-top:1rem;font-size:0.9rem">
            💡 Откройте консоль (F12) для подробностей.<br>
            🔄 Попробуйте обновить страницу с очисткой кэша: Ctrl+Shift+R
          </p>
        </div>
      </div>
    `
  }
  console.error('🔴 Render error:', message, details)
}

// ✅ Проверка root-элемента
const rootElement = document.getElementById('root')
if (!rootElement) {
  renderError('Элемент <div id="root"> не найден в index.html')
} else {
  try {
    // ✅ Динамический импорт: если упадёт — покажем ошибку, а не белый экран
    Promise.all([
      import('./App'),
      import('react'),
      import('react-dom/client'),
      import('wagmi'),
      import('@tanstack/react-query')
    ]).then(([AppModule]) => {
      const App = AppModule.default
      
      // ✅ Проверка ENV (без падения, если нет)
      const envStatus = {
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗',
        WALLETCONNECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ? '✓' : '✗',
        WS_URL: import.meta.env.VITE_WS_URL ? '✓' : '✗'
      }
      console.log('🔍 ENV status:', envStatus)

      // ✅ Создаём конфиг только если есть обязательные значения
      let config, queryClient
      try {
        const { createConfig, http, injected, metaMask, walletConnect } = require('wagmi')
        const { bsc, bscTestnet } = require('wagmi/chains')
        const { QueryClient } = require('@tanstack/react-query')
        
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'
        
        config = createConfig({
          chains: [bsc, bscTestnet],
          connectors: [
            injected({ target: 'metaMask' }),
            metaMask(),
            walletConnect({ 
              projectId,
              showQrModal: true,
              metadata: {
                name: 'Chess4Crypto',
                description: 'Web3 Chess Platform',
                url: typeof window !== 'undefined' ? window.location.origin : 'https://chesscrypto.netlify.app',
                icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '']
              }
            })
          ],
          transports: { [bsc.id]: http(), [bscTestnet.id]: http() },
          ssr: typeof window === 'undefined'
        })
        
        queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
            mutations: { retry: false }
          }
        })
      } catch (cfgErr) {
        console.warn('⚠️ Wagmi config failed, using fallback:', cfgErr.message)
      }

      // ✅ Рендер приложения
      ReactDOM.createRoot(rootElement).render(
        React.createElement(React.StrictMode, null,
          config && queryClient 
            ? React.createElement(require('wagmi').WagmiProvider, { config },
                React.createElement(require('@tanstack/react-query').QueryClientProvider, { client: queryClient },
                  React.createElement(App)
                )
              )
            : React.createElement('div', { style: { padding: '2rem', textAlign: 'center' } },
                React.createElement('h2', { style: { color: '#f59e0b' } }, '♟️ Chess4Crypto'),
                React.createElement('p', null, '⚠️ Кошелёк временно недоступен. Попробуйте позже.'),
                React.createElement('button', {
                  style: { marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
                  onClick: () => window.location.reload()
                }, '🔄 Обновить страницу')
              )
        )
      )
      console.log('✅ App rendered')
    }).catch(err => {
      console.error('❌ Dynamic import failed:', err)
      renderError('Не удалось загрузить модули приложения', err.stack || err.message)
    })
  } catch (err) {
    console.error('❌ Root render failed:', err)
    renderError('Ошибка инициализации React', err.stack || err.message)
  }
}