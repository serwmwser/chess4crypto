import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { supabase } from '../lib/supabaseClient'; // Убедитесь, что путь верный

// 🔗 Контракты
const GROK_ADDRESS = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const ESCROW_ADDRESS = '0xВАШ_АДРЕС_ЭСКРОУ_КОНТРАКТА'; // Замените после деплоя

// 📜 Минимальные ABI
const ERC20_ABI = [
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "owner", type: "address" }, { internalType: "address", name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }
];

const ESCROW_ABI = [
  { inputs: [{ internalType: "bytes32", name: "gameId", type: "bytes32" }, { internalType: "address", name: "opponent", type: "address" }, { internalType: "uint256", name: "betAmount", type: "uint256" }], name: "joinChallenge", outputs: [], stateMutability: "nonpayable", type: "function" }
];

const TIME_OPTIONS = [
  { label: '⏱️ 1+0 (Блиц)', value: '1+0' },
  { label: '⏱️ 3+0 (Быстрые)', value: '3+0' },
  { label: '⏱️ 5+0 (Классика)', value: '5+0' },
  { label: '⏱️ 10+0 (Рапид)', value: '10+0' }
];

export default function ChallengePanel() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
  
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState(TIME_OPTIONS[1].value);
  const [newBet, setNewBet] = useState('10');
  const [processing, setProcessing] = useState(null); // { type: 'approve' | 'join' | 'create', id?: string }

  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  const { writeContract: joinEscrow, isPending: isJoining } = useWriteContract();
  
  // ✅ Загрузка вызовов + Real-time подписка
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      const {  data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'open')
        .neq('creator', address || '')
        .order('created_at', { ascending: false });
      
      if (data) setChallenges(data);
      setLoading(false);
    };

    fetchChallenges();

    // 🔔 Подписка на изменения
    const channel = supabase.channel('challenges_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => fetchChallenges())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [address]);

  // 📝 Создание вызова
  const handleCreate = async () => {
    if (!isConnected || !address) return alert('🔗 Подключите кошелёк');
    if (parseFloat(newBet) <= 0) return alert('⚠️ Ставка должна быть > 0');

    setProcessing({ type: 'create' });
    try {
      const { error } = await supabase.from('challenges').insert({
        creator: address.toLowerCase(),
        time_control: newTime,
        bet_amount: parseFloat(newBet),
        status: 'open'
      });

      if (error) throw error;
      alert('✅ Вызов создан! Ожидание противника...');
      setNewBet('10');
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // 🤝 Присоединение к вызову (Approval + Escrow)
  const handleJoin = async (challenge) => {
    if (!isConnected || !address) return alert('🔗 Подключите кошелёк');
    if (address.toLowerCase() === challenge.creator.toLowerCase()) return alert('⚠️ Нельзя играть с собой');

    setProcessing({ type: 'approve', id: challenge.id });
    
    try {
      // 1. Approve GROK для эскроу
      await approve({
        address: GROK_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ESCROW_ADDRESS, parseUnits(String(challenge.bet_amount), 18)]
      });

      // Ждём подтверждения транзакции approve (упрощённо через таймаут для UX)
      setProcessing({ type: 'join', id: challenge.id });
      
      // 2. Вызываем эскроу-контракт (заглушка под ваш контракт)
      // Замените на реальный вызов после деплоя эскроу
      /* await joinEscrow({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'joinChallenge',
        args: [challenge.id, challenge.creator, parseUnits(String(challenge.bet_amount), 18)]
      }); */

      // 3. Обновляем статус в Supabase
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'matched', opponent: address.toLowerCase() })
        .eq('id', challenge.id);

      if (error) throw error;
      alert('✅ Вы присоединились! Игра начинается...');
      
      // TODO: Редирект на страницу игры с challenge.id
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка: ' + (err.shortMessage || err.message));
    } finally {
      setProcessing(null);
    }
  };

  if (!isConnected) {
    return (
      <div style={styles.card}>
        <p style={styles.warningText}>🔗 Подключите кошелёк для создания вызовов и ставок в GROK</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* 📑 Вкладки */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('create')} 
          style={{ ...styles.tab, background: activeTab === 'create' ? '#3b82f6' : '#1e293b' }}
        >📤 Создать вызов</button>
        <button 
          onClick={() => setActiveTab('list')} 
          style={{ ...styles.tab, background: activeTab === 'list' ? '#3b82f6' : '#1e293b' }}
        >📥 Активные вызовы ({challenges.length})</button>
      </div>

      {activeTab === 'create' ? (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>⚔️ Создать вызов на игру</h3>
          
          <label style={styles.label}>⏱️ Контроль времени</label>
          <select value={newTime} onChange={(e) => setNewTime(e.target.value)} style={styles.select}>
            {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <label style={styles.label}>💰 Ставка в GROK</label>
          <input 
            type="number" 
            min="1" 
            step="1" 
            value={newBet} 
            onChange={(e) => setNewBet(e.target.value)} 
            style={styles.input}
            placeholder="Введите сумму"
          />

          <button 
            onClick={handleCreate} 
            disabled={processing?.type === 'create'} 
            style={styles.primaryBtn}
          >
            {processing?.type === 'create' ? '⏳ Создание...' : '🚀 Разместить вызов'}
          </button>
        </div>
      ) : (
        <div style={styles.listContainer}>
          {loading ? (
            <p style={styles.loadingText}>⏳ Загрузка вызовов...</p>
          ) : challenges.length === 0 ? (
            <div style={styles.emptyState}>
              <p>📭 Нет активных вызовов</p>
              <button onClick={() => setActiveTab('create')} style={styles.linkBtn}>Создать первый вызов →</button>
            </div>
          ) : (
            challenges.map(ch => (
              <div key={ch.id} style={styles.challengeCard}>
                <div style={styles.challengeHeader}>
                  <span style={styles.timeBadge}>{ch.time_control}</span>
                  <span style={styles.betBadge}>💰 {ch.bet_amount} GROK</span>
                </div>
                <p style={styles.challengeInfo}>
                  Создатель: <code>{ch.creator.slice(0, 6)}...{ch.creator.slice(-4)}</code>
                </p>
                <button 
                  onClick={() => handleJoin(ch)} 
                  disabled={processing?.id === ch.id} 
                  style={{
                    ...styles.joinBtn,
                    background: processing?.id === ch.id ? '#64748b' : '#22c55e',
                    cursor: processing?.id === ch.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {processing?.id === ch.id ? '⏳ Обработка...' : '🤝 Принять вызов'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// 🎨 Стили
const styles = {
  card: { background: '#0f172a', borderRadius: '16px', padding: '1.5rem', maxWidth: '500px', margin: '0 auto', border: '1px solid #334155', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: { flex: 1, padding: '0.7rem', color: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: '0.2s' },
  
  formContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formTitle: { color: '#f59e0b', margin: '0 0 0.5rem 0', textAlign: 'center' },
  label: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.3rem' },
  select: { width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '1rem' },
  input: { width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '1rem' },
  primaryBtn: { width: '100%', padding: '0.85rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '0.5rem' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  loadingText: { color: '#94a3b8', textAlign: 'center' },
  emptyState: { textAlign: 'center', padding: '2rem 0', color: '#94a3b8' },
  linkBtn: { background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.5rem' },
  
  challengeCard: { background: '#1e293b', borderRadius: '12px', padding: '1rem', border: '1px solid #334155' },
  challengeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  timeBadge: { background: '#334155', color: '#e2e8f0', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  betBadge: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  challengeInfo: { color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.75rem 0' },
  joinBtn: { width: '100%', padding: '0.6rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: '0.2s' },
  
  warningText: { color: '#f59e0b', textAlign: 'center', margin: 0 }
};