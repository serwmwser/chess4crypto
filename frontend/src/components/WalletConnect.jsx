import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { formatEther, parseEther } from 'viem';

// 🔗 Токен GROK на four.meme
const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const GROK_BUY_URL = `https://four.meme/token/${GROK_CONTRACT}?code=AHGX96R5GHK9`;
const MIN_BNB_FOR_GAS = 0.002; // Минимум BNB для газа

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const {  balanceData } = useBalance({ address, chainId: bsc.id });
  
  const [showModal, setShowModal] = useState(false);
  const [showGrokGuide, setShowGrokGuide] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Ждём гидратации
  useEffect(() => { setMounted(true); }, []);

  // ✅ Авто-переключение на BSC
  useEffect(() => {
    if (isConnected && chain?.id !== bsc.id && chain?.id !== 97) {
      switchChain({ chainId: bsc.id });
    }
  }, [isConnected, chain, switchChain]);

  // 📋 Копирование адреса в буфер
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(GROK_CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (!mounted) return <button disabled style={styles.btnDisabled}>⏳ Загрузка...</button>;

  // 💰 Баланс
  const bnbBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const hasEnoughBnb = bnbBalance >= MIN_BNB_FOR_GAS;

  // ✅ Если подключено: адрес + баланс + кнопка GROK
  if (isConnected && address) {
    return (
      <div style={styles.connectedContainer}>
        <button onClick={() => disconnect()} style={styles.disconnectBtn} title="Отключить">
          🔗 {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        <span style={styles.balanceText}>
          {bnbBalance.toFixed(4)} BNB
          {!hasEnoughBnb && <span style={styles.lowBadge}> ⚠️</span>}
        </span>
        <button 
          onClick={() => setShowGrokGuide(true)} 
          style={styles.grokBtn}
          title="Купить GROK на four.meme"
        >
          🐸 Купить GROK
        </button>

        {/* 🐸 Модальное окно инструкции по покупке GROK */}
        {showGrokGuide && (
          <div style={styles.overlay} onClick={() => setShowGrokGuide(false)}>
            <div style={styles.grokModal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.grokTitle}>🐸 Купить токен GROK</h3>
              
              <div style={styles.stepsContainer}>
                <div style={styles.step}>
                  <span style={styles.stepNum}>1</span>
                  <p style={styles.stepText}>
                    Перейди на сайт и подключи кошелёк в сети <strong>BNB Chain</strong>:
                  </p>
                  <a 
                    href={GROK_BUY_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.linkBtn}
                  >
                    🔗 Открыть four.meme →
                  </a>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>2</span>
                  <p style={styles.stepText}>
                    Убедись, что на кошельке есть <strong>BNB</strong> для газа и покупки.
                    {bnbBalance < MIN_BNB_FOR_GAS && (
                      <span style={styles.warning}>⚠️ У тебя {bnbBalance.toFixed(4)} BNB — нужно минимум {MIN_BNB_FOR_GAS}</span>
                    )}
                  </p>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>3</span>
                  <p style={styles.stepText}>
                    Купи монету <strong>GROK</strong> на любую сумму.
                  </p>
                </div>

                <div style={styles.step}>
                  <span style={styles.stepNum}>4</span>
                  <p style={styles.stepText}>
                    Добавь токен в кошелёк для отображения:
                  </p>
                  <div style={styles.contractBox}>
                    <code style={styles.contractCode}>
                      {GROK_CONTRACT.slice(0, 10)}...{GROK_CONTRACT.slice(-8)}
                    </code>
                    <button onClick={copyAddress} style={styles.copyBtn}>
                      {copied ? '✅ Скопировано' : '📋 Копировать'}
                    </button>
                  </div>
                  <p style={styles.hint}>
                    В MetaMask: Настройки → Токены → Импорт токенов → вставь адрес
                  </p>
                </div>
              </div>

              <div style={styles.footer}>
                <a 
                  href={GROK_BUY_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.primaryBtn}
                >
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

  // ❌ Если не подключено: модалка с подключением + инструкция по GROK
  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.connectBtn} disabled={isPending}>
        {isPending ? '⏳ Подключение...' : '🦊 Подключить / Купить GROK'}
      </button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>🔗 Подключите кошелёк</h3>
            <p style={styles.modalSubtitle}>
              Для покупки GROK подключите кошелёк в сети <strong>BNB Chain</strong>.
            </p>

            <div style={styles.connectorsGrid}>
              {connectors.map((conn) => (
                <button
                  key={conn.uid || conn.id}
                  disabled={!conn.ready || isPending}
                  onClick={() => {
                    connect({ connector: conn });
                    setShowModal(false);
                    // После подключения сразу открываем гайд по GROK
                    setTimeout(() => setShowGrokGuide(true), 500);
                  }}
                  style={{
                    ...styles.connectorBtn,
                    opacity: conn.ready ? 1 : 0.5,
                    cursor: conn.ready ? 'pointer' : 'not-allowed'
                  }}
                >
                  {conn.name} {isPending ? '⏳' : ''}
                </button>
              ))}
            </div>

            {/* 🐸 Быстрый доступ к покупке */}
            <div style={styles.grokQuickSection}>
              <p style={styles.grokQuickTitle}>🐸 Хотите купить GROK?</p>
              <p style={styles.grokQuickText}>
                Следуйте инструкции после подключения кошелька.
              </p>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setShowGrokGuide(true);
                }} 
                style={styles.grokQuickBtn}
                disabled={!isConnected}
              >
                Показать инструкцию →
              </button>
            </div>

            {error && (
              <p style={styles.errorText}>⚠️ {error.shortMessage || error.message}</p>
            )}

            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}

// 🎨 Стили (полностью инлайн)
const styles = {
  connectedContainer: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  disconnectBtn: { padding: '8px 12px', background: '#1e293b', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  balanceText: { color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  lowBadge: { background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' },
  grokBtn: { padding: '8px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  
  connectBtn: { padding: '9px 15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  btnDisabled: { padding: '9px 15px', background: '#475569', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'not-allowed' },
  
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' },
  
  modal: { background: '#0f172a', borderRadius: '14px', padding: '1.5rem', maxWidth: '360px', width: '90%', border: '2px solid #3b82f6', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' },
  modalTitle: { color: '#f59e0b', marginBottom: '0.5rem', textAlign: 'center', margin: '0 0 0.5rem 0' },
  modalSubtitle: { color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem', lineHeight: '1.4' },
  connectorsGrid: { display: 'grid', gap: '0.5rem', marginBottom: '1rem' },
  connectorBtn: { padding: '0.85rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem' },
  errorText: { color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px' },
  closeBtn: { marginTop: '0.5rem', width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' },
  
  // 🐸 GROK Guide styles
  grokModal: { background: '#0f172a', borderRadius: '14px', padding: '1.5rem', maxWidth: '420px', width: '95%', border: '2px solid #22c55e', boxShadow: '0 12px 40px rgba(34,197,94,0.3)' },
  grokTitle: { color: '#22c55e', marginBottom: '1rem', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1.2rem' },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  step: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  stepNum: { background: '#22c55e', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 },
  stepText: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' },
  warning: { display: 'block', color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.3rem' },
  linkBtn: { display: 'inline-block', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.3rem' },
  contractBox: { background: '#1e293b', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' },
  contractCode: { color: '#22c55e', fontSize: '0.85rem', fontFamily: 'monospace', flex: 1 },
  copyBtn: { padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  hint: { color: '#64748b', fontSize: '0.75rem', marginTop: '0.3rem', fontStyle: 'italic' },
  footer: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  primaryBtn: { padding: '0.85rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center' },
  
  // Quick section
  grokQuickSection: { background: 'rgba(34,197,94,0.1)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' },
  grokQuickTitle: { color: '#22c55e', fontWeight: 'bold', margin: '0 0 0.3rem 0' },
  grokQuickText: { color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.5rem 0' },
  grokQuickBtn: { padding: '0.6rem 1rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }
};