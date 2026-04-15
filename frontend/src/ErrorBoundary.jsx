import { Component } from 'react'

/**
 * 🛡️ ErrorBoundary — перехватывает ошибки рендеринга и показывает понятное сообщение
 * Критично для мобильных устройств, где консоль недоступна
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Обновляем состояние, чтобы показать fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Логируем ошибку для отладки
    console.error('🚨 Chess4Crypto crashed:', error, errorInfo)
    
    // Сохраняем в localStorage для удалённой отладки
    try {
      const errorData = {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        time: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
      localStorage.setItem('chess4crypto_crash_report', JSON.stringify(errorData))
    } catch (e) {
      console.error('Failed to save error report:', e)
    }
  }

  handleReload = () => {
    // Очищаем кэш и перезагружаем
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)))
    }
    localStorage.removeItem('chess4crypto_crash_report')
    window.location.reload()
  }

  handleCopyError = async () => {
    const errorText = `
Chess4Crypto Error Report
========================
Time: ${new Date().toISOString()}
URL: ${window.location?.href || 'unknown'}
UA: ${navigator?.userAgent || 'unknown'}

Error: ${this.state.error?.message || 'Unknown'}
Stack: ${this.state.error?.stack || 'No stack'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack'}
    `.trim()
    
    try {
      await navigator.clipboard.writeText(errorText)
      alert('📋 Отчёт об ошибке скопирован! Отправьте его разработчику.')
    } catch (e) {
      alert('Не удалось скопировать. Скопируйте текст вручную.')
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box'
        }}>
          {/* Иконка ошибки */}
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'pulse 2s infinite'
          }}>
            ⚠️
          </div>
          
          {/* Заголовок */}
          <h1 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 'bold', 
            color: '#f87171',
            margin: '0 0 0.5rem 0'
          }}>
            Что-то пошло не так
          </h1>
          
          {/* Описание */}
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '0.95rem', 
            marginBottom: '1.5rem',
            lineHeight: 1.5,
            maxWidth: '400px'
          }}>
            Приложение не смогло загрузиться на вашем устройстве. 
            Это может быть связано с устаревшим браузером или временной ошибкой сети.
          </p>
          
          {/* Кнопки действий */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', maxWidth: '320px' }}>
            <button 
              onClick={this.handleReload}
              style={{
                padding: '0.9rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄 Обновить страницу
            </button>
            
            <button 
              onClick={this.handleCopyError}
              style={{
                padding: '0.8rem 1.5rem',
                background: '#334155',
                color: '#e2e8f0',
                border: '1px solid #475569',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📋 Скопировать отчёт об ошибке
            </button>
          </div>
          
          {/* Детали ошибки (раскрывающиеся) */}
          <details style={{ 
            marginTop: '1.5rem',
            background: '#1e293b',
            padding: '1rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            fontSize: '0.75rem',
            textAlign: 'left',
            border: '1px solid #334155'
          }}>
            <summary style={{ 
              cursor: 'pointer', 
              color: '#60a5fa',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              🔧 Технические детали (для разработчика)
            </summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              color: '#94a3b8',
              margin: 0,
              fontSize: '0.7rem',
              lineHeight: 1.4
            }}>
              {this.state.error?.toString() || 'No error details'}
              {'\n\n'}
              {this.state.errorInfo?.componentStack || 'No component stack'}
            </pre>
          </details>
          
          {/* Футер */}
          <p style={{
            marginTop: '2rem',
            color: '#64748b',
            fontSize: '0.8rem'
          }}>
            Chess4Crypto © 2024
          </p>
          
          {/* Анимация пульсации для иконки */}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(0.95); }
            }
          `}</style>
        </div>
      )
    }
    
    return this.props.children
  }
}

export default ErrorBoundary