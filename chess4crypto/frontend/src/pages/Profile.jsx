import { useAccount } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import ChallengePanel from '../components/ChallengePanel';

export default function Profile() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>👤 Профиль игрока</h2>
        <p style={styles.subtitle}>Подключите кошелёк, чтобы видеть статистику и управлять вызовами</p>
        <div style={styles.connectBox}>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👤 Профиль игрока</h2>
      
      <div style={styles.walletBar}>
        <span style={styles.addressBadge}>🔗 {address.slice(0, 6)}...{address.slice(-4)}</span>
        <WalletConnect />
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>1247</div>
          <div style={styles.statLabel}>🏆 Рейтинг Elo</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>68%</div>
          <div style={styles.statLabel}>📈 Винрейт</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>142</div>
          <div style={styles.statLabel}>⚔️ Сыграно партий</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎯 Вызовы и ставки в GROK</h3>
        <ChallengePanel />
      </div>
    </div>
  );
}

// 🎨 Стили
const styles = {
  container: { maxWidth: '600px', margin: '2rem auto', padding: '0 1rem', color: '#e2e8f0' },
  title: { color: '#f59e0b', textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.8rem', margin: '0 0 1.5rem 0' },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' },
  connectBox: { display: 'flex', justifyContent: 'center', marginTop: '1rem' },
  
  walletBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', padding: '0.8rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #334155' },
  addressBadge: { color: '#4ade80', fontFamily: 'monospace', fontSize: '0.9rem' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#1e293b', borderRadius: '12px', padding: '1rem', textAlign: 'center', border: '1px solid #334155' },
  statValue: { color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.3rem' },
  statLabel: { color: '#94a3b8', fontSize: '0.85rem' },
  
  section: { background: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155' },
  sectionTitle: { color: '#f59e0b', marginBottom: '1rem', margin: '0 0 1rem 0', fontSize: '1.2rem' }
};