import { useReadContract } from 'wagmi';
import { TOKEN_ADDRESS } from '../utils/web3';

const ERC20_ABI = [
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

export default function TokenSupplyCounter() {
  const { data: totalSupply, isLoading: loadSupply } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
  });

  const { data: decimals, isLoading: loadDecimals } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  if (loadSupply || loadDecimals) {
    return <div style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>🔄 Загрузка данных токена...</div>;
  }

  const dec = Number(decimals) || 18;
  const supply = totalSupply ? Number(totalSupply) / Math.pow(10, dec) : 0;

  return (
    <div style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 0.3rem', color: '#00d4ff' }}>📊 Токенов в обращении</h4>
      <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.3rem 0', color: '#fff' }}>
        {supply.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>GROK • BSC Network</p>
    </div>
  );
}