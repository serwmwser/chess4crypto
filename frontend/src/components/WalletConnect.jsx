import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';

// 🔗 Токен GROK
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const GROK_BUY_URL = `https://four.meme/token/${GROK_CONTRACT}?code=AHGX96R5GHK9`;

export default function WalletConnect() {
  const { address, isConnected, chain, connector: activeConnector } = useAccount();
  const { connectors, connect, isPending, error,  status } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const [showModal, setShowModal] = useState(false);
  const [showGrokGuide, setShowGrokGuide] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // ✅ Гидратация + отладка
  useEffect(() => {
    setMounted(true);
    
    // 🐛 Логи для диагностики
    console.log('🔍 WalletConnect debug:', {
      mounted: true,
      isConnected,
      address,
      chain: chain?.name,
      connectors: connectors.map(c => ({ name: c.name, ready: c.ready, id: c.id })),
      isPending,
      error: error?.message,
      hasMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask
    });
    
    setDebugInfo({
      hasMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask,
      connectorsCount: connectors.length,
      readyConnectors: connectors.filter(c => c.ready).map(c => c.name)
    });
  }, [isConnected, address, chain, connectors, isPending, error]);

  // ✅ Авто-переключение на BSC
  useEffect(() => {
    if (isConnected && chain?.id !== bsc.id && chain?.id !== 97) {
      console.log('🔄 Switching to BSC...');
      switchChain({ chainId: bsc.id }).catch(err => {
        console.error('❌ Chain switch failed:', err);
      });
    }
  }, [isConnected, chain, switchChain]);

  // 📋 Копирование адреса
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(GROK_CONTRACT);
      alert('✅ Адрес скопирован!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('❌ Не удалось скопировать');
    }
  };

  // 🔄 Обработчик подключения с отладкой
  const handleConnect = async (connector) => {
    console.log(`🔗 Connecting to ${connector.name}...`);
    try {
      await connect({ connector });
      console.log('✅ Connection initiated');
      setShowModal(false);
      // После успешного подключения — сразу показываем гайд по GROK
      setTimeout(() => setShowGrokGuide(true), 800);
    } catch (err) {
      console.error('❌ Connection error:', err);
      alert(`Ошибка подключения: ${err.message || err}`);
    }
  };

  if (!mounted) {
    return (
      <button disabled style={styles.btnDisabled}>
        ⏳ Инициализация...
      </button>
    );
  }

  // ✅ Если подключено: показываем адрес + кнопку GROK
  if (isConnected && address) {
    return (
      <div style={styles.connectedContainer}>
        <button onClick={() => disconnect()} style={styles.disconnectBtn}>
          🔗 {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        <button onClick={() => setShowGrokGuide(true)} style={styles.grokBtn}>
          🐸 Купить GROK
        </button>

        {/* 🐸 Модальное окно инструкции */}
        {showGrokGuide && (
          <div style={styles.overlay} onClick={() => setShowGrokGuide(false)}>
            <div style={styles.grokModal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.grokTitle}>🐸 Купить токен GROK</h3>
              
              <div style={styles.stepsContainer}>
                <div style={styles.step}>
                  <span style={styles.stepNum}>1</span>
                  <p style={styles.stepText}>
                    Перейди на four.meme и подключи кошелёк в сети <strong>BNB Chain</strong>:
                  </p>
                  <a href={GROK_BUY_URL} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
                    🔗 Открыть four.meme →
                  </a>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>2</span>
                  <p style={styles.stepText}>Убедись, что на кошельке есть <strong>BNB</strong> для газа.</p>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>3</span>
                  <p style={styles.stepText}>Купи монету <strong>GROK</strong> на любую сумму.</p>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>4</span>
                  <p style={styles.stepText}>
                    Добавь токен в кошелёк (адрес контракта):
                  </p>
                  <div style={styles.contractBox}>
                    <code style={styles.contractCode}>
                      {GROK_CONTRACT}
                    </code>
                    <button onClick={copyAddress} style={styles.copyBtn}>
                      📋 Копировать
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.footer}>
                <a href={GROK_BUY_URL} target="_blank" rel="noopener noreferrer" style={styles.primaryBtn}>
                  🚀 Начать покупку GROK
                </a>
                <button onClick={() => setShowGrokGuide(false)} style={styles.closeBtn}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ❌ Если не подключено: модалка с коннекторами
  return (
    <>
      <button 
        onClick={() => {
          console.log('🔓 Opening wallet modal');
          setShowModal(true);
        }} 
        style={styles.connectBtn}
      >
        🦊 Подключить / Купить GROK
      </button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>🔗 Подключите кошелёк</h3>
            <p style={styles.modalSubtitle}>
              Для покупки GROK и игры подключите кошелёк в сети <strong>BNB Chain</strong>.
            </p>

            {/* 🐛 Блок отладки (показывается только в разработке) */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <details style={styles.debugBox}>
                <summary style={styles.debugSummary}>🐛 Debug info</summary>
                <pre style={styles.debugPre}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}

            <div style={styles.connectorsGrid}>
              {connectors.length === 0 ? (
                <p style={styles.noConnectors}>
                  ⚠️ Коннекторы не загружены. Проверьте консоль (F12).
                </p>
              ) : (
                connectors.map((conn) => {
                  const isDisabled = !conn.ready || isPending;
                  return (
                    <button
                      key={conn.uid || conn.id}
                      onClick={() => !isDisabled && handleConnect(conn)}
                      style={{
                        ...styles.connectorBtn,
                        opacity: isDisabled ? 0.5 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        pointerEvents: isDisabled ? 'none' : 'auto'
                      }}
                      title={!conn.ready ? 'Кошелёк не обнаружен' : ''}
                    >
                      {conn.name} {isPending && status === 'pending' ? '⏳' : ''}
                      {!conn.ready && ' 🔒'}
                    </button>
                  );
                })
              )}
            </div>

            {error && (
              <p style={styles.errorText}>
                ⚠️ {error.shortMessage || error.message || 'Ошибка подключения'}
              </p>
            )}

            {/* 🐸 Быстрый доступ */}
            <div style={styles.grokQuickSection}>
              <p style={styles.grokQuickTitle}>🐸 Купить GROK</p>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setShowGrokGuide(true);
                }} 
                style={styles.grokQuickBtn}
              >
                Показать инструкцию →
              </button>
            </div>

            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// 🎨 Стили
const styles = {
  connectedContainer: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  disconnectBtn: { padding: '8px 12px', background: '#1e293b', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  grokBtn: { padding: '8px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  
  connectBtn: { padding: '9px 15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  btnDisabled: { padding: '9px 15px', background: '#475569', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'not-allowed' },
  
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' },
  
  modal: { background: '#0f172a', borderRadius: '14px', padding: '1.5rem', maxWidth: '360px', width: '90%', border: '2px solid #3b82f6', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', position: 'relative' },
  modalTitle: { color: '#f59e0b', marginBottom: '0.5rem', textAlign: 'center', margin: '0 0 0.5rem 0' },
  modalSubtitle: { color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem', lineHeight: '1.4' },
  
  debugBox: { background: '#1e293b', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.75rem' },
  debugSummary: { cursor: 'pointer', color: '#94a3b8', marginBottom: '0.5rem' },
  debugPre: { color: '#22c55e', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  
  connectorsGrid: { display: 'grid', gap: '0.5rem', marginBottom: '1rem' },
  noConnectors: { color: '#f59e0b', textAlign: 'center', fontSize: '0.9rem' },
  connectorBtn: { padding: '0.85rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem', transition: '0.2s' },
  
  errorText: { color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px' },
  
  grokQuickSection: { background: 'rgba(34,197,94,0.1)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' },
  grokQuickTitle: { color: '#22c55e', fontWeight: 'bold', margin: '0 0 0.3rem 0' },
  grokQuickBtn: { padding: '0.6rem 1rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  
  closeBtn: { width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' },
  
  // GROK modal
  grokModal: { background: '#0f172a', borderRadius: '14px', padding: '1.5rem', maxWidth: '420px', width: '95%', border: '2px solid #22c55e', boxShadow: '0 12px 40px rgba(34,197,94,0.3)' },
  grokTitle: { color: '#22c55e', marginBottom: '1rem', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1.2rem' },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  step: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  stepNum: { background: '#22c55e', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 },
  stepText: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' },
  linkBtn: { display: 'inline-block', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.3rem' },
  contractBox: { background: '#1e293b', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' },
  contractCode: { color: '#22c55e', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', flex: '1 1 100%' },
  copyBtn: { padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  footer: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  primaryBtn: { padding: '0.85rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center' }
};