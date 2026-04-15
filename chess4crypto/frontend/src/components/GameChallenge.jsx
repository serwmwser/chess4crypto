import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useLanguage } from '../contexts/LanguageContext';
import { chessABI, erc20ABI, TOKEN_ADDRESS, CONTRACT_ADDRESS } from '../utils/web3';

export default function GameChallenge({ onGameCreated }) {
  const { t } = useLanguage();
  const { address } = useAccount();
  const [stake, setStake] = useState('');
  const [step, setStep] = useState(0); // 0: ввод, 1: approve, 2: create
  
  // Хуки Wagmi для двух транзакций
  const approveTx = useWriteContract();
  const createTx = useWriteContract();
  
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveTx.data });
  const createReceipt = useWaitForTransactionReceipt({ hash: createTx.data });

  const handleApprove = async () => {
    if (!stake || !address) return;
    const amount = parseUnits(stake, 18);
    setStep(1);
    approveTx.writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const handleCreate = async () => {
    if (!stake || !address) return;
    const amount = parseUnits(stake, 18);
    setStep(2);
    createTx.writeContract({
      address: CONTRACT_ADDRESS,
      abi: chessABI,
      functionName: 'createChallenge',
      args: [amount, 0], // 0 = индекс таймера (пока тест, позже привяжем к стейту)
    });
  };

  // После успешного создания вызова
  if (createReceipt.isSuccess && createTx.data) {
    // В реальном приложении парсим логи, здесь упрощённо
    onGameCreated?.(`game-${Date.now()}`); 
    return <div style={{ color: '#4ade80', textAlign: 'center', padding: '1rem' }}>✅ Вызов создан! Ожидание соперника...</div>;
  }

  const isLoading = approveTx.isPending || createTx.isPending || approveReceipt.isLoading || createReceipt.isLoading;

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
      <h4 style={{ margin: '0 0 1rem' }}>{t('createChallenge') || '💰 Создать вызов'}</h4>
      
      <input 
        type="number" 
        value={stake}
        onChange={e => setStake(e.target.value)}
        placeholder="Сумма ставки (токены)"
        disabled={isLoading}
        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: 'white', marginBottom: '1rem' }}
      />

      {step === 0 && (
        <button onClick={handleApprove} disabled={!stake || isLoading} style={{ width: '100%', padding: '0.75rem', background: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          1️⃣ Разрешить списание токенов
        </button>
      )}

      {step === 1 && (
        <button onClick={handleCreate} disabled={isLoading} style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isLoading ? '⏳ Подтверждение...' : '2️⃣ Создать вызов'}
        </button>
      )}

      {isLoading && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '0.5rem' }}>
          Подтвердите транзакцию в кошельке...
        </p>
      )}
    </div>
  );
}