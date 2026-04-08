import { useConnect, useDisconnect, useAccount } from 'wagmi';

export default function WalletConnect() {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <span>🔗 {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={() => disconnect()} className="btn-secondary">Отключить</button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="btn-primary"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}