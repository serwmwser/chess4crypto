import { useAccount, useBalance } from 'wagmi';
import { TOKEN_ADDRESS } from '../utils/web3';

export default function PlayerProfile() {
  const { address } = useAccount();

  const {  balance, isLoading, isError, error } = useBalance({
    address,
    token: TOKEN_ADDRESS,
  });

  if (!address) return <p style={{ color: '#888', textAlign: 'center' }}>Подключите кошелёк для просмотра профиля</p>;
  if (isLoading) return <p style={{ color: '#888', textAlign: 'center' }}>⏳ Загрузка баланса...</p>;
  if (isError) return <p style={{ color: '#ef4444', textAlign: 'center' }}>❌ Ошибка: {error?.shortMessage || error?.message}</p>;

  const formattedBalance = balance ? Number(balance.formatted).toFixed(4) : '0.0000';
  const symbol = balance?.symbol || 'GROK';

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      padding: '1.5rem', 
      borderRadius: '12px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      flexWrap: 'wrap', 
      gap: '1rem' 
    }}>
      <div>
        <h3 style={{ margin: '0 0 0.3rem' }}>👤 Профиль игрока</h3>
        <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
          Адрес: <code style={{ background: '#111', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{address.slice(0, 6)}...{address.slice(-4)}</code>
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>Баланс токенов</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', margin: '0.2rem 0' }}>
          {formattedBalance} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>{symbol}</span>
        </p>
      </div>
    </div>
  );
}