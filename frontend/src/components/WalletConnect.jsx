import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { useState } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showHelp, setShowHelp] = useState(false);

  // Если уже подключен
  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} style={btnStyle('#ef4444')}>
        🔗 {address.slice(0, 6)}...{address.slice(-4)} (Откл.)
      </button>
    );
  }

  // Обработка ошибки подключения
  const handleConnect = () => {
    const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
    if (!connector) {
      setShowHelp(true);
      return;
    }
    connect({ connector }).catch((err) => {
      console.error('Connect error:', err);
      if (err?.message?.includes('not found') || err?.message?.includes('Provider not found')) {
        setShowHelp(true);
      }
    });
  };

  return (
    <>
      <button 
        onClick={handleConnect} 
        disabled={isPending} 
        style={btnStyle(isPending ? '#64748b' : '#3b82f6')}
      >
        {isPending ? '⏳ Подключение...' : '🦊 Подключить кошелёк'}
      </button>

      {/* Модальное окно помощи */}
      {(showHelp || error?.message?.includes('not found')) && (
        <div style={overlayStyle} onClick={() => setShowHelp(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b' }}>🦊 MetaMask не найден</h3>
            
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem' }}><strong>Возможные причины:</strong></p>
              <ol style={{ paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.3rem' }}>Расширение не установлено</li>
                <li style={{ marginBottom: '0.3rem' }}>Браузер в режиме инкогнито (разрешите расширение)</li>
                <li style={{ marginBottom: '0.3rem' }}>MetaMask заблокирован или не разблокирован</li>
                <li>Используется неподдерживаемый браузер</li>
              </ol>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <a 
                href="https://metamask.io/download" 
                target="_blank" 
                rel="noopener noreferrer"
                style={btnStyle('#10b981')}
              >
                📥 Установить MetaMask
              </a>
              <button onClick={() => setShowHelp(false)} style={btnStyle('#64748b')}>
                Я проверю и попробую снова
              </button>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
              💡 После установки обновите страницу (Ctrl + R)
            </p>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle = (bg) => ({
  padding: '8px 14px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  transition: 'opacity 0.2s',
  opacity: bg === '#64748b' ? 0.8 : 1
});

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalStyle = {
  background: '#1e293b',
  borderRadius: '12px',
  padding: '1.5rem',
  maxWidth: '400px',
  width: '100%',
  border: '2px solid #f59e0b',
  textAlign: 'center'
};