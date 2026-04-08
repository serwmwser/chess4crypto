import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';

const GROK_ADDRESS = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const GROK_ABI = [{ "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];

export default function Profile({ onNavigate }) {
  const { address, chain } = useAccount();
  const [copied, setCopied] = useState(false);

  // 📊 Читаем баланс GROK из контракта
  const { data: balanceData, isError, isLoading } = useReadContract({
    address: GROK_ADDRESS,
    abi: GROK_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const balance = balanceData ? (Number(balanceData) / 1e18).toFixed(4) : '0.0000';

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address) return <p style={{ color: '#94a3b8', textAlign: 'center' }}>🔒 Подключите кошелёк</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#f59e0b' }}>👤 Профиль игрока</h2>
      
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Ваш адрес:</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <code style={{ background: '#0f172a', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', color: '#4ade80' }}>
            {address.slice(0, 10)}...{address.slice(-8)}
          </code>
          <button onClick={copyAddress} style={{ background: copied ? '#10b981' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            {copied ? '✓' : '📋'}
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>Сеть: {chain?.name || 'Не определена'}</div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #312e81)', padding: '1rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.9rem', color: '#c7d2fe' }}>💰 Баланс GROK</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
          {isLoading ? '⏳ Загрузка...' : isError ? '❌ Ошибка' : `${balance}`}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <button onClick={() => onNavigate('play')} style={styles.actionBtn('🎮 Начать игру', '#3b82f6')}>🎮 Начать игру</button>
        <button onClick={() => onNavigate('chat')} style={styles.actionBtn('💬 Открыть чат', '#8b5cf6')}>💬 Открыть чат</button>
        <button onClick={() => window.open('https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9', '_blank')} style={styles.actionBtn('🌐 Купить GROK', '#10b981')}>🌐 Купить GROK</button>
      </div>
    </div>
  );
}

const styles = {
  actionBtn: (label, bg) => ({
    padding: '0.85rem', background: bg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
  })
};