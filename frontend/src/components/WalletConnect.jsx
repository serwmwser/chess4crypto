import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showHelp, setShowHelp] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Проверка, что код выполняется в браузере (защита от гидратации)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Если уже подключен — показываем адрес и кнопку отключения
  if (isConnected && address) {
    return (
      <button 
        onClick={() => disconnect()} 
        title="Отключить кошелёк"
        style={styles.connectedBtn}
      >
        🔗 {address.slice(0, 6)}...{address.slice(-4)}
        {chain?.name && <span style={styles.chainBadge}>{chain.name}</span>}
      </button>
    );
  }

  // Обработка клика по кнопке подключения
  const handleConnect = async () => {
    try {
      // Ищем коннектор MetaMask или берём первый доступный
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
      
      if (!connector) {
        setShowHelp(true);
        return;
      }

      await connect({ connector });
    } catch (err) {
      console.error('Wallet connect error:', err);
      // Если ошибка "MetaMask not found" — показываем помощь
      if (err?.message?.includes('not found') || 
          err?.message?.includes('Provider not found') ||
          err?.name === 'ConnectorNotFoundError') {
        setShowHelp(true);
      }
    }
  };

  // Если ещё не клиент (гидратация) — показываем заглушку
  if (!isClient) {
    return <span style={styles.placeholder}>⚙️</span>;
  }

  return (
    <>
      {/* Кнопка подключения */}
      <button 
        onClick={handleConnect} 
        disabled={isPending} 
        title={isPending ? 'Подключение...' : 'Подключить криптокошелёк'}
        style={isPending ? styles.btnPending : styles.btnPrimary}
      >
        {isPending ? '⏳ Подключение...' : '🦊 Подключить кошелёк'}
      </button>

      {/* Модальное окно помощи при ошибке */}
      {(showHelp || error?.message?.includes('not found')) && (
        <div style={styles.overlay} onClick={() => setShowHelp(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>🦊 MetaMask не найден</h3>
            
            <div style={styles.helpContent}>
              <p style={styles.helpText}><strong>Возможные причины:</strong></p>
              <ol style={styles.helpList}>
                <li>Расширение не установлено в браузере</li>
                <li>Браузер в режиме инкогнито (разрешите расширение в настройках)</li>
                <li>MetaMask заблокирован или не разблокирован паролем</li>
                <li>Используется неподдерживаемый браузер (нужен Chrome, Edge, Brave)</li>
              </ol>
            </div>

            <div style={styles.helpActions}>
              <a 
                href="https://metamask.io/download" 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.btnInstall}
              >
                📥 Установить MetaMask
              </a>
              <button 
                onClick={() => setShowHelp(false)} 
                style={styles.btnRetry}
              >
                ✓ Я проверил, попробовать снова
              </button>
            </div>

            <p style={styles.helpHint}>
              💡 После установки расширения обновите страницу: <strong>Ctrl + R</strong>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// 🎨 Стили компонента
const styles = {
  // Кнопка подключённого кошелька
  connectedBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
  },
  
  // Бейдж сети
  chainBadge: {
    fontSize: '0.75rem',
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '4px',
    marginLeft: '4px'
  },
  
  // Основная кнопка подключения
  btnPrimary: {
    padding: '8px 14px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
  },
  
  // Кнопка в состоянии загрузки
  btnPending: {
    padding: '8px 14px',
    background: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontWeight: '600',
    fontSize: '0.9rem',
    opacity: 0.8
  },
  
  // Заглушка при гидратации
  placeholder: {
    padding: '8px 14px',
    color: '#94a3b8',
    fontSize: '0.9rem'
  },
  
  // Оверлей модального окна
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
    backdropFilter: 'blur(4px)'
  },
  
  // Модальное окно
  modal: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '1.5rem',
    maxWidth: '420px',
    width: '100%',
    border: '2px solid #f59e0b',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    textAlign: 'center'
  },
  
  // Заголовок модального окна
  modalTitle: {
    margin: '0 0 1rem 0',
    color: '#f59e0b',
    fontSize: '1.2rem',
    fontWeight: '700'
  },
  
  // Контент помощи
  helpContent: {
    textAlign: 'left',
    marginBottom: '1.25rem'
  },
  
  helpText: {
    margin: '0 0 0.75rem 0',
    color: '#e2e8f0',
    fontSize: '0.95rem'
  },
  
  helpList: {
    paddingLeft: '1.3rem',
    color: '#94a3b8',
    fontSize: '0.85rem',
    lineHeight: '1.6',
    margin: 0
  },
  
  // Кнопки в модальном окне
  helpActions: {
    display: 'grid',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  
  btnInstall: {
    padding: '0.85rem 1rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    textDecoration: 'none',
    display: 'block',
    transition: 'transform 0.15s'
  },
  
  btnRetry: {
    padding: '0.75rem 1rem',
    background: '#334155',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem'
  },
  
  // Подсказка внизу
  helpHint: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: '1.4'
  }
};